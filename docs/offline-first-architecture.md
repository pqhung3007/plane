# Offline-First Architecture

## Overview

One of the most impressive features of the Plane frontend is its **offline-first architecture** using SQLite running in Web Workers. This allows the application to function completely offline while providing seamless synchronization with the server.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Main Thread                                  │
│                                                                  │
│  ┌──────────────┐      ┌────────────────┐      ┌──────────────┐│
│  │  Component   │─────▶│  MobX Store    │─────▶│   Storage    ││
│  │              │◀─────│                │◀─────│   (Facade)   ││
│  └──────────────┘      └────────────────┘      └──────┬───────┘│
│                                                         │        │
└─────────────────────────────────────────────────────────┼────────┘
                                                          │
                                                   Comlink │
                                                    Proxy  │
┌─────────────────────────────────────────────────────────┼────────┐
│                     Web Worker Thread                    ▼        │
│                                                                   │
│              ┌────────────────────────────┐                      │
│              │    DBClass (Worker)        │                      │
│              │  - exec(sql)               │                      │
│              │  - close()                 │                      │
│              └───────────┬────────────────┘                      │
│                          │                                       │
│                          ▼                                       │
│              ┌────────────────────────────┐                      │
│              │   SQLite WASM              │                      │
│              │   (Origin Private FS)      │                      │
│              └────────────────────────────┘                      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Storage Facade (`storage.sqlite.ts`)

The `Storage` class acts as the main interface between the application and the offline database.

**Location**: `apps/web/core/local-db/storage.sqlite.ts`

**Key Properties**:
```typescript
class Storage {
  db: any;                    // Comlink proxy to worker
  status: TDBStatus;          // "initializing" | "ready" | "error" | undefined
  dbName: string;             // Workspace slug used as DB name
  projectStatus: Record<string, TProjectStatus>; // Per-project sync status
  workspaceSlug: string;      // Current workspace
}
```

**Reference**: `core/local-db/storage.sqlite.ts:31-44`

### 2. Web Worker Initialization

The storage class initializes a Web Worker that runs the SQLite database in a separate thread:

```typescript
private initializeWorker = async (workspaceSlug: string) => {
  const { DBClass } = await import("./worker/db");
  const worker = new Worker(new URL("./worker/db.ts", import.meta.url));
  const MyWorker = Comlink.wrap<typeof DBClass>(worker);

  // Add cleanup on window unload
  window.addEventListener("unload", () => worker.terminate());

  this.workspaceSlug = workspaceSlug;
  this.dbName = workspaceSlug;
  const instance = await new MyWorker();
  await instance.init(workspaceSlug);

  this.db = {
    exec: instance.exec,
    close: instance.close,
  };
};
```

**Key Points**:
- Uses **Comlink** to create a proxy object for the worker
- Worker is dynamically imported to avoid bundling in SSR
- Database name is the workspace slug (one DB per workspace)
- Exposes only `exec()` and `close()` methods

**Reference**: `core/local-db/storage.sqlite.ts:72-89`

### 3. Database Tables

The local database mirrors the server's issue structure:

**Main Tables**:
- `issues` - Core issue data with 50+ columns
- `issue_relations` - Links between issues
- `options` - Key-value store for metadata

**Issue Table Schema** (key columns):
```sql
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  sequence_id INTEGER,
  name TEXT,
  description TEXT,
  state_id TEXT,
  priority TEXT,
  project_id TEXT,
  workspace_id TEXT,
  created_by TEXT,
  assignee_ids TEXT,     -- JSON array
  label_ids TEXT,        -- JSON array
  module_ids TEXT,       -- JSON array
  cycle_id TEXT,
  parent_id TEXT,
  is_draft INTEGER,
  archived_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  -- ... 30+ more columns
)
```

**Reference**: `core/local-db/utils/tables.ts`

### 4. Synchronization Strategy

#### Initial Load

When a project is first accessed, the application performs a full sync:

