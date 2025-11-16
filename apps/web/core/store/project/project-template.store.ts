import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { IProjectTemplate, IProjectTemplateLite } from "@plane/types";
// services
import { ProjectTemplateService } from "@/services/project";
// store
import type { CoreRootStore } from "../root.store";

export interface IProjectTemplateStore {
  // observables
  projectTemplateMap: Record<string, IProjectTemplate>; // templateId: template info
  isLoading: boolean;
  // computed
  projectTemplates: IProjectTemplateLite[];
  // actions
  getTemplateById: (templateId: string | undefined | null) => IProjectTemplate | undefined;
  // fetch actions
  fetchProjectTemplates: (workspaceSlug: string) => Promise<IProjectTemplateLite[]>;
  fetchProjectTemplateDetails: (workspaceSlug: string, templateId: string) => Promise<IProjectTemplate>;
  // CRUD actions
  createProjectTemplate: (workspaceSlug: string, data: Partial<IProjectTemplate>) => Promise<IProjectTemplate>;
  updateProjectTemplate: (
    workspaceSlug: string,
    templateId: string,
    data: Partial<IProjectTemplate>
  ) => Promise<IProjectTemplate>;
  deleteProjectTemplate: (workspaceSlug: string, templateId: string) => Promise<void>;
  useProjectTemplate: (workspaceSlug: string, templateId: string) => Promise<IProjectTemplate>;
}

export class ProjectTemplateStore implements IProjectTemplateStore {
  // observables
  projectTemplateMap: Record<string, IProjectTemplate> = {};
  isLoading: boolean = false;

  // root store
  rootStore: CoreRootStore;
  // service
  projectTemplateService: ProjectTemplateService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      projectTemplateMap: observable,
      isLoading: observable,
      // computed
      projectTemplates: computed,
      // fetch actions
      fetchProjectTemplates: action,
      fetchProjectTemplateDetails: action,
      // CRUD actions
      createProjectTemplate: action,
      updateProjectTemplate: action,
      deleteProjectTemplate: action,
      useProjectTemplate: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.projectTemplateService = new ProjectTemplateService();
  }

  /**
   * @description returns all project templates as an array
   */
  get projectTemplates(): IProjectTemplateLite[] {
    const templates = Object.values(this.projectTemplateMap);
    return templates.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  /**
   * @description returns template info from template id
   * @param {string | undefined | null} templateId
   */
  getTemplateById = computedFn((templateId: string | undefined | null): IProjectTemplate | undefined => {
    if (!templateId) return undefined;
    return this.projectTemplateMap[templateId] ?? undefined;
  });

  /**
   * @description fetch all project templates
   * @param {string} workspaceSlug
   */
  fetchProjectTemplates = async (workspaceSlug: string): Promise<IProjectTemplateLite[]> => {
    try {
      runInAction(() => {
        this.isLoading = true;
      });

      const templates = await this.projectTemplateService.getProjectTemplates(workspaceSlug);

      runInAction(() => {
        templates.forEach((template) => {
          this.projectTemplateMap[template.id] = template as IProjectTemplate;
        });
        this.isLoading = false;
      });

      return templates;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * @description fetch project template details
   * @param {string} workspaceSlug
   * @param {string} templateId
   */
  fetchProjectTemplateDetails = async (workspaceSlug: string, templateId: string): Promise<IProjectTemplate> => {
    try {
      runInAction(() => {
        this.isLoading = true;
      });

      const template = await this.projectTemplateService.getProjectTemplate(workspaceSlug, templateId);

      runInAction(() => {
        this.projectTemplateMap[template.id] = template;
        this.isLoading = false;
      });

      return template;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * @description create project template
   * @param {string} workspaceSlug
   * @param {Partial<IProjectTemplate>} data
   */
  createProjectTemplate = async (
    workspaceSlug: string,
    data: Partial<IProjectTemplate>
  ): Promise<IProjectTemplate> => {
    try {
      const template = await this.projectTemplateService.createProjectTemplate(workspaceSlug, data);

      runInAction(() => {
        this.projectTemplateMap[template.id] = template;
      });

      return template;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description update project template
   * @param {string} workspaceSlug
   * @param {string} templateId
   * @param {Partial<IProjectTemplate>} data
   */
  updateProjectTemplate = async (
    workspaceSlug: string,
    templateId: string,
    data: Partial<IProjectTemplate>
  ): Promise<IProjectTemplate> => {
    try {
      const template = await this.projectTemplateService.updateProjectTemplate(workspaceSlug, templateId, data);

      runInAction(() => {
        this.projectTemplateMap[template.id] = template;
      });

      return template;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description delete project template
   * @param {string} workspaceSlug
   * @param {string} templateId
   */
  deleteProjectTemplate = async (workspaceSlug: string, templateId: string): Promise<void> => {
    try {
      await this.projectTemplateService.deleteProjectTemplate(workspaceSlug, templateId);

      runInAction(() => {
        delete this.projectTemplateMap[templateId];
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description use project template
   * @param {string} workspaceSlug
   * @param {string} templateId
   */
  useProjectTemplate = async (workspaceSlug: string, templateId: string): Promise<IProjectTemplate> => {
    try {
      const template = await this.projectTemplateService.useProjectTemplate(workspaceSlug, templateId);

      runInAction(() => {
        this.projectTemplateMap[template.id] = template;
      });

      return template;
    } catch (error) {
      throw error;
    }
  };
}
