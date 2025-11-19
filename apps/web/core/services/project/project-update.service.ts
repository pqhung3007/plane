// services
import { API_BASE_URL } from "@plane/constants";
import type { IProjectUpdate, IProjectUpdateFormData, IProjectUpdateComment } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectUpdateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectUpdates(workspaceSlug: string, projectId: string): Promise<IProjectUpdate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectUpdate(
    workspaceSlug: string,
    projectId: string,
    data: IProjectUpdateFormData
  ): Promise<IProjectUpdate> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectUpdate(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<IProjectUpdateFormData>
  ): Promise<IProjectUpdate> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectUpdate(workspaceSlug: string, projectId: string, updateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addReaction(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    emoji: string
  ): Promise<IProjectUpdate> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/reactions/`, {
      emoji,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeReaction(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    reactionId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/reactions/${reactionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getComments(workspaceSlug: string, projectId: string, updateId: string): Promise<IProjectUpdateComment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createComment(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    comment: string
  ): Promise<IProjectUpdateComment> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/`, {
      comment,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateComment(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    commentId: string,
    comment: string
  ): Promise<IProjectUpdateComment> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/${commentId}/`,
      { comment }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteComment(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    commentId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/${commentId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
