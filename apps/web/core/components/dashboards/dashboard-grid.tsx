import type { FC } from "react";
import { useState, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import GridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { TCustomWidget, TWidgetLayout } from "@plane/types";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";
import { WidgetWrapper } from "./widget-wrapper";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

type TDashboardGridProps = {
  workspaceSlug: string;
  dashboardId: string;
  widgets: TCustomWidget[];
  layouts: TWidgetLayout[];
  mode: "view" | "edit";
  onConfigureWidget?: (widgetId: string) => void;
};

export const DashboardGrid: FC<TDashboardGridProps> = observer((props) => {
  const { workspaceSlug, dashboardId, widgets, layouts, mode, onConfigureWidget } = props;

  // Store
  const { updateLayouts, deleteWidget } = useCustomDashboard();

  // State
  const [isSaving, setIsSaving] = useState(false);

  // Convert TWidgetLayout[] to react-grid-layout Layout[]
  const gridLayouts: Layout[] = useMemo(() => {
    if (!layouts || layouts.length === 0) {
      // Generate default layouts for widgets without layout
      return widgets.map((widget, index) => ({
        i: widget.id,
        x: (index % 3) * 4, // 3 columns grid
        y: Math.floor(index / 3) * 4,
        w: 4,
        h: 4,
        minW: 2,
        minH: 2,
      }));
    }

    return layouts.map((layout) => ({
      i: layout.i,
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
      minW: layout.minW || 2,
      minH: layout.minH || 2,
      maxW: layout.maxW,
      maxH: layout.maxH,
    }));
  }, [layouts, widgets]);

  const handleLayoutChange = useCallback(
    async (newLayout: Layout[]) => {
      if (mode !== "edit" || isSaving) return;

      // Convert Layout[] back to TWidgetLayout[]
      const updatedLayouts: TWidgetLayout[] = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      }));

      try {
        setIsSaving(true);
        await updateLayouts(workspaceSlug, dashboardId, updatedLayouts);
      } catch (error) {
        console.error("Failed to save layouts:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [workspaceSlug, dashboardId, mode, isSaving, updateLayouts]
  );

  const handleDeleteWidget = useCallback(
    async (widgetId: string) => {
      if (!confirm("Are you sure you want to delete this widget?")) {
        return;
      }

      try {
        await deleteWidget(workspaceSlug, dashboardId, widgetId);
      } catch (error) {
        console.error("Failed to delete widget:", error);
      }
    },
    [workspaceSlug, dashboardId, deleteWidget]
  );

  if (!widgets || widgets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-custom-text-300 p-8">
        <p className="text-lg font-medium mb-2">No widgets yet</p>
        <p className="text-sm text-center max-w-md">
          {mode === "edit"
            ? "Click 'Add Widget' to start building your dashboard"
            : "Switch to edit mode to add widgets"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-5">
      <GridLayout
        className="layout"
        layout={gridLayouts}
        cols={12}
        rowHeight={80}
        width={1200}
        isDraggable={mode === "edit"}
        isResizable={mode === "edit"}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="relative">
            {/* Drag handle (only visible in edit mode) */}
            {mode === "edit" && (
              <div className="drag-handle absolute -top-2 left-1/2 -translate-x-1/2 z-10 cursor-move opacity-0 hover:opacity-100 transition-opacity">
                <div className="h-1 w-8 bg-custom-primary rounded-full" />
              </div>
            )}

            <WidgetWrapper
              workspaceSlug={workspaceSlug}
              dashboardId={dashboardId}
              widget={widget}
              mode={mode}
              onConfigure={onConfigureWidget}
              onDelete={handleDeleteWidget}
            />
          </div>
        ))}
      </GridLayout>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-custom-background-100 border border-custom-border-200 rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm text-custom-text-200">Saving layout...</p>
        </div>
      )}
    </div>
  );
});
