# Multi-Edition Architecture (CE/EE)

## Overview

One of the most interesting architectural decisions in the Plane frontend is the **multi-edition support** that allows the same codebase to serve both **Community Edition (CE)** and **Enterprise Edition (EE)** deployments. This is achieved through a layered architecture with strategic use of TypeScript path aliases and store inheritance.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Enterprise Edition (EE)                   │
│  Additional features, components, and services              │
│  • Advanced analytics                                       │
│  • SSO integrations                                         │
│  • Advanced project controls                                │
│  • Custom workflows                                         │
└────────────────────┬────────────────────────────────────────┘
                     │ Extends
┌────────────────────┴────────────────────────────────────────┐
│                  Community Edition (CE)                      │
│  Extensions and overrides of core functionality             │
│  • Timeline views                                           │
│  • Additional store modules                                 │
│  • CE-specific components                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ Extends
┌────────────────────┴────────────────────────────────────────┐
│                        Core                                  │
│  Base functionality shared across all editions              │
│  • Issue management                                         │
│  • Project/workspace management                             │
│  • State management stores                                  │
│  • API services                                             │
│  • Component library                                        │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/web/
├── core/                          # Base functionality
│   ├── components/                # Core components
│   ├── store/                     # Core stores
│   │   └── root.store.ts         # CoreRootStore
│   ├── services/                  # API services
│   ├── hooks/                     # Core hooks
│   └── ...
├── ce/                            # Community Edition
│   ├── components/                # CE-specific/override components
│   ├── store/                     # CE stores
│   │   ├── root.store.ts         # RootStore extends CoreRootStore
│   │   └── timeline/             # CE-specific stores
│   └── ...
└── ee/                            # Enterprise Edition
    ├── components/                # EE-only components
    ├── services/                  # EE-only services
    │   └── project/
    │       ├── project-state.service.ts
    │       └── estimate.service.ts
    └── ...
```

## Path Aliases

TypeScript path aliases enable seamless imports across layers:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["core/*"],                    // Core imports
      "@/plane-web/*": ["ce/*"],            // CE imports
      "@/helpers/*": ["helpers/*"],
      "@/styles/*": ["styles/*"]
    }
  }
}
```

**Usage Examples**:
```typescript
// Import from core
import { IssueDetail } from "@/store/issue/issue-details/root.store";

// Import from CE
import { TimeLineStore } from "@/plane-web/store/timeline";

// CE can import and extend core
import { CoreRootStore } from "@/store/root.store";
```

## Store Extension Pattern

### Core Store

The **core store** contains the foundation shared across all editions:

```typescript
// core/store/root.store.ts
export class CoreRootStore {
  // Core stores available to all editions
  workspaceRoot: IWorkspaceRootStore;
  projectRoot: IProjectRootStore;
  memberRoot: IMemberRootStore;
  issue: IIssueRootStore;
  cycle: ICycleStore;
  module: IModuleStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  state: IStateStore;
  label: ILabelStore;
  dashboard: IDashboardStore;
  analytics: IAnalyticsStore;
  projectPages: IProjectPageStore;
  router: IRouterStore;
  commandPalette: ICommandPaletteStore;
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;
  projectInbox: IProjectInboxStore;
  projectEstimate: IProjectEstimateStore;
  multipleSelect: IMultipleSelectStore;
  workspaceNotification: IWorkspaceNotificationStore;
  favorite: IFavoriteStore;
  transient: ITransientStore;
  stickyStore: IStickyStore;
  editorAssetStore: IEditorAssetStore;
  workItemFilters: IWorkItemFilterStore;
  powerK: IPowerKStore;

  constructor() {
    // Initialize all core stores
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    // ... initialize all other stores
  }
}
```

**Reference**: `core/store/root.store.ts`

### CE Store Extension

The **CE store** extends the core and adds CE-specific functionality:

```typescript
// ce/store/root.store.ts
import { CoreRootStore } from "@/store/root.store";
import type { ITimelineStore } from "./timeline";
import { TimeLineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;

  constructor() {
    super();  // Initialize all core stores

    // Add CE-specific stores
    this.timelineStore = new TimeLineStore(this);
  }
}
```

**Key Points**:
- Extends `CoreRootStore` to inherit all base functionality
- Adds CE-specific stores (e.g., `timelineStore`)
- Has access to all core stores via `super()`
- Can override core methods if needed

