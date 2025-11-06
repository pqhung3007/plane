# State Management Patterns with MobX

## Overview

The Plane frontend uses **MobX** for state management, implementing a sophisticated store hierarchy with reactive updates and automatic synchronization. This document explores the patterns and architecture decisions behind this implementation.

## Why MobX?

The choice of MobX over Redux or Zustand appears driven by several factors:

1. **Less Boilerplate**: No reducers, actions, or dispatch needed
2. **Reactive Updates**: Components automatically re-render when observed state changes
3. **Class-Based**: Natural fit for complex domain models
4. **Computed Values**: Efficient derived state with automatic dependency tracking
5. **Object-Oriented**: Familiar patterns for developers with OOP background

## Store Architecture

### Root Store Hierarchy

```typescript
RootStore (ce/store/root.store.ts)
├── CoreRootStore (core/store/root.store.ts)
│   ├── workspaceRoot: IWorkspaceRootStore
│   ├── projectRoot: IProjectRootStore
│   ├── memberRoot: IMemberRootStore
│   ├── issue: IIssueRootStore ← Most complex store
│   ├── cycle: ICycleStore
│   ├── module: IModuleStore
│   ├── projectView: IProjectViewStore
│   ├── globalView: IGlobalViewStore
│   ├── state: IStateStore
│   ├── label: ILabelStore
│   ├── dashboard: IDashboardStore
│   ├── analytics: IAnalyticsStore
│   ├── projectPages: IProjectPageStore
│   ├── router: IRouterStore ← Syncs with Next.js router
│   ├── commandPalette: ICommandPaletteStore
│   ├── theme: IThemeStore
│   ├── instance: IInstanceStore
│   ├── user: IUserStore
│   ├── projectInbox: IProjectInboxStore
│   ├── projectEstimate: IProjectEstimateStore
│   ├── multipleSelect: IMultipleSelectStore
│   ├── workspaceNotification: IWorkspaceNotificationStore
│   ├── favorite: IFavoriteStore
│   ├── transient: ITransientStore
│   ├── stickyStore: IStickyStore
│   ├── editorAssetStore: IEditorAssetStore
│   ├── workItemFilters: IWorkItemFilterStore
│   └── powerK: IPowerKStore
└── timelineStore: ITimelineStore (CE addition)
```

**Reference**: `core/store/root.store.ts` and `ce/store/root.store.ts:6-14`

## Issue Root Store - Deep Dive

The `IssueRootStore` is the most sophisticated store, managing issues across **multiple contexts and views**.

### Structure

```typescript
export class IssueRootStore implements IIssueRootStore {
  // Context identifiers (auto-synced with router via autorun)
  currentUserId: string | undefined;
  workspaceSlug: string | undefined;
  teamspaceId: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  moduleId: string | undefined;
  viewId: string | undefined;
  globalViewId: string | undefined;
  userId: string | undefined;

  // Shared lookup maps (synced from other stores)
  stateMap: Record<string, IState> | undefined;
  labelMap: Record<string, IIssueLabel> | undefined;
  memberMap: Record<string, IUserLite> | undefined;
  projectMap: Record<string, IProject> | undefined;
  moduleMap: Record<string, IModule> | undefined;
  cycleMap: Record<string, ICycle> | undefined;

  // Central issue storage
  issues: IIssueStore;

  // Detail views
  issueDetail: IIssueDetail;
  epicDetail: IIssueDetail;

  // Context-specific issue lists with filters
  workspaceIssues: IWorkspaceIssues;
  workspaceIssuesFilter: IWorkspaceIssuesFilter;

  projectIssues: IProjectIssues;
  projectIssuesFilter: IProjectIssuesFilter;

  cycleIssues: ICycleIssues;
  cycleIssuesFilter: ICycleIssuesFilter;

  moduleIssues: IModuleIssues;
  moduleIssuesFilter: IModuleIssuesFilter;

  teamIssues: ITeamIssues;
  teamIssuesFilter: ITeamIssuesFilter;

  archivedIssues: IArchivedIssues;
  archivedIssuesFilter: IArchivedIssuesFilter;

  // ... and 10+ more context stores

  // View-specific stores
  issueKanBanView: IIssueKanBanViewStore;
  issueCalendarView: ICalendarStore;
}
```

**Reference**: `core/store/issue/root.store.ts:48-114`

### Key Patterns

#### 1. Centralized Issue Storage

All issues are stored in a single `issuesMap` to avoid duplication:

