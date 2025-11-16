import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import type { TDashboard, TCustomWidget, TWidgetLayout, TWidgetType } from "@plane/types";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";
import { DashboardHeader } from "./dashboard-header";
import { DashboardGrid } from "./dashboard-grid";
import { WidgetLibraryModal } from "./widget-library-modal";

type TDashboardDetailProps = {
  workspaceSlug: string;
  dashboard: TDashboard;
  widgets: TCustomWidget[];
  layouts: TWidgetLayout[];
};

export const DashboardDetail: FC<TDashboardDetailProps> = observer((props) => {
  const { workspaceSlug, dashboard, widgets, layouts } = props;

  // Store
  const { createWidget } = useCustomDashboard();

  // State
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [isWidgetLibraryOpen, setIsWidgetLibraryOpen] = useState(false);
  const [configuringWidgetId, setConfiguringWidgetId] = useState<string | null>(null);

  const handleToggleMode = () => {
    setMode((prev) => (prev === "view" ? "edit" : "view"));
  };

  const handleAddWidget = () => {
    setIsWidgetLibraryOpen(true);
  };

  const handleSelectWidget = async (widgetType: TWidgetType) => {
    try {
      // Get next available position
      const maxY = layouts.reduce((max, layout) => Math.max(max, layout.y + layout.h), 0);

      const newWidget = await createWidget(workspaceSlug, dashboard.id, {
        type: widgetType,
        appearance_config: {
          title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`,
          color_scheme: "modern",
          show_legends: true,
          show_tooltips: true,
        },
        data_config: {
          property: "priority",
          metric: "count",
        },
        layout: {
          i: "", // Will be set by backend
          x: 0,
          y: maxY,
          w: 4,
          h: 4,
          minW: 2,
          minH: 2,
        },
      });

      // Automatically switch to edit mode if not already
      if (mode === "view") {
        setMode("edit");
      }

      // Open configuration for the new widget
      setConfiguringWidgetId(newWidget.id);
    } catch (error) {
      console.error("Failed to create widget:", error);
    }
  };

  const handleConfigureWidget = (widgetId: string) => {
    setConfiguringWidgetId(widgetId);
    // TODO: Open configuration sidebar
    console.log("Configure widget:", widgetId);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <DashboardHeader dashboard={dashboard} mode={mode} onToggleMode={handleToggleMode} onAddWidget={handleAddWidget} />

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <DashboardGrid
          workspaceSlug={workspaceSlug}
          dashboardId={dashboard.id}
          widgets={widgets}
          layouts={layouts}
          mode={mode}
          onConfigureWidget={handleConfigureWidget}
        />
      </div>

      {/* Widget Library Modal */}
      <WidgetLibraryModal
        isOpen={isWidgetLibraryOpen}
        handleClose={() => setIsWidgetLibraryOpen(false)}
        onSelectWidget={handleSelectWidget}
      />

      {/* TODO: Widget Configuration Sidebar */}
      {configuringWidgetId && (
        <div className="fixed top-0 right-0 h-full w-96 bg-custom-background-100 border-l border-custom-border-200 shadow-lg z-50">
          <div className="p-4">
            <p className="text-sm text-custom-text-200">Widget configuration sidebar (to be implemented)</p>
            <button
              onClick={() => setConfiguringWidgetId(null)}
              className="mt-4 text-sm text-custom-primary hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
