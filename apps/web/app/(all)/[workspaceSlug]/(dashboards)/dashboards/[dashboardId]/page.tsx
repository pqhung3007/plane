"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { DashboardDetail } from "@/components/dashboards/dashboard-detail";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";

const DashboardDetailPage = observer(() => {
  const { workspaceSlug, dashboardId } = useParams();
  const router = useRouter();

  // Store
  const { fetchDashboard, getDashboardById, getWidgetsByDashboard, getLayoutsByDashboard } = useCustomDashboard();

  // Fetch dashboard
  const { isLoading, error } = useSWR(
    workspaceSlug && dashboardId ? `CUSTOM_DASHBOARD_${workspaceSlug}_${dashboardId}` : null,
    workspaceSlug && dashboardId ? () => fetchDashboard(workspaceSlug.toString(), dashboardId.toString()) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
    }
  );

  const dashboard = getDashboardById(dashboardId?.toString() ?? "");
  const widgets = getWidgetsByDashboard(dashboardId?.toString() ?? "") || [];
  const layouts = getLayoutsByDashboard(dashboardId?.toString() ?? "") || [];

  // Redirect if dashboard not found
  useEffect(() => {
    if (!isLoading && !dashboard && !error) {
      router.push(`/${workspaceSlug}/dashboards`);
    }
  }, [isLoading, dashboard, error, router, workspaceSlug]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader className="space-y-4">
          <Loader.Item height="60px" width="100%" />
          <Loader.Item height="300px" width="100%" />
        </Loader>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-custom-text-100 mb-2">Dashboard not found</h3>
          <p className="text-sm text-custom-text-200 mb-4">The dashboard you're looking for doesn't exist</p>
          <button
            onClick={() => router.push(`/${workspaceSlug}/dashboards`)}
            className="text-sm text-custom-primary hover:underline"
          >
            Back to Dashboards
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardDetail
      workspaceSlug={workspaceSlug?.toString() ?? ""}
      dashboard={dashboard}
      widgets={widgets}
      layouts={layouts}
    />
  );
});

export default DashboardDetailPage;
