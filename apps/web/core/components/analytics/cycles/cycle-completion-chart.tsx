import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IChartResponse, TChartData } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";

const analyticsService = new AnalyticsService();

const CycleCompletionChart = observer(() => {
  const { selectedDuration, selectedDurationLabel, selectedProjects, isPeekView } = useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();

  const { data: cycleCompletionData, isLoading: isCycleCompletionLoading } = useSWR(
    `cycle-completion-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "cycles",
        {
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
        },
        isPeekView
      )
  );

  const parsedData: TChartData<string, string>[] = useMemo(() => {
    if (!cycleCompletionData?.data) return [];
    return cycleCompletionData.data.map((datum) => ({
      ...datum,
      name: datum.cycle_name || datum.key,
      completion_percentage: datum.completion_percentage || 0,
    }));
  }, [cycleCompletionData]);

  // Define bar colors based on cycle status
  const getBarColor = (status: string) => {
    switch (status) {
      case "current":
        return "#F59E0B"; // orange
      case "upcoming":
        return "#3B82F6"; // blue
      case "completed":
        return "#10B981"; // green
      case "draft":
        return "#6B7280"; // gray
      default:
        return "#9CA3AF"; // default gray
    }
  };

  const bars = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];

    // Group by status and create bars
    const statusGroups = parsedData.reduce((acc, datum) => {
      const status = datum.status || "draft";
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(datum);
      return acc;
    }, {} as Record<string, typeof parsedData>);

    return [
      {
        key: "completion_percentage",
        label: "Completion %",
        fill: (datum: any) => getBarColor(datum.status),
        fillOpacity: 1,
      },
    ];
  }, [parsedData]);

  const customTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const statusColors: Record<string, string> = {
      current: "#F59E0B",
      upcoming: "#3B82F6",
      completed: "#10B981",
      draft: "#6B7280",
    };

    return (
      <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-3 shadow-md">
        <div className="mb-2 flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: statusColors[data.status] || "#9CA3AF" }}
          />
          <p className="text-sm font-medium text-custom-text-100">{data.cycle_name}</p>
        </div>
        <div className="space-y-1 text-xs text-custom-text-200">
          <p>
            <span className="font-medium">Completion:</span> {data.completion_percentage?.toFixed(1)}%
          </p>
          {data.start_date && (
            <p>
              <span className="font-medium">Start:</span> {renderFormattedDate(data.start_date)}
            </p>
          )}
          {data.end_date && (
            <p>
              <span className="font-medium">End:</span> {renderFormattedDate(data.end_date)}
            </p>
          )}
          <div className="mt-2 border-t border-custom-border-300 pt-2">
            <p>
              <span className="font-medium">Total:</span> {data.total_work_items || 0}
            </p>
            <p>
              <span className="font-medium">Completed:</span> {data.completed_work_items || 0}
            </p>
            <p>
              <span className="font-medium">Started:</span> {data.started_work_items || 0}
            </p>
            <p>
              <span className="font-medium">Unstarted:</span> {data.unstarted_work_items || 0}
            </p>
            <p>
              <span className="font-medium">Backlog:</span> {data.backlog_work_items || 0}
            </p>
            <p>
              <span className="font-medium">Cancelled:</span> {data.cancelled_work_items || 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnalyticsSectionWrapper
      title="Cycle Completion"
      subtitle="Completion percentage by cycle status"
      className="col-span-1"
    >
      {isCycleCompletionLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <BarChart
          className="h-[400px] w-full"
          data={parsedData}
          bars={bars}
          xAxis={{
            key: "name",
            label: "Cycles",
          }}
          yAxis={{
            key: "completion_percentage",
            label: "Completion %",
            domain: [0, 100],
            offset: -60,
            dx: -24,
          }}
          customTooltip={customTooltip}
        />
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-custom-border-100 px-5 py-10 md:py-20 md:px-20"
          title="No cycle data available"
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default CycleCompletionChart;
