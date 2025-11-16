import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, LayoutDashboard, Calendar, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { Button, CustomMenu } from "@plane/ui";
import type { TDashboard } from "@plane/types";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";
import { CreateDashboardModal } from "./create-dashboard-modal";

type TDashboardListProps = {
  workspaceSlug: string;
  dashboards: TDashboard[];
};

type TDashboardCardProps = {
  workspaceSlug: string;
  dashboard: TDashboard;
  onDelete: () => void;
};

const DashboardCard: FC<TDashboardCardProps> = observer((props) => {
  const { workspaceSlug, dashboard, onDelete } = props;

  const formattedDate = new Date(dashboard.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/${workspaceSlug}/dashboards/${dashboard.id}`}
      className="group block p-4 border border-custom-border-200 rounded-lg hover:bg-custom-background-80 hover:border-custom-border-300 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            <div className="h-10 w-10 rounded-md bg-custom-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-custom-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-custom-text-100 truncate group-hover:text-custom-primary transition-colors">
              {dashboard.name}
            </h3>
            {dashboard.description && (
              <p className="text-sm text-custom-text-200 mt-1 line-clamp-2">{dashboard.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-custom-text-300">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Created {formattedDate}</span>
              </div>
              <div>
                <span>{dashboard.project_ids.length} project{dashboard.project_ids.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
          <CustomMenu
            ellipsis
            placement="bottom-end"
            customButton={
              <div className="grid place-items-center rounded p-1 text-custom-text-200 hover:bg-custom-background-80 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </div>
            }
          >
            <CustomMenu.MenuItem>
              <div className="flex items-center gap-2">
                <Edit2 className="h-3 w-3" />
                <span>Edit</span>
              </div>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={onDelete}>
              <div className="flex items-center gap-2 text-red-500">
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </Link>
  );
});

export const DashboardList: FC<TDashboardListProps> = observer((props) => {
  const { workspaceSlug, dashboards } = props;
  const router = useRouter();

  // Store
  const { deleteDashboard } = useCustomDashboard();

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDelete = async (dashboardId: string) => {
    if (!confirm("Are you sure you want to delete this dashboard? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDashboard(workspaceSlug, dashboardId);
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
    }
  };

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-custom-text-100">Dashboards</h2>
            <p className="text-sm text-custom-text-200 mt-1">
              Create and manage custom dashboards to visualize your project data
            </p>
          </div>
          <Button variant="primary" size="sm" prependIcon={<Plus />} onClick={() => setIsCreateModalOpen(true)}>
            Add Dashboard
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {dashboards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <DashboardCard
                  key={dashboard.id}
                  workspaceSlug={workspaceSlug}
                  dashboard={dashboard}
                  onDelete={() => handleDelete(dashboard.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="h-24 w-24 rounded-full bg-custom-background-80 flex items-center justify-center mb-4">
                <LayoutDashboard className="h-12 w-12 text-custom-text-300" />
              </div>
              <h3 className="text-lg font-semibold text-custom-text-100 mb-2">No dashboards yet</h3>
              <p className="text-sm text-custom-text-200 text-center max-w-md mb-6">
                Create your first custom dashboard to start visualizing your project data with charts and widgets
              </p>
              <Button variant="primary" size="sm" prependIcon={<Plus />} onClick={() => setIsCreateModalOpen(true)}>
                Create Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateDashboardModal
        workspaceSlug={workspaceSlug}
        isOpen={isCreateModalOpen}
        handleClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
});