```typescript
export class IssueStore implements IIssueStore {
  issuesMap: { [issue_id: string]: TIssue } = {};
  issuesIdentifierMap: { [issue_identifier: string]: string } = {};

  constructor() {
    makeObservable(this, {
      issuesMap: observable,
      issuesIdentifierMap: observable,
      addIssue: action,
      updateIssue: action,
      removeIssue: action,
    });
  }

  addIssue = (issues: TIssue[]) => {
    runInAction(() => {
      issues.forEach((issue) => {
        set(this.issuesIdentifierMap, issueIdentifier, issue.id);
        set(this.issuesMap, issue.id, issue);
      });
    });
  };
}
```

**Benefits**:
- Single source of truth for issue data
- Updates propagate to all contexts automatically
- Memory efficient (no duplicate issue objects)
- Easy to maintain consistency

**Reference**: `core/store/issue/issue.store.ts`

#### 2. Context-Specific Issue Lists

Each context (project, cycle, module) maintains its own **list of issue IDs**:

```typescript
export class ProjectIssues implements IProjectIssues {
  groupedIssueIds: {
    [projectId: string]: {
      [groupId: string]: string[];  // Array of issue IDs
    };
  } = {};

  constructor(private issueRootStore: IIssueRootStore) {
    makeObservable(this, {
      groupedIssueIds: observable,
    });
  }

  // Retrieve full issue objects from central store
  getIssues(projectId: string, groupId: string): TIssue[] {
    const issueIds = this.groupedIssueIds[projectId]?.[groupId] || [];
    return issueIds
      .map(id => this.issueRootStore.issues.issuesMap[id])
      .filter(Boolean);
  }
}
```

**Benefits**:
- Context isolation (module issues separate from cycle issues)
- Efficient filtering and grouping
- Easy to add/remove issues from contexts
- Supports multiple grouping strategies

**Reference**: `core/store/issue/project/issue.store.ts`

#### 3. Reactive Router Synchronization

The issue store automatically syncs with Next.js router state using MobX's `autorun`:

```typescript
constructor(rootStore: RootStore) {
  makeObservable(this, {
    workspaceSlug: observable.ref,
    projectId: observable.ref,
    cycleId: observable.ref,
    moduleId: observable.ref,
    // ...
  });

  autorun(() => {
    if (this.workspaceSlug !== rootStore.router.workspaceSlug)
      this.workspaceSlug = rootStore.router.workspaceSlug;

    if (this.projectId !== rootStore.router.projectId)
      this.projectId = rootStore.router.projectId;

    if (this.cycleId !== rootStore.router.cycleId)
      this.cycleId = rootStore.router.cycleId;

    if (this.moduleId !== rootStore.router.moduleId)
      this.moduleId = rootStore.router.moduleId;

    // Also sync related data from other stores
    if (!isEmpty(rootStore?.state?.stateMap))
      this.stateMap = rootStore?.state?.stateMap;

    if (!isEmpty(rootStore?.label?.labelMap))
      this.labelMap = rootStore?.label?.labelMap;

    if (!isEmpty(rootStore?.memberRoot?.memberMap))
      this.memberMap = rootStore?.memberRoot?.memberMap;

    // ...
  });
}
```

**Benefits**:
- No need to pass route params through components
- Automatic context switching when navigating
- Related data (states, labels) automatically available
- Single source of truth for current context

**Reference**: `core/store/issue/root.store.ts:207-228`

#### 4. Service Type Pattern

The issue store supports different service types (issues vs epics) through a type parameter:

```typescript
export class IssueRootStore implements IIssueRootStore {
  serviceType: TIssueServiceType;

  issueDetail: IIssueDetail;    // For regular issues
  epicDetail: IIssueDetail;     // For epics

  constructor(rootStore: RootStore, serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    this.serviceType = serviceType;
    this.issueDetail = new IssueDetail(this, EIssueServiceType.ISSUES);
    this.epicDetail = new IssueDetail(this, EIssueServiceType.EPICS);
  }
}
```

Components access the appropriate detail store:

```typescript
export const useIssueDetail = (
  serviceType: TIssueServiceType = EIssueServiceType.ISSUES
): IIssueDetail => {
  const context = useContext(StoreContext);
  if (serviceType === EIssueServiceType.EPICS)
    return context.issue.epicDetail;
  else
    return context.issue.issueDetail;
};
```

**Benefits**:
- Shared code for issues and epics
- Type-safe service selection
- Easy to add new service types
- Clear separation of concerns

**Reference**: `core/store/issue/root.store.ts:183-233` and `core/hooks/store/use-issue-detail.ts`

