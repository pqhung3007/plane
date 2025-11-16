import { set, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type {
  TWorkItemTemplate,
  TWorkItemTemplateCreatePayload,
  TWorkItemTemplateUpdatePayload,
} from "@plane/types";
// services
import { WorkItemTemplateService } from "@/services/work-item-template.service";
// store
import type { CoreRootStore } from "./root.store";

export interface IWorkItemTemplateStore {
  // Loaders
  fetchedMap: Record<string, boolean>;
  // Observable
  templateMap: Record<string, TWorkItemTemplate>;
  // Computed
  projectTemplates: TWorkItemTemplate[] | undefined;
  workspaceTemplates: TWorkItemTemplate[] | undefined;
  // Computed actions
  getWorkspaceTemplates: (workspaceSlug: string) => TWorkItemTemplate[] | undefined;
  getProjectTemplates: (projectId: string | undefined | null) => TWorkItemTemplate[] | undefined;
  getTemplateById: (templateId: string) => TWorkItemTemplate | null;
  getTemplatesByTypeId: (typeId: string) => TWorkItemTemplate[] | undefined;
  // Fetch actions
  fetchWorkspaceTemplates: (workspaceSlug: string) => Promise<TWorkItemTemplate[]>;
  fetchProjectTemplates: (workspaceSlug: string, projectId: string) => Promise<TWorkItemTemplate[]>;
  // CRUD actions
  createTemplate: (
    workspaceSlug: string,
    projectId: string,
    data: TWorkItemTemplateCreatePayload
  ) => Promise<TWorkItemTemplate>;
  createWorkspaceTemplate: (workspaceSlug: string, data: TWorkItemTemplateCreatePayload) => Promise<TWorkItemTemplate>;
  updateTemplate: (
    workspaceSlug: string,
    projectId: string,
    templateId: string,
    data: TWorkItemTemplateUpdatePayload
  ) => Promise<TWorkItemTemplate>;
  updateWorkspaceTemplate: (
    workspaceSlug: string,
    templateId: string,
    data: TWorkItemTemplateUpdatePayload
  ) => Promise<TWorkItemTemplate>;
  deleteTemplate: (workspaceSlug: string, projectId: string, templateId: string) => Promise<void>;
  deleteWorkspaceTemplate: (workspaceSlug: string, templateId: string) => Promise<void>;
}

export class WorkItemTemplateStore implements IWorkItemTemplateStore {
  // Root store
  rootStore;
  // Template map
  templateMap: Record<string, TWorkItemTemplate> = {};
  // Loaders
  fetchedMap: Record<string, boolean> = {};
  // Services
  workItemTemplateService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      templateMap: observable,
      fetchedMap: observable,
      // Computed
      projectTemplates: computed,
      workspaceTemplates: computed,
      // Actions
      fetchProjectTemplates: action,
      fetchWorkspaceTemplates: action,
      createTemplate: action,
      createWorkspaceTemplate: action,
      updateTemplate: action,
      updateWorkspaceTemplate: action,
      deleteTemplate: action,
      deleteWorkspaceTemplate: action,
    });

    // Root store
    this.rootStore = _rootStore;
    // Services
    this.workItemTemplateService = new WorkItemTemplateService();
  }

  /**
   * Returns the templates belonging to the current workspace
   */
  get workspaceTemplates() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return;
    return this.getWorkspaceTemplates(currentWorkspaceDetails.slug);
  }

  /**
   * Returns the templates belonging to the current project
   */
  get projectTemplates() {
    const projectId = this.rootStore.router.projectId;
    const workspaceSlug = this.rootStore.router.workspaceSlug || "";
    if (!projectId || !(this.fetchedMap[projectId] || this.fetchedMap[workspaceSlug])) return;
    return sortBy(
      Object.values(this.templateMap).filter((template) => template?.project_id === projectId),
      "name"
    );
  }

  /**
   * Get workspace templates by workspace slug
   */
  getWorkspaceTemplates = computedFn((workspaceSlug: string) => {
    const workspaceDetails = this.rootStore.workspaceRoot.getWorkspaceBySlug(workspaceSlug);
    if (!workspaceDetails || !this.fetchedMap[workspaceSlug]) return;
    return sortBy(
      Object.values(this.templateMap).filter(
        (template) => template.workspace_id === workspaceDetails.id && !template.project_id
      ),
      "name"
    );
  });

  /**
   * Get project templates by project ID
   */
  getProjectTemplates = computedFn((projectId: string | undefined | null) => {
    const workspaceSlug = this.rootStore.router.workspaceSlug || "";
    if (!projectId || !(this.fetchedMap[projectId] || this.fetchedMap[workspaceSlug])) return;
    return sortBy(
      Object.values(this.templateMap).filter((template) => template?.project_id === projectId),
      "name"
    );
  });

  /**
   * Get template info from the map using template ID
   */
  getTemplateById = computedFn((templateId: string): TWorkItemTemplate | null => this.templateMap?.[templateId] || null);

  /**
   * Get templates filtered by type ID
   */
  getTemplatesByTypeId = computedFn((typeId: string): TWorkItemTemplate[] | undefined => {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    const templates = this.getProjectTemplates(projectId);
    return templates?.filter((template) => template.type_id === typeId);
  });

  /**
   * Fetch all templates for a specific project
   */
  fetchProjectTemplates = async (workspaceSlug: string, projectId: string) =>
    await this.workItemTemplateService.getTemplates(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((template) => {
          set(this.templateMap, [template.id], template);
        });
        set(this.fetchedMap, projectId, true);
      });
      return response;
    });

  /**
   * Fetch all workspace-level templates
   */
  fetchWorkspaceTemplates = async (workspaceSlug: string) =>
    await this.workItemTemplateService.getWorkspaceTemplates(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((template) => {
          set(this.templateMap, [template.id], template);
        });
        set(this.fetchedMap, workspaceSlug, true);
      });
      return response;
    });

  /**
   * Create a new template for a specific project
   */
  createTemplate = async (workspaceSlug: string, projectId: string, data: TWorkItemTemplateCreatePayload) =>
    await this.workItemTemplateService.createTemplate(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.templateMap, [response.id], response);
      });
      return response;
    });

  /**
   * Create a new workspace-level template
   */
  createWorkspaceTemplate = async (workspaceSlug: string, data: TWorkItemTemplateCreatePayload) =>
    await this.workItemTemplateService.createWorkspaceTemplate(workspaceSlug, data).then((response) => {
      runInAction(() => {
        set(this.templateMap, [response.id], response);
      });
      return response;
    });

  /**
   * Update a template for a specific project
   */
  updateTemplate = async (
    workspaceSlug: string,
    projectId: string,
    templateId: string,
    data: TWorkItemTemplateUpdatePayload
  ) => {
    const originalTemplate = this.templateMap[templateId];
    try {
      runInAction(() => {
        set(this.templateMap, [templateId], { ...originalTemplate, ...data });
      });
      const response = await this.workItemTemplateService.updateTemplate(workspaceSlug, projectId, templateId, data);
      return response;
    } catch (error) {
      console.log("Failed to update template from project store");
      runInAction(() => {
        set(this.templateMap, [templateId], originalTemplate);
      });
      throw error;
    }
  };

  /**
   * Update a workspace-level template
   */
  updateWorkspaceTemplate = async (workspaceSlug: string, templateId: string, data: TWorkItemTemplateUpdatePayload) => {
    const originalTemplate = this.templateMap[templateId];
    try {
      runInAction(() => {
        set(this.templateMap, [templateId], { ...originalTemplate, ...data });
      });
      const response = await this.workItemTemplateService.updateWorkspaceTemplate(workspaceSlug, templateId, data);
      return response;
    } catch (error) {
      console.log("Failed to update workspace template");
      runInAction(() => {
        set(this.templateMap, [templateId], originalTemplate);
      });
      throw error;
    }
  };

  /**
   * Delete a template from the project
   */
  deleteTemplate = async (workspaceSlug: string, projectId: string, templateId: string) => {
    if (!this.templateMap[templateId]) return;
    await this.workItemTemplateService.deleteTemplate(workspaceSlug, projectId, templateId).then(() => {
      runInAction(() => {
        delete this.templateMap[templateId];
      });
    });
  };

  /**
   * Delete a workspace-level template
   */
  deleteWorkspaceTemplate = async (workspaceSlug: string, templateId: string) => {
    if (!this.templateMap[templateId]) return;
    await this.workItemTemplateService.deleteWorkspaceTemplate(workspaceSlug, templateId).then(() => {
      runInAction(() => {
        delete this.templateMap[templateId];
      });
    });
  };
}
