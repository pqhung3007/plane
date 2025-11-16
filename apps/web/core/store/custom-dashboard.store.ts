import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { set } from "lodash";
import type {
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
import { DashboardService } from "@/services/dashboard.service";
import type { IRouterStore } from "./router.store";

export interface ICustomDashboardStore {
  // Observables
  dashboards: Record<string, TDashboard[]>; // workspaceSlug -> dashboards
  dashboardDetails: Record<string, TDashboard>; // dashboardId -> dashboard
  widgets: Record<string, TCustomWidget[]>; // dashboardId -> widgets
  widgetData: Record<string, TWidgetDataResponse>; // widgetId -> data
  layouts: Record<string, TWidgetLayout[]>; // dashboardId -> layouts

  // Computed
  getDashboardsByWorkspace: (workspaceSlug: string) => TDashboard[] | undefined;
  getDashboardById: (dashboardId: string) => TDashboard | undefined;
  getWidgetsByDashboard: (dashboardId: string) => TCustomWidget[] | undefined;
  getWidgetData: (widgetId: string) => TWidgetDataResponse | undefined;
  getLayoutsByDashboard: (dashboardId: string) => TWidgetLayout[] | undefined;

  // Actions
  fetchDashboards: (workspaceSlug: string) => Promise<TDashboard[]>;
  fetchDashboard: (workspaceSlug: string, dashboardId: string) => Promise<TDashboardWithWidgets>;
  createDashboard: (workspaceSlug: string, data: TDashboardCreatePayload) => Promise<TDashboard>;
  updateDashboard: (workspaceSlug: string, dashboardId: string, data: TDashboardUpdatePayload) => Promise<TDashboard>;
  deleteDashboard: (workspaceSlug: string, dashboardId: string) => Promise<void>;

  createWidget: (workspaceSlug: string, dashboardId: string, data: TCustomWidgetCreatePayload) => Promise<TCustomWidget>;
  updateWidget: (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TCustomWidgetUpdatePayload
  ) => Promise<TCustomWidget>;
  deleteWidget: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<void>;
  updateLayouts: (workspaceSlug: string, dashboardId: string, layouts: TWidgetLayout[]) => Promise<TWidgetLayout[]>;
  fetchWidgetData: (workspaceSlug: string, dashboardId: string, widgetId: string) => Promise<TWidgetDataResponse>;
}

export class CustomDashboardStore implements ICustomDashboardStore {
  // Observables
  dashboards: Record<string, TDashboard[]> = {};
  dashboardDetails: Record<string, TDashboard> = {};
  widgets: Record<string, TCustomWidget[]> = {};
  widgetData: Record<string, TWidgetDataResponse> = {};
  layouts: Record<string, TWidgetLayout[]> = {};

  // Services
  dashboardService: DashboardService;
  routerStore: IRouterStore;

  constructor(routerStore: IRouterStore) {
    makeObservable(this, {
      // Observables
      dashboards: observable,
      dashboardDetails: observable,
      widgets: observable,
      widgetData: observable,
      layouts: observable,

      // Computed
      getDashboardsByWorkspace: computed,
      getDashboardById: computed,
      getWidgetsByDashboard: computed,
      getWidgetData: computed,
      getLayoutsByDashboard: computed,

      // Actions
      fetchDashboards: action,
      fetchDashboard: action,
      createDashboard: action,
      updateDashboard: action,
      deleteDashboard: action,
      createWidget: action,
      updateWidget: action,
      deleteWidget: action,
      updateLayouts: action,
      fetchWidgetData: action,
    });

    this.dashboardService = new DashboardService();
    this.routerStore = routerStore;
  }

  // ===== Computed =====

  get getDashboardsByWorkspace() {
    return (workspaceSlug: string) => this.dashboards[workspaceSlug];
  }

  get getDashboardById() {
    return (dashboardId: string) => this.dashboardDetails[dashboardId];
  }

  get getWidgetsByDashboard() {
    return (dashboardId: string) => this.widgets[dashboardId];
  }

  get getWidgetData() {
    return (widgetId: string) => this.widgetData[widgetId];
  }

  get getLayoutsByDashboard() {
    return (dashboardId: string) => this.layouts[dashboardId];
  }

  // ===== Actions =====

  fetchDashboards = async (workspaceSlug: string): Promise<TDashboard[]> => {
    try {
      const dashboards = await this.dashboardService.getCustomDashboards(workspaceSlug);
      runInAction(() => {
        set(this.dashboards, workspaceSlug, dashboards);
      });
      return dashboards;
    } catch (error) {
      throw error;
    }
  };

  fetchDashboard = async (workspaceSlug: string, dashboardId: string): Promise<TDashboardWithWidgets> => {
    try {
      const response = await this.dashboardService.getCustomDashboard(workspaceSlug, dashboardId);
      runInAction(() => {
        set(this.dashboardDetails, dashboardId, response.dashboard);
        set(this.widgets, dashboardId, response.widgets);
        set(this.layouts, dashboardId, response.layout);
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  createDashboard = async (workspaceSlug: string, data: TDashboardCreatePayload): Promise<TDashboard> => {
    try {
      const dashboard = await this.dashboardService.createCustomDashboard(workspaceSlug, data);
      runInAction(() => {
        const existingDashboards = this.dashboards[workspaceSlug] || [];
        set(this.dashboards, workspaceSlug, [...existingDashboards, dashboard]);
        set(this.dashboardDetails, dashboard.id, dashboard);
        set(this.widgets, dashboard.id, []);
        set(this.layouts, dashboard.id, []);
      });
      return dashboard;
    } catch (error) {
      throw error;
    }
  };

  updateDashboard = async (
    workspaceSlug: string,
    dashboardId: string,
    data: TDashboardUpdatePayload
  ): Promise<TDashboard> => {
    const originalDashboard = this.dashboardDetails[dashboardId];
    try {
      // Optimistic update
      runInAction(() => {
        if (originalDashboard) {
          set(this.dashboardDetails, dashboardId, { ...originalDashboard, ...data });
        }
      });

      const updatedDashboard = await this.dashboardService.updateCustomDashboard(workspaceSlug, dashboardId, data);

      runInAction(() => {
        set(this.dashboardDetails, dashboardId, updatedDashboard);
        // Update in the list as well
        const dashboardList = this.dashboards[workspaceSlug];
        if (dashboardList) {
          const index = dashboardList.findIndex((d) => d.id === dashboardId);
          if (index !== -1) {
            dashboardList[index] = updatedDashboard;
          }
        }
      });

      return updatedDashboard;
    } catch (error) {
      // Revert on error
      runInAction(() => {
        if (originalDashboard) {
          set(this.dashboardDetails, dashboardId, originalDashboard);
        }
      });
      throw error;
    }
  };

  deleteDashboard = async (workspaceSlug: string, dashboardId: string): Promise<void> => {
    const originalDashboards = this.dashboards[workspaceSlug];
    try {
      // Optimistic delete
      runInAction(() => {
        if (originalDashboards) {
          set(
            this.dashboards,
            workspaceSlug,
            originalDashboards.filter((d) => d.id !== dashboardId)
          );
        }
        delete this.dashboardDetails[dashboardId];
        delete this.widgets[dashboardId];
        delete this.layouts[dashboardId];
      });

      await this.dashboardService.deleteCustomDashboard(workspaceSlug, dashboardId);
    } catch (error) {
      // Revert on error
      runInAction(() => {
        if (originalDashboards) {
          set(this.dashboards, workspaceSlug, originalDashboards);
        }
      });
      throw error;
    }
  };

  createWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    data: TCustomWidgetCreatePayload
  ): Promise<TCustomWidget> => {
    try {
      const widget = await this.dashboardService.createCustomWidget(workspaceSlug, dashboardId, data);
      runInAction(() => {
        const existingWidgets = this.widgets[dashboardId] || [];
        set(this.widgets, dashboardId, [...existingWidgets, widget]);

        // Add layout if provided
        if (widget.layout) {
          const existingLayouts = this.layouts[dashboardId] || [];
          set(this.layouts, dashboardId, [...existingLayouts, widget.layout]);
        }
      });
      return widget;
    } catch (error) {
      throw error;
    }
  };

  updateWidget = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string,
    data: TCustomWidgetUpdatePayload
  ): Promise<TCustomWidget> => {
    const widgets = this.widgets[dashboardId];
    const widgetIndex = widgets?.findIndex((w) => w.id === widgetId) ?? -1;
    const originalWidget = widgetIndex >= 0 ? { ...widgets[widgetIndex] } : null;

    try {
      // Optimistic update
      if (widgets && widgetIndex >= 0) {
        runInAction(() => {
          widgets[widgetIndex] = { ...widgets[widgetIndex], ...data };
        });
      }

      const updatedWidget = await this.dashboardService.updateCustomWidget(
        workspaceSlug,
        dashboardId,
        widgetId,
        data
      );

      runInAction(() => {
        if (widgets && widgetIndex >= 0) {
          widgets[widgetIndex] = updatedWidget;
        }

        // Update layout if changed
        if (updatedWidget.layout) {
          const layouts = this.layouts[dashboardId];
          if (layouts) {
            const layoutIndex = layouts.findIndex((l) => l.i === widgetId);
            if (layoutIndex >= 0) {
              layouts[layoutIndex] = updatedWidget.layout;
            }
          }
        }
      });

      return updatedWidget;
    } catch (error) {
      // Revert on error
      if (originalWidget && widgets && widgetIndex >= 0) {
        runInAction(() => {
          widgets[widgetIndex] = originalWidget;
        });
      }
      throw error;
    }
  };

  deleteWidget = async (workspaceSlug: string, dashboardId: string, widgetId: string): Promise<void> => {
    const originalWidgets = this.widgets[dashboardId];
    const originalLayouts = this.layouts[dashboardId];

    try {
      // Optimistic delete
      runInAction(() => {
        if (originalWidgets) {
          set(
            this.widgets,
            dashboardId,
            originalWidgets.filter((w) => w.id !== widgetId)
          );
        }
        if (originalLayouts) {
          set(
            this.layouts,
            dashboardId,
            originalLayouts.filter((l) => l.i !== widgetId)
          );
        }
        delete this.widgetData[widgetId];
      });

      await this.dashboardService.deleteCustomWidget(workspaceSlug, dashboardId, widgetId);
    } catch (error) {
      // Revert on error
      runInAction(() => {
        if (originalWidgets) {
          set(this.widgets, dashboardId, originalWidgets);
        }
        if (originalLayouts) {
          set(this.layouts, dashboardId, originalLayouts);
        }
      });
      throw error;
    }
  };

  updateLayouts = async (
    workspaceSlug: string,
    dashboardId: string,
    layouts: TWidgetLayout[]
  ): Promise<TWidgetLayout[]> => {
    const originalLayouts = this.layouts[dashboardId];

    try {
      // Optimistic update
      runInAction(() => {
        set(this.layouts, dashboardId, layouts);
      });

      const updatedLayouts = await this.dashboardService.updateWidgetLayouts(workspaceSlug, dashboardId, layouts);

      runInAction(() => {
        set(this.layouts, dashboardId, updatedLayouts);
      });

      return updatedLayouts;
    } catch (error) {
      // Revert on error
      runInAction(() => {
        if (originalLayouts) {
          set(this.layouts, dashboardId, originalLayouts);
        }
      });
      throw error;
    }
  };

  fetchWidgetData = async (
    workspaceSlug: string,
    dashboardId: string,
    widgetId: string
  ): Promise<TWidgetDataResponse> => {
    try {
      const data = await this.dashboardService.getWidgetData(workspaceSlug, dashboardId, widgetId);
      runInAction(() => {
        set(this.widgetData, widgetId, data);
      });
      return data;
    } catch (error) {
      throw error;
    }
  };
}
