# Advanced Patterns Summary

## Overview

This document provides a **quick reference** to the most interesting architectural patterns discovered in the Plane frontend codebase. For detailed deep-dives, refer to the individual documents.

## 1. Offline-First Architecture ⭐⭐⭐⭐⭐

**Pattern**: SQLite database running in Web Worker with Comlink communication

**Why It's Interesting**:
- Most web apps are online-only
- Plane works completely offline with full feature parity
- Uses cutting-edge Web Worker + WASM technology
- Sophisticated synchronization logic

**Key Files**:
- `core/local-db/storage.sqlite.ts` - Main storage interface
- `core/local-db/worker/db.ts` - Web Worker implementation
- `core/local-db/utils/query-constructor.ts` - SQL query generation

**Performance**: Queries typically complete in <10ms vs 100-500ms for network requests

**Read More**: `offline-first-architecture.md`

---

## 2. Multi-Edition Architecture (CE/EE) ⭐⭐⭐⭐⭐

**Pattern**: Layered architecture with store inheritance and path aliases

**Why It's Interesting**:
- Single codebase supports multiple business models
- Clean separation without conditional logic
- Type-safe extension pattern
- Enables open-source + commercial model

**Structure**:
```
core/        # Shared base (all editions)
  └── ce/    # Community Edition (extends core)
      └── ee/ # Enterprise Edition (extends CE)
```

**Key Example**:
```typescript
// ce/store/root.store.ts
export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;  // CE addition
}
```

**Read More**: `multi-edition-architecture.md`

---

## 3. MobX Store Hierarchy ⭐⭐⭐⭐

**Pattern**: Complex reactive state with centralized storage + context-specific views

**Why It's Interesting**:
- 14+ interconnected stores
- Automatic router synchronization
- Centralized issue storage with multiple views
- Fine-grained reactivity

**Store Architecture**:
```
RootStore
├── issue (20+ sub-stores)
│   ├── issues (central storage)
│   ├── projectIssues (view)
│   ├── cycleIssues (view)
│   └── ... (18+ more views)
├── workspace, project, cycle, module
├── router (auto-syncs with Next.js)
└── ... (14+ total root stores)
```

**Key Innovation**: Centralized `issuesMap` with context-specific ID arrays

**Read More**: `state-management-patterns.md`

---

## 4. Reactive Router Integration ⭐⭐⭐⭐

**Pattern**: MobX `autorun` syncs route params to observable state

**Why It's Interesting**:
- Eliminates prop drilling
- Automatic context switching on navigation
- Related data (states, labels) auto-synced
- Single source of truth

**Implementation**:
```typescript
autorun(() => {
  if (this.workspaceSlug !== rootStore.router.workspaceSlug)
    this.workspaceSlug = rootStore.router.workspaceSlug;
  // Sync all route params automatically
});
```

**Benefit**: Components access `store.workspaceSlug` instead of prop drilling

**Reference**: `core/store/issue/root.store.ts:207-228`

---

## 5. Custom Hooks Ecosystem (66+ Hooks) ⭐⭐⭐⭐

**Pattern**: Extensive library of domain-specific React hooks

**Why It's Interesting**:
- 66+ custom hooks
- Organized by purpose (store, editor, utility)
- Type-safe store access
- Reusable business logic

**Categories**:
- **Store Hooks** (30+): `useIssues()`, `useIssueDetail()`, `useUserPermissions()`
- **Editor Hooks**: `useEditorMarkings()`, `useEditorFocusHandler()`
- **Utility Hooks**: `useGroupIssuesDragNDrop()`, `useAutoSave()`, `useDebounce()`

**Example**:
```typescript
const { issues: { getIssueIds } } = useIssues(EIssuesStoreType.PROJECT);
const handleDrop = useGroupIssuesDragNDrop(storeType, orderBy, groupBy);
```

**Reference**: `core/hooks/`

---

## 6. Service Layer Architecture ⭐⭐⭐

**Pattern**: Class-based services extending `APIService` base

**Why It's Interesting**:
- Organized by domain (10+ service files per domain)
- Type-safe API calls
- Service type pattern (issues vs epics)
- Consistent error handling

