import { API_BASE_URL } from "@plane/constants";
import type {
  THomeDashboardResponse,
  TWidget,
  TWidgetStatsResponse,
  TWidgetStatsRequestParams,
  TDashboard,
  TDashboardCreatePayload,
  TDashboardUpdatePayload,
  TDashboardWithWidgets,
  TCustomWidget,
  TCustomWidgetCreatePayload,
  TCustomWidgetUpdatePayload,
  TWidgetDataResponse,
  TWidgetLayout,
} from "@plane/types";
import { APIService } from "@/services/api.service";
// helpers
// types

export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getHomeDashboardWidgets(workspaceSlug: string): Promise<THomeDashboardResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard/`, {
      params: {
        dashboard_type: "home",
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWidgetStats(
    workspaceSlug: string,
    dashboardId: string,
    params: TWidgetStatsRequestParams
  ): Promise<TWidgetStatsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/dashboard/${dashboardId}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getDashboardDetails(dashboardId: string): Promise<TWidgetStatsResponse> {
    return this.get(`/api/dashboard/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateDashboardWidget(dashboardId: string, widgetId: string, data: Partial<TWidget>): Promise<TWidget> {
    return this.patch(`/api/dashboard/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== Custom Dashboards =====

  async getCustomDashboards(workspaceSlug: string): Promise<TDashboard[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/custom-dashboards/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCustomDashboard(workspaceSlug: string, dashboardId: string): Promise<TDashboardWithWidgets> {
    return this.get(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createCustomDashboard(workspaceSlug: string, data: TDashboardCreatePayload): Promise<TDashboard> {
    return this.post(`/api/workspaces/${workspaceSlug}/custom-dashboards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCustomDashboard(
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardUpdatePayload
  ): Promise<TDashboard> {
    return this.patch(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCustomDashboard(workspaceSlug: string, dashboardId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== Custom Widgets =====

  async createCustomWidget(
    workspaceSlug: string,
    dashboardId: string,
    data: TCustomWidgetCreatePayload
  ): Promise<TCustomWidget> {
    return this.post(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/widgets/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCustomWidget(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TCustomWidgetUpdatePayload
  ): Promise<TCustomWidget> {
    return this.patch(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/widgets/${widgetId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCustomWidget(workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/widgets/${widgetId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWidgetLayouts(
    workspaceSlug: string,
    dashboardId: string,
    layouts: TWidgetLayout[]
  ): Promise<TWidgetLayout[]> {
    return this.patch(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/layouts/`, { layouts })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWidgetData(
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<TWidgetDataResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/custom-dashboards/${dashboardId}/widgets/${widgetId}/data/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