**Reference**: `ce/store/root.store.ts:6-14`

### Timeline Store (CE Feature)

Example of a CE-specific store:

```typescript
// ce/store/timeline/index.ts
import { action, makeObservable, observable } from "mobx";
import type { RootStore } from "../root.store";

export interface ITimelineStore {
  // Timeline-specific state and methods
}

export class TimeLineStore implements ITimelineStore {
  // Timeline state
  rootStore: RootStore;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      // Observable declarations
    });
    this.rootStore = rootStore;
  }

  // Timeline-specific methods
}
```

**Reference**: `ce/store/timeline/`

## Component Override Pattern

### CE Component Structure

CE can override or extend core components:

```
core/components/
├── issues/
│   ├── issue-detail/
│   │   └── root.tsx          # Core implementation
│   └── ...
└── ...

ce/components/
├── issues/
│   ├── issue-detail/
│   │   └── root.tsx          # CE override/extension
│   └── ...
└── ...
```

### Import Pattern

Components are imported using the CE path alias, which allows CE to override:

```typescript
// In a page component
import { IssueDetail } from "@/plane-web/components/issues/issue-detail";

// This imports from ce/components if it exists,
// otherwise falls back to core/components
```

**Benefits**:
- CE can selectively override components
- Fallback to core if CE doesn't provide override
- No conditional logic needed in imports
- Clean separation of concerns

## Service Extension Pattern

### Core Services

Core services provide base API functionality:

```typescript
// core/services/issue/issue.service.ts
export class IssueService extends APIService {
  async createIssue(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>
  ): Promise<TIssue> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/`,
      data
    ).then(response => response?.data);
  }

  // ... more core methods
}
```

### EE Service Extensions

EE can add additional services:

```typescript
// ee/services/project/project-state.service.ts
export class ProjectStateService extends APIService {
  async createProjectState(
    workspaceSlug: string,
    projectId: string,
    data: Partial<IState>
  ): Promise<IState> {
    // EE-specific API endpoint
    return this.post(
      `/api/ee/workspaces/${workspaceSlug}/projects/${projectId}/states/`,
      data
    ).then(response => response?.data);
  }
}
```

**Reference**: `ee/services/project/`

## Build-Time vs Runtime

### Build-Time Selection

The edition is typically selected at **build time** through environment variables:

```javascript
// next.config.js
const edition = process.env.EDITION || 'ce';

module.exports = {
  // Edition-specific configurations
  webpack: (config) => {
    config.resolve.alias['@edition'] = path.resolve(__dirname, edition);
    return config;
  }
};
```

### Runtime Feature Flags

Some features use runtime flags for finer control:

```typescript
// Check if EE feature is available
if (rootStore.instance.isEnterpriseEdition) {
  // Show EE-only UI
}
```

## Benefits

### 1. Code Reusability

- **Single Codebase**: All editions share the same core
- **DRY Principle**: No duplication of base functionality
- **Easier Maintenance**: Bug fixes in core benefit all editions
- **Consistent UX**: Base UI/UX identical across editions

### 2. Clear Separation

- **Organized Structure**: Easy to see what's CE vs EE
- **No Conditional Logic**: No `if (isEE)` scattered throughout code
- **Type Safety**: TypeScript ensures correct usage
- **Independent Development**: CE and EE can evolve independently

### 3. Upgrade Path

- **Easy Migration**: CE users can upgrade to EE
- **Backward Compatible**: EE includes all CE features
- **Minimal Code Changes**: Path aliases handle most differences
- **Testing**: Can test all editions from same codebase

### 4. Developer Experience

- **Intuitive Imports**: Clear where code comes from
- **No Magic**: Extension pattern is explicit
- **TypeScript Support**: Full type checking across layers
- **Hot Reload**: Works correctly across all layers

## Challenges

### 1. Import Complexity

**Issue**: Developers must know which path alias to use

```typescript
// Which one?
import { RootStore } from "@/store/root.store";           // Core
import { RootStore } from "@/plane-web/store/root.store"; // CE
```

**Solution**: Clear documentation and linting rules

### 2. Type Conflicts

**Issue**: CE extends core interfaces, can cause type mismatches

```typescript
// Core expects CoreRootStore
function useCoreStore(store: CoreRootStore) { }