## Store Access Patterns

### 1. React Context + Hooks

Stores are provided via React Context and accessed through custom hooks:

```typescript
// Create and provide store
export let rootStore = new RootStore();
export const StoreContext = createContext<RootStore>(rootStore);

export const StoreProvider = ({ children }: { children: ReactElement }) => (
  <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
);

// Access via custom hook
export const useIssues = (storeType: EIssuesStoreType) => {
  const context = useContext(StoreContext);
  if (context === undefined)
    throw new Error("useIssues must be used within StoreProvider");

  switch (storeType) {
    case EIssuesStoreType.PROJECT:
      return {
        issues: context.issue.projectIssues,
        issuesFilter: context.issue.projectIssuesFilter
      };
    case EIssuesStoreType.CYCLE:
      return {
        issues: context.issue.cycleIssues,
        issuesFilter: context.issue.cycleIssuesFilter
      };
    // ... more cases
  }
};
```

**Benefits**:
- Type-safe store access
- Clear error messages if used incorrectly
- Single import point for each store type
- Easy to refactor store structure

**Reference**: `core/lib/store-context.tsx` and `core/hooks/store/use-issues.ts`

### 2. Observer HOC

Components that use observable state must be wrapped with `observer`:

```typescript
import { observer } from "mobx-react";

const IssueList: FC = observer(() => {
  const { issues: { getIssueIds } } = useIssues(EIssuesStoreType.PROJECT);
  const issueIds = getIssueIds(projectId, groupId);

  return (
    <div>
      {issueIds.map(id => <IssueCard key={id} issueId={id} />)}
    </div>
  );
});
```

**Important**: Only components that **directly access** observable state need `observer`. Child components receiving plain props don't need it.

**Reference**: `core/components/issues/peek-overview/root.tsx:24`

## Advanced Patterns

### 1. Computed Values

MobX automatically tracks dependencies and caches computed values:

```typescript
export class IssueStore {
  issuesMap: { [issue_id: string]: TIssue } = {};

  constructor() {
    makeObservable(this, {
      issuesMap: observable,
      issueCount: computed,  // Automatically cached and updated
    });
  }

  get issueCount(): number {
    return Object.keys(this.issuesMap).length;
  }
}
```

**Benefits**:
- Automatic caching (only recomputes when dependencies change)
- No manual memoization needed
- Efficient for expensive calculations
- Clean API (looks like a property)

### 2. Actions for State Updates

All state updates should go through actions:

```typescript
export class IssueStore {
  issuesMap: { [issue_id: string]: TIssue } = {};

  constructor() {
    makeObservable(this, {
      issuesMap: observable,
      updateIssue: action,  // Mark as action
    });
  }

  updateIssue = (issueId: string, data: Partial<TIssue>) => {
    runInAction(() => {  // Or wrap entire function with action
      const issue = this.issuesMap[issueId];
      if (issue) {
        Object.assign(issue, data);
      }
    });
  };
}
```

**Benefits**:
- Batched updates (UI updates once after action completes)
- Better debugging (actions show in MobX DevTools)
- Enforces single responsibility
- Easier to test

### 3. Observable References

For large objects that don't need deep observation:

```typescript
makeObservable(this, {
  workspaceSlug: observable.ref,  // Only observe reference changes
  projectMap: observable,         // Deep observation of object
});
```

**Benefits**:
- Performance optimization for large objects
- Prevents unnecessary re-renders
- Explicit about what changes matter
- Reduces memory overhead

**Reference**: `core/store/issue/root.store.ts:185-202`

### 4. Filter Store Pattern

Each context has a separate filter store:

```typescript
export class ProjectIssuesFilter implements IProjectIssuesFilter {
  filters: {
    [projectId: string]: IIssueFilterOptions;
  } = {};

  displayFilters: {
    [projectId: string]: IIssueDisplayFilterOptions;
  } = {};

  constructor(private issueRootStore: IIssueRootStore) {
    makeObservable(this, {
      filters: observable,
      displayFilters: observable,
      updateFilters: action,
      updateDisplayFilters: action,
    });
  }

  updateFilters = (projectId: string, filters: Partial<IIssueFilterOptions>) => {
    runInAction(() => {
      this.filters[projectId] = {
        ...this.filters[projectId],
        ...filters
      };
    });
  };
}
```

**Benefits**:
- Filter state persists across navigation
- Each context maintains its own filters
- Easy to save/load filter presets
- Type-safe filter operations

**Reference**: `core/store/issue/project/filter.store.ts`

