import { API_BASE_URL } from "@plane/constants";
import type {
  TProjectAutomation,
  TProjectAutomationCreate,
  TProjectAutomationUpdate,
  TAutomationLog,
  TAutomationActivity,
  TAutomationFilters,
  TAutomationLogFilters,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class AutomationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Get all automations for a project
   */
  async getProjectAutomations(
    workspaceSlug: string,
    projectId: string,
    filters?: TAutomationFilters
  ): Promise<TProjectAutomation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/`, {
      params: filters,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get a specific automation by ID
   */
  async getAutomation(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): Promise<TProjectAutomation> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a new automation
   */
  async createAutomation(
    workspaceSlug: string,
    projectId: string,
    data: TProjectAutomationCreate
  ): Promise<TProjectAutomation> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update an automation
   */
  async updateAutomation(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    data: TProjectAutomationUpdate
  ): Promise<TProjectAutomation> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete an automation
   */
  async deleteAutomation(workspaceSlug: string, projectId: string, automationId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Toggle automation active status
   */
  async toggleAutomationStatus(
    workspaceSlug: string,
    projectId: string,
    automationId: string,
    isActive: boolean
  ): Promise<TProjectAutomation> {
    return this.updateAutomation(workspaceSlug, projectId, automationId, { is_active: isActive });
  }

  /**
   * Get automation logs
   */
  async getAutomationLogs(
    workspaceSlug: string,
    projectId: string,
    filters?: TAutomationLogFilters
  ): Promise<TAutomationLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/automation-logs/`, {
      params: filters,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get automation activity/statistics
   */
  async getAutomationActivity(
    workspaceSlug: string,
    projectId: string,
    automationId: string
  ): Promise<TAutomationActivity> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/automations/${automationId}/activity/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