```typescript
_syncIssues = async (projectId: string) => {
  const queryParams = {
    cursor: `${PAGE_SIZE}:0:0`,  // 500 issues per page
    description: true,
  };

  // First page fetch
  const response = await issueService.getIssuesForSync(
    this.workspaceSlug,
    projectId,
    queryParams
  );

  await addIssuesBulk(response.results, BATCH_SIZE); // Batch of 50

  // Fetch remaining pages in parallel
  if (response.total_pages > 1) {
    const promiseArray = [];
    for (let i = 1; i < response.total_pages; i++) {
      queryParams.cursor = `${PAGE_SIZE}:${i}:0`;
      promiseArray.push(issueService.getIssuesForSync(...));
    }
    const pages = await Promise.all(promiseArray);
    for (const page of pages) {
      await addIssuesBulk(page.results, BATCH_SIZE);
    }
  }

  await createIndexes();
  this.setStatus(projectId, "ready");
};
```

**Key Points**:
- Page size: 500 issues
- Batch insert size: 50 issues
- Parallel fetching of pages after first page
- Indexes created after bulk insert (optimization)
- Project marked "ready" when complete

**Reference**: `core/local-db/storage.sqlite.ts:211-271`

#### Incremental Sync

After initial load, subsequent syncs only fetch changed issues:

```typescript
const syncedAt = await this.getLastSyncTime(projectId);

if (syncedAt) {
  queryParams["updated_at__gt"] = syncedAt;  // Only fetch issues updated after last sync
}

// ... fetch and update

if (syncedAt) {
  await syncDeletesToLocal(workspaceSlug, projectId, {
    updated_at__gt: syncedAt
  });
}
```

**Key Points**:
- Uses `updated_at__gt` filter to fetch only changed issues
- Tracks last sync time from most recently updated issue
- Handles deletions separately
- Status changes from "ready" to "syncing" during incremental sync

**Reference**: `core/local-db/storage.sqlite.ts:230-270`

### 5. Query Construction

The offline database supports complex filtering, just like the server API:

```typescript
getIssues = async (workspaceSlug, projectId, queries, config) => {
  // Fall back to server if not ready
  if (!currentProjectStatus || this.status !== "ready" ||
      currentProjectStatus === "loading" || !rootStore.user.localDBEnabled) {
    return await issueService.getIssuesFromServer(...);
  }

  // Sanitize queries
  const sanitizedQueries = sanitizeWorkItemQueries(workspaceSlug, projectId, queries);

  // Construct SQL query with filters
  const query = issueFilterQueryConstructor(workspaceSlug, projectId, sanitizedQueries);
  const countQuery = issueFilterCountQueryConstructor(workspaceSlug, projectId, sanitizedQueries);

  // Execute in parallel
  const [issuesRaw, count] = await Promise.all([
    runQuery(query),
    runQuery(countQuery)
  ]);

  // Parse and format results
  let issueResults = issuesRaw.map(issue => formatLocalIssue(issue));

  // Group results if needed
  if (groupByProperty) {
    issueResults = getGroupedIssueResults(issueResults);
  }

  return {
    results: issueResults,
    total_count,
    total_pages,
    next_cursor,
    prev_cursor,
    next_page_results
  };
};
```

**Supported Query Parameters**:
- `state_id`, `priority`, `assignees`, `labels`, `cycle`, `module`
- `created_by`, `parent_id`, `is_draft`
- `group_by`, `sub_group_by`, `order_by`
- `cursor` (pagination)
- `search` (text search)

**Reference**: `core/local-db/storage.sqlite.ts:297-395`

### 6. Fallback Mechanism

The application **gracefully falls back to the server** in several scenarios:

```typescript
if (
  !currentProjectStatus ||           // Project not yet synced
  this.status !== "ready" ||         // Database not initialized
  currentProjectStatus === "loading" || // Initial sync in progress
  currentProjectStatus === "error" || // Sync failed
  !rootStore.user.localDBEnabled     // User disabled offline mode
) {
  log(`Project ${projectId} is loading, falling back to server`);
  return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries, config);
}
```

**Fallback Triggers**:
1. Database not initialized
2. Project sync in progress
3. Sync error occurred
4. User disabled offline mode
5. Query execution fails

**Reference**: `core/local-db/storage.sqlite.ts:305-325`

### 7. Data Formatting

Issues stored in SQLite use different formats than the TypeScript types:

```typescript
const formatLocalIssue = (issue: any) => {
  const currIssue = issue;

  // Parse JSON array fields
  ARRAY_FIELDS.forEach((field: string) => {
    currIssue[field] = currIssue[field] ? JSON.parse(currIssue[field]) : [];
  });

  // Convert SQLite integers to booleans
  BOOLEAN_FIELDS.forEach((field: string) => {
    currIssue[field] = currIssue[field] === 1;
  });

  return currIssue as TIssue;
};
```

**Array Fields** (stored as JSON strings):
- `assignee_ids`, `label_ids`, `module_ids`
- `attachment_ids`, `link_ids`, `subscriber_ids`

**Boolean Fields** (stored as 0/1):
- `is_draft`, `is_local_update`, `archived_at`

**Reference**: `core/local-db/storage.sqlite.ts:482-492`

### 8. Version Management

The database tracks its own version and clears storage on schema changes:

```typescript
const dbVersion = await this.getOption("DB_VERSION");

if (
  dbVersion !== undefined &&
  dbVersion !== "" &&
  !isNaN(Number(dbVersion)) &&
  Number(dbVersion) !== DB_VERSION
) {
  log("Database version mismatch - clearing storage");
  await this.clearStorage();
  await this.initializeWorker(workspaceSlug);
} else {
  log("Database version matches - proceeding with data load");
}

await this.setOption("DB_VERSION", DB_VERSION.toString());
```

**Current Version**: 1.3

**Reference**: `core/local-db/storage.sqlite.ts:127-150`

### 9. Performance Metrics

The application tracks query performance:

```typescript
const start = performance.now();
const [issuesRaw, count] = await Promise.all([runQuery(query), runQuery(countQuery)]);
const end = performance.now();

const parsingStart = performance.now();
let issueResults = issuesRaw.map(issue => formatLocalIssue(issue));
const parsingEnd = performance.now();

const grouping = performance.now();
if (groupByProperty) {
  issueResults = getGroupedIssueResults(issueResults);
}
const groupingEnd = performance.now();

const times = {
  IssueQuery: end - start,
  Parsing: parsingEnd - parsingStart,
  Grouping: groupingEnd - grouping,
};

if ((window as any).DEBUG) {
  console.table(times);
}
```

**Measured Metrics**:
- **IssueQuery**: Time to execute SQL query
- **Parsing**: Time to parse results to TypeScript objects
- **Grouping**: Time to group results by property

**Reference**: `core/local-db/storage.sqlite.ts:333-382`

## Benefits

### 1. Instant Load Times
- No network requests for cached data
- Queries execute in <10ms typically
- UI remains responsive during sync

### 2. Offline Functionality
- Full read access when offline
- Write operations queued for next sync
- Graceful degradation

### 3. Reduced Server Load
- Most reads served from local DB
- Only changed data synced
- Parallel page fetching during sync

### 4. Better UX
- No loading spinners for cached data
- Smooth transitions between views
- Background synchronization

## Limitations

### 1. Storage Quota
- Origin Private File System has size limits
- Need to handle quota exceeded errors
- Consider implementing data pruning

### 2. Initial Sync Time
- Large projects take time to sync initially
- Blocks offline functionality until complete
- Could implement progressive loading

### 3. Memory Usage
- Web Worker adds memory overhead
- Large result sets consume memory
- Consider implementing virtual scrolling

### 4. Complexity
- More complex than server-only approach
- Requires careful synchronization logic
- Schema changes require version bumps

## Future Enhancements

### Potential Improvements

1. **Delta Sync**: Only sync changed fields, not full issues
2. **Selective Sync**: Allow users to choose which projects to sync
3. **Background Sync**: Use Background Sync API for better offline support
4. **Compression**: Compress large text fields (descriptions)
5. **Smart Prefetching**: Predict and prefetch likely-to-be-accessed data
6. **Conflict Resolution**: Better handling of offline write conflicts
7. **Storage Management**: Automatic pruning of old data

## Conclusion

The offline-first architecture is a **standout feature** that demonstrates:
- ✅ Advanced use of Web Workers and SQLite
- ✅ Sophisticated synchronization strategies
- ✅ Graceful fallback mechanisms
- ✅ Performance-conscious implementation
- ✅ User experience focus

This architecture enables Plane to function as a **progressive web application** with native-like offline capabilities, setting it apart from typical web applications.
