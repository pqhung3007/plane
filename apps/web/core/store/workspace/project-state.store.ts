import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type { IProjectState } from "@plane/types";
// services
import { WorkspaceProjectStateService } from "@/services/workspace/workspace-project-state.service";
// types
import type { IRouterStore } from "@/store/router.store";
import type { CoreRootStore } from "../root.store";

export interface IProjectStateStore {
  // observables
  projectStateMap: Record<string, Record<string, IProjectState>>;
  // computed
  projectStateIds: string[] | null;
  // computed actions
  getProjectStateById: (projectStateId: string) => IProjectState | null;
  // fetch actions
  fetchProjectStates: (workspaceSlug: string) => Promise<IProjectState[]>;
  // crud actions
  createProjectState: (workspaceSlug: string, data: Partial<IProjectState>) => Promise<IProjectState>;
  updateProjectState: (
    workspaceSlug: string,
    projectStateId: string,
    data: Partial<IProjectState>
  ) => Promise<IProjectState>;
  deleteProjectState: (workspaceSlug: string, projectStateId: string) => Promise<void>;
}

export class ProjectStateStore implements IProjectStateStore {
  // observables
  projectStateMap: Record<string, Record<string, IProjectState>> = {}; // { workspaceSlug: { stateId: stateDetails } }
  // stores
  routerStore: IRouterStore;
  // services
  projectStateService: WorkspaceProjectStateService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      projectStateMap: observable,
      // computed
      projectStateIds: computed,
      // actions
      fetchProjectStates: action,
      createProjectState: action,
      updateProjectState: action,
      deleteProjectState: action,
    });
    // root store
    this.routerStore = _rootStore.router;
    // services
    this.projectStateService = new WorkspaceProjectStateService();
  }

  /**
   * @description get the list of all project state ids for the current workspace
   */
  get projectStateIds() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const projectStates = this.projectStateMap[workspaceSlug];
    if (!projectStates) return null;
    return Object.keys(projectStates);
  }

  /**
   * @description get project state details by id
   */
  getProjectStateById = (projectStateId: string): IProjectState | null => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    return this.projectStateMap?.[workspaceSlug]?.[projectStateId] ?? null;
  };

  /**
   * @description fetch all project states for a workspace
   */
  fetchProjectStates = async (workspaceSlug: string): Promise<IProjectState[]> => {
    try {
      const projectStates = await this.projectStateService.getProjectStates(workspaceSlug);
      runInAction(() => {
        projectStates.forEach((state) => {
          set(this.projectStateMap, [workspaceSlug, state.id], state);
        });
      });
      return projectStates;
    } catch (error) {
      console.error("Error fetching project states:", error);
      throw error;
    }
  };

  /**
   * @description create a new project state
   */
  createProjectState = async (workspaceSlug: string, data: Partial<IProjectState>): Promise<IProjectState> => {
    try {
      const projectState = await this.projectStateService.createProjectState(workspaceSlug, data);
      runInAction(() => {
        set(this.projectStateMap, [workspaceSlug, projectState.id], projectState);
      });
      return projectState;
    } catch (error) {
      console.error("Error creating project state:", error);
      throw error;
    }
  };

  /**
   * @description update an existing project state
   */
  updateProjectState = async (
    workspaceSlug: string,
    projectStateId: string,
    data: Partial<IProjectState>
  ): Promise<IProjectState> => {
    try {
      const projectState = await this.projectStateService.updateProjectState(workspaceSlug, projectStateId, data);
      runInAction(() => {
        set(this.projectStateMap, [workspaceSlug, projectStateId], projectState);
      });
      return projectState;
    } catch (error) {
      console.error("Error updating project state:", error);
      throw error;
    }
  };

  /**
   * @description delete a project state
   */
  deleteProjectState = async (workspaceSlug: string, projectStateId: string): Promise<void> => {
    try {
      await this.projectStateService.deleteProjectState(workspaceSlug, projectStateId);
      runInAction(() => {
        if (this.projectStateMap[workspaceSlug]) {
          delete this.projectStateMap[workspaceSlug][projectStateId];
        }
      });
    } catch (error) {
      console.error("Error deleting project state:", error);
      throw error;
    }
  };
}
