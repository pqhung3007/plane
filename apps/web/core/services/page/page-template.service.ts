// types
import { API_BASE_URL } from "@plane/constants";
import type { TPageTemplate, TPageTemplateDetail } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class PageTemplateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // Workspace-level templates
  async fetchWorkspaceTemplates(workspaceSlug: string): Promise<TPageTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/page-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchWorkspaceTemplateById(workspaceSlug: string, templateId: string): Promise<TPageTemplateDetail> {
    return this.get(`/api/workspaces/${workspaceSlug}/page-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkspaceTemplate(
    workspaceSlug: string,
    data: Partial<TPageTemplate>
  ): Promise<TPageTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/page-templates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceTemplate(
    workspaceSlug: string,
    templateId: string,
    data: Partial<TPageTemplate>
  ): Promise<TPageTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/page-templates/${templateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceTemplate(workspaceSlug: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/page-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Project-level templates
  async fetchProjectTemplates(workspaceSlug: string, projectId: string): Promise<TPageTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/page-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchProjectTemplateById(
    workspaceSlug: string,
    projectId: string,
    templateId: string
  ): Promise<TPageTemplateDetail> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/page-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectTemplate(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TPageTemplate>
  ): Promise<TPageTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/page-templates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectTemplate(
    workspaceSlug: string,
    projectId: string,
    templateId: string,
    data: Partial<TPageTemplate>
  ): Promise<TPageTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/page-templates/${templateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectTemplate(workspaceSlug: string, projectId: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/page-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Template content update
  async updateTemplateContent(
    workspaceSlug: string,
    templateId: string,
    data: {
      content?: any;
      content_binary?: string;
      content_html?: string;
    }
  ): Promise<TPageTemplateDetail> {
    return this.patch(`/api/workspaces/${workspaceSlug}/page-templates/${templateId}/content/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Use template to create a page
  async useTemplate(
    workspaceSlug: string,
    projectId: string,
    templateId: string,
    data: {
      name?: string;
      access?: number;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/page-templates/${templateId}/use/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