**Example**:
```typescript
export class IssueService extends APIService {
  constructor(serviceType: TIssueServiceType) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  async createIssue(...): Promise<TIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/...`)
      .then(response => response?.data)
      .catch(error => { throw error?.response?.data; });
  }
}
```

**Reference**: `core/services/issue/issue.service.ts`

---

## 7. Advanced Component Composition ⭐⭐⭐⭐

**Pattern**: Multi-level component hierarchy with observer pattern

**Why It's Interesting**:
- Deep composition (5+ levels)
- Portal-based rendering for modals
- Observer HOC for reactivity
- Compound component pattern

**Example: Issue Peek Overview**
```
IssuePeekOverview (root)
  ├── PeekOverviewHeader (3 modes)
  ├── IssueView
  │   ├── PeekOverviewProperties
  │   ├── IssueDetailWidgets
  │   │   ├── Description
  │   │   ├── SubIssues
  │   │   ├── Links
  │   │   └── Attachments
  │   └── IssueActivity
  └── Modals (Delete, Archive, Duplicate)
```

**Reference**: `core/components/issues/peek-overview/`

---

## 8. Drag-and-Drop Implementation ⭐⭐⭐⭐

**Pattern**: Atlaskit Pragmatic DnD with custom group handling

**Why It's Interesting**:
- Supports multiple grouping levels
- Handles complex state updates (cycles, modules)
- Type-safe drag operations
- Optimistic updates

**Hook**:
```typescript
const handleOnDrop = useGroupIssuesDragNDrop(
  storeType,
  orderBy,
  groupBy,
  subGroupBy
);

// Handles:
// - Reordering within groups
// - Moving between groups
// - Adding/removing from cycles/modules
// - Priority/state updates
```

**Reference**: `core/hooks/use-group-dragndrop.ts`

---

## 9. Permission-Based Rendering ⭐⭐⭐

**Pattern**: Reactive permissions integrated into store

**Why It's Interesting**:
- Declarative permission checks
- Automatic UI updates on permission changes
- Multiple permission levels
- Type-safe permission enums

**Usage**:
```typescript
const { allowPermissions } = useUserPermissions();

if (allowPermissions(
  [EUserPermissions.ISSUE_CREATE],
  EUserPermissionsLevel.PROJECT
)) {
  // Render create button
}
```

**Reference**: `core/hooks/store/user/use-user-permissions.ts`

---

## 10. Performance Optimizations ⭐⭐⭐⭐

**Pattern**: Multiple layers of optimization

**Why It's Interesting**:
- Next.js bundle optimization for 20+ packages
- MobX computed values for derived state
- `observable.ref` for large objects
- Dynamic imports for code splitting
- Web Worker offloading

**Next.js Config**:
```javascript
experimental: {
  optimizePackageImports: [
    "lucide-react", "date-fns", "@plane/editor",
    "@plane/constants", ...20+ more
  ]
}
```

**MobX**:
```typescript
makeObservable(this, {
  workspaceSlug: observable.ref,  // Reference only
  issuesMap: observable,          // Deep observe
  sortedIssues: computed,         // Cached
});
```

**Reference**: `next.config.js`, various store files

---

## 11. Provider Hierarchy ⭐⭐⭐

**Pattern**: Nested providers for global state

**Why It's Interesting**:
- Clean separation of concerns
- Proper provider ordering
- Context composition
- Performance isolation

**Structure**:
```typescript
<ProgressProvider>
  <StoreProvider>           // MobX
    <ThemeProvider>         // Dark mode
      <TranslationProvider> // i18n
        <StoreWrapper>      // Observer wrapper
          <InstanceWrapper> // Config
            <IntercomProvider>
              <PostHogProvider>
                <SWRConfig>
                  {children}
