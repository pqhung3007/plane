// services
import { API_BASE_URL } from "@plane/constants";
import type {
  TWorkItemTemplate,
  TWorkItemTemplateCreatePayload,
  TWorkItemTemplateUpdatePayload,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorkItemTemplateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all work item templates for a project
   */
  async getTemplates(workspaceSlug: string, projectId: string): Promise<TWorkItemTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get all work item templates for a workspace
   */
  async getWorkspaceTemplates(workspaceSlug: string): Promise<TWorkItemTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-item-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get a specific work item template
   */
  async getTemplate(workspaceSlug: string, projectId: string, templateId: string): Promise<TWorkItemTemplate> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new work item template
   */
  async createTemplate(
    workspaceSlug: string,
    projectId: string,
    data: TWorkItemTemplateCreatePayload
  ): Promise<TWorkItemTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-templates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Create a workspace-level work item template
   */
  async createWorkspaceTemplate(
    workspaceSlug: string,
    data: TWorkItemTemplateCreatePayload
  ): Promise<TWorkItemTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/work-item-templates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Update a work item template
   */
  async updateTemplate(
    workspaceSlug: string,
    projectId: string,
    templateId: string,
    data: TWorkItemTemplateUpdatePayload
  ): Promise<TWorkItemTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-templates/${templateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a workspace-level work item template
   */
  async updateWorkspaceTemplate(
    workspaceSlug: string,
    templateId: string,
    data: TWorkItemTemplateUpdatePayload
  ): Promise<TWorkItemTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/work-item-templates/${templateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a work item template
   */
  async deleteTemplate(workspaceSlug: string, projectId: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/work-item-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Delete a workspace-level work item template
   */
  async deleteWorkspaceTemplate(workspaceSlug: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/work-item-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
