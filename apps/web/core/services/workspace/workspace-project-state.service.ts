// services
import { API_BASE_URL } from "@plane/constants";
import type { IProjectState } from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorkspaceProjectStateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createProjectState(workspaceSlug: string, data: Partial<IProjectState>): Promise<IProjectState> {
    return this.post(`/api/workspaces/${workspaceSlug}/project-states/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getProjectStates(workspaceSlug: string): Promise<IProjectState[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-states/`)
      .then((response) => response?.data?.results || response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectState(workspaceSlug: string, projectStateId: string): Promise<IProjectState> {
    return this.get(`/api/workspaces/${workspaceSlug}/project-states/${projectStateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectState(
    workspaceSlug: string,
    projectStateId: string,
    data: Partial<IProjectState>
  ): Promise<IProjectState> {
    return this.patch(`/api/workspaces/${workspaceSlug}/project-states/${projectStateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectState(workspaceSlug: string, projectStateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/project-states/${projectStateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