```

**Reference**: `app/provider.tsx`

---

## 12. Data Synchronization Strategy ⭐⭐⭐⭐

**Pattern**: Incremental sync with fallback

**Why It's Interesting**:
- Initial full sync (500 issues/page, 50 batch size)
- Incremental updates (only changed issues)
- Parallel page fetching
- Deletion handling
- Version management

**Sync Flow**:
1. Check last sync time
2. Fetch issues with `updated_at__gt` filter
3. Batch insert into SQLite
4. Sync deletions separately
5. Update indexes
6. Mark project "ready"

**Reference**: `core/local-db/storage.sqlite.ts:211-271`

---

## Comparison Matrix

| Pattern | Complexity | Uniqueness | Impact | Reusability |
|---------|-----------|------------|--------|-------------|
| **Offline-First** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Multi-Edition** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **MobX Stores** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Reactive Router** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Custom Hooks** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Service Layer** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Component Composition** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Drag-and-Drop** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Permissions** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance Opts** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Legend**:
- ⭐ = Low/Basic
- ⭐⭐⭐ = Medium/Good
- ⭐⭐⭐⭐⭐ = High/Excellent

---

## Most Reusable Patterns

These patterns can be easily adapted to other projects:

### 1. Multi-Edition Architecture ⭐⭐⭐⭐⭐
- **Use Case**: SaaS with tiered pricing, open-source + commercial
- **Difficulty**: Medium
- **Files to Study**: `ce/store/root.store.ts`, `tsconfig.json`

### 2. Custom Hooks Organization ⭐⭐⭐⭐⭐
- **Use Case**: Any React application
- **Difficulty**: Low
- **Files to Study**: `core/hooks/` directory structure

### 3. Service Layer Pattern ⭐⭐⭐⭐⭐
- **Use Case**: API-driven applications
- **Difficulty**: Low
- **Files to Study**: `core/services/issue/issue.service.ts`

### 4. Permission System ⭐⭐⭐⭐⭐
- **Use Case**: Apps with role-based access control
- **Difficulty**: Medium
- **Files to Study**: `core/hooks/store/user/use-user-permissions.ts`

### 5. Reactive Router Integration ⭐⭐⭐⭐
- **Use Case**: MobX + Next.js applications
- **Difficulty**: Medium
- **Files to Study**: `core/store/issue/root.store.ts:207-228`

---

## Most Unique Patterns

These patterns are rare in the wild:

### 1. Offline-First SQLite ⭐⭐⭐⭐⭐
- **Rarity**: Very rare in web applications
- **Innovation**: Web Worker + WASM + Comlink
- **Challenge**: Complex synchronization logic

### 2. Multi-Edition Store Inheritance ⭐⭐⭐⭐⭐
- **Rarity**: Uncommon approach
- **Innovation**: Type-safe extension with path aliases
- **Challenge**: Maintaining abstraction boundaries

### 3. Centralized Storage + Context Views ⭐⭐⭐⭐
- **Rarity**: Uncommon in MobX applications
- **Innovation**: Single source of truth with multiple projections
- **Challenge**: Keeping views in sync

---

## Key Takeaways

### Architecture Philosophy

1. **Separation of Concerns**: Clear boundaries between layers (core/CE/EE)
2. **Single Source of Truth**: Centralized storage, multiple views
3. **Progressive Enhancement**: Offline-first with server fallback
4. **Type Safety**: Extensive use of TypeScript throughout
5. **Performance First**: Multiple optimization layers
6. **Developer Experience**: Custom hooks, clear patterns

### Technical Decisions

- **MobX over Redux**: Less boilerplate, better for complex domains
- **SQLite over IndexedDB**: Better query capabilities, SQL familiarity
- **Web Workers**: Offload heavy database operations
- **Class-based Services**: OOP approach for API layer
- **Path Aliases**: Enable multi-edition architecture
- **Next.js App Router**: Modern routing with layouts

### Scale Indicators

- **46+ component directories**: Large-scale application
- **66+ custom hooks**: Extensive reusability
- **14+ root stores**: Complex state management
- **20+ issue sub-stores**: Domain complexity
- **10+ service files per domain**: Comprehensive API coverage

---

## Learning Resources

### For Deep Understanding

1. **Start Here**: `frontend-architecture-overview.md` (high-level overview)
2. **Offline Magic**: `offline-first-architecture.md` (most impressive feature)
3. **State Management**: `state-management-patterns.md` (MobX patterns)
4. **Business Model**: `multi-edition-architecture.md` (CE/EE pattern)

### For Implementation

1. **Custom Hooks**: Study `core/hooks/` directory
2. **Service Layer**: Study `core/services/issue/issue.service.ts`
3. **Store Pattern**: Study `core/store/issue/root.store.ts`
4. **Component Patterns**: Study `core/components/issues/peek-overview/`

### For Architecture Decisions

1. **Why MobX**: State complexity and reactivity needs
2. **Why SQLite**: Offline functionality and query power
3. **Why Multi-Edition**: Business model flexibility
4. **Why Next.js**: SEO, performance, and developer experience

---

## Conclusion

The Plane frontend represents **enterprise-grade architecture** with:

✅ Cutting-edge technology (SQLite WASM, Web Workers)
✅ Sophisticated state management (MobX with 14+ stores)
✅ Business model flexibility (Multi-edition support)
✅ Outstanding developer experience (66+ custom hooks)
✅ Performance optimizations throughout
✅ Type safety with TypeScript
✅ Offline-first capabilities

This codebase is an **excellent reference** for:
- Large-scale React applications
- Offline-first web applications
- Multi-edition SaaS products
- Complex domain modeling with MobX
- Modern Next.js architecture

**Rating**: ⭐⭐⭐⭐⭐ (5/5) - Exceptional architecture worthy of study
