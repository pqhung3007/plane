import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TBarItem, UserAnalyticsColumns } from "@plane/types";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";
import { Avatar } from "@plane/propel/avatar";
import { EUserWorkspaceRoles } from "@plane/types";

const analyticsService = new AnalyticsService();

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const roleLabels = {
      [EUserWorkspaceRoles.ADMIN]: "Admin",
      [EUserWorkspaceRoles.MEMBER]: "Member",
      [EUserWorkspaceRoles.GUEST]: "Guest",
    };

    return (
      <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-3 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Avatar
            name={data.user_name}
            src={data.user_avatar}
            size="sm"
            showTooltip={false}
          />
          <div>
            <div className="font-medium text-sm">{data.user_name}</div>
            <div className="text-xs text-custom-text-300">
              {roleLabels[data.user_role] || "Member"}
            </div>
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-custom-text-300">Total Work Items:</span>
            <span className="font-medium">{data.total_work_items}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-green-600">Resolved:</span>
            <span className="font-medium text-green-600">{data.completed_work_items}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-custom-text-300">Pending:</span>
            <span className="font-medium">{data.pending_work_items}</span>
          </div>
          <div className="ml-4 space-y-1 text-custom-text-400">
            <div className="flex justify-between gap-4">
              <span>• Started:</span>
              <span>{data.started_work_items}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>• Unstarted:</span>
              <span>{data.unstarted_work_items}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>• Backlog:</span>
              <span>{data.backlog_work_items}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const UserWorkItemsChart = observer(() => {
  const {
    selectedProjects,
    selectedCycle,
    selectedModule,
    isPeekView,
  } = useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();

  const { data: userWorkItemsData, isLoading } = useSWR(
    `user-workitems-${workspaceSlug}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<UserAnalyticsColumns[]>(
        workspaceSlug,
        "user-analytics",
        {
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );

  const chartData = useMemo(() => {
    if (!userWorkItemsData) return [];
    return userWorkItemsData.map((user) => ({
      key: user.user_id,
      name: user.user_name,
      user_name: user.user_name,
      user_avatar: user.user_avatar,
      user_email: user.user_email,
      user_role: user.user_role,
      total_work_items: user.total_work_items,
      completed_work_items: user.completed_work_items,
      pending_work_items: user.pending_work_items,
      started_work_items: user.started_work_items,
      unstarted_work_items: user.unstarted_work_items,
      backlog_work_items: user.backlog_work_items,
      count: user.total_work_items,
    }));
  }, [userWorkItemsData]);

  const bars: TBarItem<string>[] = useMemo(
    () => [
      {
        key: "pending_work_items",
        label: "Pending",
        stackId: "user-workitems",
        fill: "#94a3b8", // gray color
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: () => false,
        showBottomBorderRadius: () => true,
      },
      {
        key: "completed_work_items",
        label: "Resolved",
        stackId: "user-workitems",
        fill: "#198038", // green color
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: () => true,
        showBottomBorderRadius: () => false,
      },
    ],
    []
  );

  return (
    <AnalyticsSectionWrapper
      title="Work Items by User"
      subtitle="Resolved vs Pending work items per active user"
      className="col-span-1"
    >
      {isLoading ? (
        <ChartLoader />
      ) : chartData && chartData.length > 0 ? (
        <BarChart
          className="h-[400px] w-full"
          data={chartData}
          bars={bars}
          margin={{
            bottom: 50,
          }}
          xAxis={{
            key: "name",
            label: "Active Users",
            dy: 30,
            angle: -45,
            textAnchor: "end",
          }}
          yAxis={{
            key: "count",
            label: "Number of Work Items",
            offset: -60,
            dx: -26,
          }}
          legend={{
            align: "left",
            verticalAlign: "bottom",
            layout: "horizontal",
            wrapperStyles: {
              justifyContent: "start",
              alignContent: "start",
              paddingLeft: "40px",
              paddingTop: "10px",
            },
          }}
          tooltip={{
            content: CustomTooltip,
          }}
        />
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-custom-border-100 px-5 py-10 md:py-20 md:px-20"
          title="No user work items data available"
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default UserWorkItemsChart;
