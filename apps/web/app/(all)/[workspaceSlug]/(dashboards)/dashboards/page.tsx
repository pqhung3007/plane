"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { DashboardList } from "@/components/dashboards/dashboard-list";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";

const DashboardsPage = observer(() => {
  const { workspaceSlug } = useParams();

  // Store
  const { fetchDashboards, getDashboardsByWorkspace } = useCustomDashboard();

  // Fetch dashboards
  const { isLoading } = useSWR(
    workspaceSlug ? `CUSTOM_DASHBOARDS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchDashboards(workspaceSlug.toString()) : null,
    {
      revalidateIfStale: true,
      revalidateOnFocus: false,
    }
  );

  const dashboards = getDashboardsByWorkspace(workspaceSlug?.toString() ?? "");

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader className="space-y-4">
          <Loader.Item height="40px" width="100%" />
          <Loader.Item height="150px" width="100%" />
          <Loader.Item height="150px" width="100%" />
        </Loader>
      </div>
    );
  }

  return <DashboardList workspaceSlug={workspaceSlug?.toString() ?? ""} dashboards={dashboards || []} />;
});

export default DashboardsPage;
