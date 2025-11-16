// services
import { API_BASE_URL } from "@plane/constants";
import type { IMilestone, TMilestoneProgress, TIssuesResponse } from "@plane/types";
import { APIService } from "@/services/api.service";

export class MilestoneService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createMilestone(workspaceSlug: string, projectId: string, data: Partial<IMilestone>): Promise<IMilestone> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getMilestones(workspaceSlug: string, projectId: string): Promise<IMilestone[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getMilestoneDetails(workspaceSlug: string, projectId: string, milestoneId: string): Promise<IMilestone> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getMilestoneIssues(
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    queries?: any,
    config = {}
  ): Promise<TIssuesResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/milestone-issues/`,
      {
        params: queries,
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateMilestone(
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    data: Partial<IMilestone>
  ): Promise<IMilestone> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteMilestone(workspaceSlug: string, projectId: string, milestoneId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getMilestoneProgress(
    workspaceSlug: string,
    projectId: string,
    milestoneId: string
  ): Promise<TMilestoneProgress> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/progress/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async addMilestoneToFavorites(
    workspaceSlug: string,
    projectId: string,
    data: {
      milestone: string;
    }
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-milestones/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeMilestoneFromFavorites(workspaceSlug: string, projectId: string, milestoneId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-milestones/${milestoneId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addIssuesToMilestone(
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    data: { issues: string[] }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/milestone-issues/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeIssueFromMilestone(
    workspaceSlug: string,
    projectId: string,
    milestoneId: string,
    issueId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/milestones/${milestoneId}/milestone-issues/${issueId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
