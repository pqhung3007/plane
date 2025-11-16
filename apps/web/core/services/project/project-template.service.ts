import { API_BASE_URL } from "@plane/constants";
import type { IProjectTemplate, IProjectTemplateLite } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectTemplateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createProjectTemplate(
    workspaceSlug: string,
    data: Partial<IProjectTemplate>
  ): Promise<IProjectTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/project-templates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getProjectTemplates(workspaceSlug: string): Promise<IProjectTemplateLite[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-templates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectTemplate(workspaceSlug: string, templateId: string): Promise<IProjectTemplate> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectTemplate(
    workspaceSlug: string,
    templateId: string,
    data: Partial<IProjectTemplate>
  ): Promise<IProjectTemplate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectTemplate(workspaceSlug: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async useProjectTemplate(workspaceSlug: string, templateId: string): Promise<IProjectTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/use/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