## Performance Considerations

### 1. Observable Granularity

**Too Coarse** ❌:
```typescript
makeObservable(this, {
  data: observable  // Entire object observable
});
```

**Too Fine** ❌:
```typescript
makeObservable(this, {
  'data.field1': observable,
  'data.field2': observable,
  // ... hundreds of fields
});
```

**Just Right** ✅:
```typescript
makeObservable(this, {
  dataMap: observable.ref,     // Reference only
  specificField: observable,   // Deep observe only what changes
});
```

### 2. Computed Value Usage

Use computed values for **expensive operations**:

```typescript
// Good: Expensive filtering/sorting cached
get sortedFilteredIssues(): TIssue[] {
  return this.allIssues
    .filter(issue => issue.state === 'open')
    .sort((a, b) => a.priority - b.priority);
}

// Bad: Recomputes on every access
getSortedFilteredIssues(): TIssue[] {
  return this.allIssues
    .filter(issue => issue.state === 'open')
    .sort((a, b) => a.priority - b.priority);
}
```

### 3. Batch Updates

Use `runInAction` to batch multiple updates:

```typescript
// Bad: Three separate updates, three re-renders
updateIssueData(issueId, { name, state, priority }) {
  this.issuesMap[issueId].name = name;
  this.issuesMap[issueId].state = state;
  this.issuesMap[issueId].priority = priority;
}

// Good: One update, one re-render
updateIssueData(issueId, { name, state, priority }) {
  runInAction(() => {
    this.issuesMap[issueId].name = name;
    this.issuesMap[issueId].state = state;
    this.issuesMap[issueId].priority = priority;
  });
}
```

### 4. Observer Placement

Only wrap components that **directly access** observable state:

```typescript
// Good: Observer on component using store
const IssueList = observer(() => {
  const { issues } = useIssues(storeType);
  const issueIds = issues.getIssueIds();
  return issueIds.map(id => <IssueCard issueId={id} />);
});

// IssueCard receives plain prop, no observer needed
const IssueCard = ({ issueId }) => {
  return <div>{issueId}</div>;
};

// Bad: Observer on every component (unnecessary)
const IssueCard = observer(({ issueId }) => {
  return <div>{issueId}</div>;
});
```

## Comparison with Alternatives

### MobX vs Redux

| Aspect | MobX | Redux |
|--------|------|-------|
| **Boilerplate** | Low | High |
| **Learning Curve** | Medium | Steep |
| **Reactivity** | Automatic | Manual selectors |
| **Mutability** | Direct mutations in actions | Immutable updates |
| **Performance** | Excellent (fine-grained) | Good (memoization needed) |
| **DevTools** | Good | Excellent |
| **Type Safety** | Good with TypeScript | Excellent with TypeScript |

### MobX vs Zustand

| Aspect | MobX | Zustand |
|--------|------|---------|
| **Store Structure** | Class-based, OOP | Functional |
| **Reactivity** | Fine-grained, automatic | Manual selectors |
| **Computed Values** | Built-in | Manual |
| **Middleware** | Interceptors | Rich ecosystem |
| **Bundle Size** | Larger | Smaller |
| **Complexity** | Higher | Lower |

## Best Practices

### ✅ Do

1. **Use `observer` only where needed**: Don't wrap every component
2. **Use computed values for derived state**: Automatic caching and optimization
3. **Batch updates with `runInAction`**: Reduce re-renders
4. **Use `observable.ref` for large objects**: Performance optimization
5. **Keep stores focused**: Single responsibility principle
6. **Use actions for all mutations**: Better debugging and batching

### ❌ Don't

1. **Don't observe unchanged data**: Use `observable.ref` appropriately
2. **Don't compute in render**: Use computed values instead
3. **Don't mutate outside actions**: Breaks MobX invariants
4. **Don't create stores in components**: Use context/hooks
5. **Don't observe everything**: Be selective about observability
6. **Don't forget error handling**: Wrap async operations in try-catch

## Conclusion

The MobX state management architecture demonstrates:

- ✅ **Sophisticated store hierarchy** with clear separation of concerns
- ✅ **Reactive router synchronization** eliminating prop drilling
- ✅ **Centralized storage** with context-specific views
- ✅ **Type-safe access patterns** through custom hooks
- ✅ **Performance optimizations** with computed values and observable.ref
- ✅ **Extensibility** through the CE/EE pattern

This architecture is well-suited for **complex domain models** with **rich interactivity** and **frequent updates**, making it an excellent choice for a project management application like Plane.
