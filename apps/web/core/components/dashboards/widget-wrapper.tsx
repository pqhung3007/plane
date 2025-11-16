import type { FC } from "react";
import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Settings, Trash2, Loader2 } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import type { TCustomWidget, TWidgetDataResponse } from "@plane/types";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";
import { WidgetRenderer } from "./widgets";

type TWidgetWrapperProps = {
  workspaceSlug: string;
  dashboardId: string;
  widget: TCustomWidget;
  mode: "view" | "edit";
  onConfigure?: (widgetId: string) => void;
  onDelete?: (widgetId: string) => void;
};

export const WidgetWrapper: FC<TWidgetWrapperProps> = observer((props) => {
  const { workspaceSlug, dashboardId, widget, mode, onConfigure, onDelete } = props;

  // Store
  const { fetchWidgetData, getWidgetData } = useCustomDashboard();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get widget data from store
  const widgetData = getWidgetData(widget.id);

  // Fetch widget data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await fetchWidgetData(workspaceSlug, dashboardId, widget.id);
      } catch (err) {
        console.error("Failed to fetch widget data:", err);
        setError("Failed to load widget data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [workspaceSlug, dashboardId, widget.id, fetchWidgetData]);

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure(widget.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(widget.id);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-custom-background-100 border border-custom-border-200 rounded-lg overflow-hidden">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-custom-border-200">
        <h3 className="font-semibold text-custom-text-100 truncate">{widget.appearance_config.title || "Untitled"}</h3>

        {mode === "edit" && (
          <CustomMenu
            ellipsis
            placement="bottom-end"
            customButton={
              <div className="grid place-items-center rounded p-1 text-custom-text-200 hover:bg-custom-background-80">
                <Settings className="h-4 w-4" />
              </div>
            }
          >
            <CustomMenu.MenuItem onClick={handleConfigure}>
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                <span>Configure</span>
              </div>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleDelete}>
              <div className="flex items-center gap-2 text-red-500">
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        )}
      </div>

      {/* Widget Body */}
      <div className="flex-1 p-4 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-custom-text-300" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : !widgetData ? (
          <div className="h-full flex flex-col items-center justify-center text-custom-text-300">
            <p className="text-sm mb-2">Widget not configured</p>
            {mode === "edit" && (
              <button
                onClick={handleConfigure}
                className="text-sm text-custom-primary hover:underline"
              >
                Configure widget
              </button>
            )}
          </div>
        ) : (
          <WidgetRenderer widget={widget} data={widgetData} mode={mode} />
        )}
      </div>
    </div>
  );
});
