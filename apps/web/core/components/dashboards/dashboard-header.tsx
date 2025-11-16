import type { FC } from "react";
import { observer } from "mobx-react";
import { Eye, Edit3, Plus } from "lucide-react";
import { Button } from "@plane/ui";
import type { TDashboard } from "@plane/types";

type TDashboardHeaderProps = {
  dashboard: TDashboard;
  mode: "view" | "edit";
  onToggleMode: () => void;
  onAddWidget: () => void;
};

export const DashboardHeader: FC<TDashboardHeaderProps> = observer((props) => {
  const { dashboard, mode, onToggleMode, onAddWidget } = props;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-5 py-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-semibold text-custom-text-100 truncate">{dashboard.name}</h1>
        {dashboard.description && (
          <p className="text-sm text-custom-text-200 mt-1 line-clamp-1">{dashboard.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {mode === "edit" ? (
          <>
            <Button variant="primary" size="sm" prependIcon={<Plus />} onClick={onAddWidget}>
              Add Widget
            </Button>
            <Button variant="neutral-primary" size="sm" prependIcon={<Eye />} onClick={onToggleMode}>
              View
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" prependIcon={<Edit3 />} onClick={onToggleMode}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
});