// CE provides RootStore (extends CoreRootStore)
const ceStore = new RootStore();
useCoreStore(ceStore);  // Works due to inheritance
```

**Solution**: Proper use of TypeScript inheritance and generics

### 3. Build Configuration

**Issue**: Must configure build system to handle multiple editions

**Solution**:
- Next.js webpack configuration for path resolution
- TypeScript path aliases in `tsconfig.json`
- Environment variables for edition selection

### 4. Testing Isolation

**Issue**: Need to test each edition independently

**Solution**:
- Separate test suites for CE and EE
- Mock edition-specific features in core tests
- Integration tests for full stack

## Best Practices

### ✅ Do

1. **Keep Core Minimal**: Only put truly shared code in core
2. **Use Path Aliases Consistently**: Always use `@/plane-web` for CE imports
3. **Document Extensions**: Comment why CE/EE extends core
4. **Type Interfaces**: Define interfaces for all extension points
5. **Test All Editions**: Ensure features work across editions
6. **Version Carefully**: Coordinate changes across layers

### ❌ Don't

1. **Don't Put CE Code in Core**: Maintain strict separation
2. **Don't Use Conditional Logic**: Use extension pattern instead
3. **Don't Duplicate Code**: Extract to core if used in multiple editions
4. **Don't Break Abstractions**: Respect layer boundaries
5. **Don't Forget TypeScript**: Leverage types for safety
6. **Don't Overcomplicate**: Keep the pattern simple

## Real-World Example

### Issue Detail Component

**Core Implementation** (`core/components/issues/issue-detail/root.tsx`):
```typescript
export const IssueDetail: FC<IIssueDetailProps> = observer((props) => {
  const { issueId, projectId } = props;
  const { issue: { fetchIssue } } = useIssueDetail();

  useEffect(() => {
    fetchIssue(workspaceSlug, projectId, issueId);
  }, [issueId]);

  return (
    <div>
      <IssueHeader />
      <IssueDescription />
      <IssueComments />
    </div>
  );
});
```

**CE Extension** (`ce/components/issues/issue-detail/root.tsx`):
```typescript
import { IssueDetail as CoreIssueDetail } from "@/components/issues/issue-detail";

export const IssueDetail: FC<IIssueDetailProps> = observer((props) => {
  const { timelineStore } = useStore();

  return (
    <div>
      {/* Core functionality */}
      <CoreIssueDetail {...props} />

      {/* CE addition */}
      {timelineStore.isEnabled && (
        <IssueTimeline issueId={props.issueId} />
      )}
    </div>
  );
});
```

**Page Usage** (`app/page.tsx`):
```typescript
// Automatically uses CE version if available, otherwise core
import { IssueDetail } from "@/plane-web/components/issues/issue-detail";

export default function IssuePage() {
  return <IssueDetail issueId="123" projectId="456" />;
}
```

## Comparison with Alternatives

### Multi-Edition vs Feature Flags

| Approach | Pros | Cons |
|----------|------|------|
| **Multi-Edition** | Clean separation, better tree-shaking, no runtime checks | Build complexity, multiple builds |
| **Feature Flags** | Single build, runtime control, A/B testing | Runtime overhead, larger bundle, conditional logic |

### Multi-Edition vs Separate Repos

| Approach | Pros | Cons |
|----------|------|------|
| **Multi-Edition** | Shared core, easier maintenance, single CI/CD | Potential conflicts, requires discipline |
| **Separate Repos** | Complete isolation, independent deployment | Code duplication, harder to maintain |

## Future Considerations

### Potential Enhancements

1. **Plugin System**: Allow third-party extensions using same pattern
2. **Dynamic Loading**: Load EE features on-demand
3. **Edition Detection**: Auto-detect available features at runtime
4. **Better DX Tools**: VSCode extension for edition-aware imports
5. **Automated Testing**: Generate tests for all edition combinations

## Conclusion

The multi-edition architecture demonstrates:

- ✅ **Clean separation** of base, CE, and EE functionality
- ✅ **Type-safe extension pattern** through inheritance
- ✅ **Maintainable codebase** with shared core
- ✅ **Flexible deployment** supporting multiple business models
- ✅ **Developer-friendly** with clear patterns and path aliases

This pattern is an **excellent choice** for:
- SaaS products with tiered pricing
- Open-source projects with commercial offerings
- Products requiring different feature sets per customer
- Applications needing white-label capabilities

The Plane implementation shows how to execute this pattern **correctly** at scale, making it a valuable reference for similar architectural decisions.
