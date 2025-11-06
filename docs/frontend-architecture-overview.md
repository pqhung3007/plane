# Frontend Architecture Overview

## Executive Summary

The Plane frontend is a **highly sophisticated, production-grade Next.js 13+ application** utilizing the App Router architecture with advanced state management, offline-first capabilities, and multi-edition support. Built with TypeScript, React 18+, and MobX, it demonstrates enterprise-level architectural patterns suitable for complex project management applications.

## Technology Stack

| Category | Technology | Purpose |
|----------|-----------|----------|
| **Framework** | Next.js 13+ (App Router) | Server-side rendering, routing, optimization |
| **Language** | TypeScript | Type safety with strict null checks |
| **UI Library** | React 18+ | Component-based UI |
| **State Management** | MobX + Custom Stores | Reactive state management |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Data Fetching** | SWR + Axios | Stale-while-revalidate with HTTP client |
| **Offline Storage** | SQLite + Web Workers | Client-side database via Comlink |
| **Forms** | React Hook Form | Form validation and management |
| **Drag & Drop** | @atlaskit/pragmatic-drag-and-drop | Accessible drag-and-drop |
| **Rich Text** | @plane/editor (custom) | Collaborative rich text editing |
| **Analytics** | PostHog | Product analytics |
| **Icons** | Lucide React | Icon library |

## Directory Structure

```
apps/web/
├── app/                           # Next.js App Router
│   ├── (all)/                    # Route group for authenticated layouts
│   │   ├── [workspaceSlug]/      # Dynamic workspace routes
│   │   ├── profile/              # User profile pages
│   │   ├── accounts/             # Authentication pages
│   │   └── onboarding/           # Onboarding flow
│   ├── layout.tsx                # Root layout with metadata
│   ├── provider.tsx              # App-wide providers
│   ├── error.tsx                 # Error boundary
│   └── not-found.tsx             # 404 handling
├── core/                         # Base functionality (all editions)
│   ├── components/               # 46+ feature-based component directories
│   ├── store/                    # MobX state management (14 store modules)
│   ├── services/                 # API service classes
│   ├── hooks/                    # Custom React hooks (66+ hooks)
│   ├── layouts/                  # Layout components
│   ├── lib/                      # Utilities and providers
│   ├── local-db/                 # IndexedDB/SQLite offline storage
│   └── constants/                # App constants
├── ce/                           # Community Edition extensions
│   ├── store/                    # CE-specific stores (extends core)
│   └── components/               # CE component overrides
├── ee/                           # Enterprise Edition additions
│   ├── components/               # EE-only components
│   └── services/                 # EE-only services
├── helpers/                      # Helper utilities
├── styles/                       # Global CSS with Tailwind
└── public/                       # Static assets
```

## Key Architectural Features

### 1. Multi-Edition Architecture (CE/EE)

The codebase supports **Community Edition (CE)** and **Enterprise Edition (EE)** through a layered architecture:

- **`core/`**: Base functionality shared across all editions
- **`ce/`**: Community Edition extensions that override/extend core
- **`ee/`**: Enterprise Edition additional features

**Example**: The CE store extends the core store and adds additional functionality:

```typescript
// ce/store/root.store.ts
export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;

  constructor() {
    super();
    this.timelineStore = new TimeLineStore(this);
  }
}
```

**Reference**: `ce/store/root.store.ts:6-14`

### 2. Offline-First with SQLite + Web Workers

One of the most impressive features is the **offline-first architecture** using SQLite running in Web Workers:

- Uses **Comlink** to communicate between main thread and worker
- Stores issues locally for offline access
- Syncs incrementally with server
- Falls back to server when local DB is unavailable

**Key Files**:
- `core/local-db/storage.sqlite.ts` - Main storage implementation
- `core/local-db/worker/db.ts` - Web Worker database class

**Reference**: `core/local-db/storage.sqlite.ts:72-89`

### 3. Advanced MobX State Management

The application uses a **sophisticated MobX store hierarchy** with 14+ store modules:

- **Root Store**: Orchestrates all sub-stores
- **Issue Root Store**: Highly complex with 20+ sub-stores for different contexts
- **Workspace, Project, Cycle, Module stores**: Domain-specific state
- **Router Store**: Centralized routing state
- **Theme, User, CommandPalette stores**: UI state

**Store Hierarchy Example**:
```
RootStore
├── issue (IssueRootStore)
│   ├── issues (IssueStore) - Central issue storage
│   ├── issueDetail / epicDetail - Detail views
│   ├── projectIssues / projectIssuesFilter
│   ├── cycleIssues / cycleIssuesFilter
│   ├── moduleIssues / moduleIssuesFilter
│   ├── workspaceIssues / workspaceIssuesFilter
│   ├── teamIssues / teamIssuesFilter
│   ├── archivedIssues / archivedIssuesFilter
│   ├── issueKanBanView
│   └── issueCalendarView
├── workspaceRoot
├── projectRoot
├── memberRoot
├── cycle
├── module
├── router (tracks route params reactively)
└── ... (14+ total stores)
```

**Reference**: `core/store/issue/root.store.ts:48-114`

### 4. Custom Hooks Ecosystem (66+ Hooks)

The application features an extensive custom hooks library organized by purpose:

**Store Hooks** (`core/hooks/store/`):
- `useIssueDetail()` - Access issue detail store
- `useIssues()` - Access issue list store with context
- `useUserPermissions()` - Permission checking
- `useWorkspace()` - Workspace state
- And 30+ more...

