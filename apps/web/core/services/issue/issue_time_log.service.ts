// plane types
import { API_BASE_URL } from "@plane/constants";
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

// Types
export type TTimeLog = {
  id: string;
  issue: string;
  user: string;
  duration_minutes: number;
  logged_date: string;
  description?: string;
  billable: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  workspace: string;
  project: string;
  user_detail?: {
    id: string;
    display_name: string;
    avatar: string;
  };
  issue_detail?: {
    id: string;
    name: string;
    sequence_id: number;
  };
};

export type TTimeLogCreateData = {
  user?: string;
  duration_minutes: number;
  logged_date: string;
  description?: string;
  billable?: boolean;
};

export type TTimeLogStats = {
  total_minutes: number;
  total_hours: number;
  entry_count: number;
  billable_minutes: number;
  billable_hours: number;
  non_billable_minutes: number;
  non_billable_hours: number;
};

export class IssueTimeLogService extends APIService {
  private serviceType: TIssueServiceType;

  constructor(serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    super(API_BASE_URL);
    this.serviceType = serviceType;
  }

  /**
   * Get all time logs for a specific issue
   */
  async getIssueTimeLogs(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      cursor?: string;
      per_page?: number;
    }
  ): Promise<{ results: TTimeLog[]; next_cursor: string | null; prev_cursor: string | null }> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/time-logs/`,
      { params }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new time log entry for an issue
   */
  async createIssueTimeLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TTimeLogCreateData
  ): Promise<TTimeLog> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/time-logs/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get a specific time log entry
   */
  async getTimeLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeLogId: string
  ): Promise<TTimeLog> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/time-logs/${timeLogId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a time log entry
   */
  async updateTimeLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeLogId: string,
    data: Partial<TTimeLogCreateData>
  ): Promise<TTimeLog> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/time-logs/${timeLogId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a time log entry
   */
  async deleteTimeLog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    timeLogId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/${this.serviceType}/${issueId}/time-logs/${timeLogId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export class WorkspaceTimeLogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all time logs for a workspace with filtering
   */
  async getWorkspaceTimeLogs(
    workspaceSlug: string,
    params?: {
      user_ids?: string;
      project_ids?: string;
      start_date?: string;
      end_date?: string;
      billable?: boolean;
      cursor?: string;
      per_page?: number;
    }
  ): Promise<{ results: TTimeLog[]; next_cursor: string | null; prev_cursor: string | null }> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-logs/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get aggregated time log statistics for a workspace
   */
  async getWorkspaceTimeLogStats(
    workspaceSlug: string,
    params?: {
      user_ids?: string;
      project_ids?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<TTimeLogStats> {
    return this.get(`/api/workspaces/${workspaceSlug}/time-logs/stats/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