**Utility Hooks**:
- `useGroupIssuesDragNDrop()` - Drag-and-drop for issue lists
- `useQueryParams()` - URL query parameter management
- `useAutoSave()` - Auto-save functionality
- `useIntersectionObserver()` - Lazy loading
- `useDebounce()` - Debounced values

**Reference**: `core/hooks/use-group-dragndrop.ts:26-124`

### 5. Service Layer Architecture

API communication follows a **class-based service pattern**:

```typescript
export class IssueService extends APIService {
  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  async createIssue(workspaceSlug: string, projectId: string, data: Partial<TIssue>): Promise<TIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/`, data)
      .then((response) => response?.data)
      .catch((error) => { throw error?.response?.data; });
  }
}
```

**Services are organized by domain**:
- `services/issue/` - Issue-related services (10+ files)
- `services/project/` - Project services
- `services/workspace/` - Workspace services
- Each service extends `APIService` base class

### 6. Advanced Component Composition

Components follow a **highly compositional pattern** with multiple layers:

**Example: Issue Peek Overview**
```
IssuePeekOverview (root.tsx)
  ├── PeekOverviewHeader (modes: side-peek, modal, full-screen)
  ├── IssueView (main content container)
  │   ├── PeekOverviewProperties (left panel - assignees, labels, etc.)
  │   ├── IssueDetailWidgets (center content)
  │   │   ├── IssueDescriptionWidget
  │   │   ├── SubIssuesWidget
  │   │   ├── LinksWidget
  │   │   ├── AttachmentsWidget
  │   │   └── RelationsWidget
  │   └── IssueActivity (activity log)
  ├── DeleteIssueModal
  ├── ArchiveIssueModal
  └── CreateIssueModal (for duplicate)
```

**Reference**: `core/components/issues/peek-overview/root.tsx:24-100`

### 7. Reactive Router Integration

The application uses an **auto-syncing router store** that keeps route parameters in sync with MobX state:

```typescript
// Issue Root Store automatically syncs with router
autorun(() => {
  if (this.workspaceSlug !== rootStore.router.workspaceSlug)
    this.workspaceSlug = rootStore.router.workspaceSlug;
  if (this.projectId !== rootStore.router.projectId)
    this.projectId = rootStore.router.projectId;
  if (this.cycleId !== rootStore.router.cycleId)
    this.cycleId = rootStore.router.cycleId;
  // ... and more
});
```

This eliminates the need to manually pass route params through components.

**Reference**: `core/store/issue/root.store.ts:207-228`

### 8. Permission-Based Rendering

Permissions are integrated into the store and checked declaratively:

```typescript
const { allowPermissions } = useUserPermissions();

if (allowPermissions([EUserPermissions.ISSUE_CREATE], EUserPermissionsLevel.PROJECT)) {
  // Render create button
}
```

Permissions flow reactively through MobX, automatically updating UI when permissions change.

### 9. Performance Optimizations

**Next.js Config Optimizations**:
- Package import optimization for 20+ libraries
- Dynamic imports for client-only components
- Static rendering where possible
- Trailing slash optimization

**MobX Optimizations**:
- `enableStaticRendering(typeof window === "undefined")` - SSR support
- `observer` HOC only on components using observable state
- Computed values for derived state
- `observable.ref` for reference-only tracking

**Bundle Size Optimization**:
```javascript
experimental: {
  optimizePackageImports: [
    "lucide-react", "date-fns", "@headlessui/react",
    "react-color", "@plane/editor", "@plane/constants"
  ]
}
```

## Data Flow Patterns

### Read Flow
1. Component calls custom hook (e.g., `useIssues()`)
2. Hook returns MobX store
3. Store checks local SQLite database first
4. If data not available, falls back to API service
5. Service fetches from server via Axios
6. Store updates observable state
7. Components re-render via `observer` HOC

### Write Flow
1. Component calls store method (e.g., `updateIssue()`)
2. Store optimistically updates local state
3. Store calls service method
4. Service sends request to API
5. On success, local DB syncs with new data
6. On error, store reverts optimistic update and shows toast

### Sync Flow
1. On app load, check last sync time
2. Fetch only issues updated since last sync
3. Batch insert into SQLite in background worker
4. Update indexes after bulk operations
5. Mark project as "ready" for offline queries

## Provider Hierarchy

The application uses **nested providers** for global state:

```typescript
<ProgressProvider>
  <StoreProvider>           // MobX stores
    <ThemeProvider>         // Dark/light theme
      <TranslationProvider> // i18n
        <Toast />
        <StoreWrapper>      // Dynamic observer wrapper
          <InstanceWrapper> // Instance configuration
            <IntercomProvider>
              <PostHogProvider>
                <SWRConfig>   // SWR cache config
                  {children}
```

**Reference**: `app/provider.tsx`

## Build Artifacts

The application is built as a **Next.js production bundle** with:
- Static pages for marketing content
- Server-side rendered pages for dynamic content
- Client-side bundles with code splitting
- Optimized images and fonts
- Edge runtime support for API routes

## Summary

The Plane frontend demonstrates **enterprise-grade architecture** with:
- ✅ Offline-first capabilities with SQLite
- ✅ Multi-edition support (CE/EE)
- ✅ Sophisticated state management with MobX
- ✅ Extensive custom hooks ecosystem (66+)
- ✅ Type-safe service layer
- ✅ Performance optimizations throughout
- ✅ Reactive router integration
- ✅ Permission-based rendering
- ✅ Advanced component composition

This architecture is well-suited for complex, data-intensive applications requiring offline support, real-time collaboration, and flexible deployment models.
