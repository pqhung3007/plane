import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IChartResponse, TChartData } from "@plane/types";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";

const analyticsService = new AnalyticsService();

const CycleCompletionChart = observer(() => {
  const { selectedDuration, selectedDurationLabel, selectedProjects } = useAnalytics();
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();

  const { data: cycleCompletionData, isLoading } = useSWR(
    `cycle-completion-${workspaceSlug}-${selectedDuration}-${selectedProjects}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<IChartResponse>(
        workspaceSlug,
        "modules",
        {
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
        }
      )
  );

  const parsedData: TChartData<string, number>[] = useMemo(() => {
    if (!cycleCompletionData?.data) return [];
    return cycleCompletionData.data.map((datum) => ({
      ...datum,
      name: datum.name,
      completion_percentage: datum.completion_percentage || 0,
    }));
  }, [cycleCompletionData]);

  const getBarColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "current":
        return "#F59E0B"; // orange
      case "upcoming":
        return "#3B82F6"; // blue
      case "completed":
        return "#10B981"; // green
      case "draft":
        return "#6B7280"; // gray
      default:
        return "#9CA3AF";
    }
  };

  const bars = useMemo(
    () => [
      {
        key: "completion_percentage",
        label: t("workspace_analytics.completion_percentage"),
        fill: (payload: any) => getBarColor(payload.key),
        stackId: "bar-one",
        showTopBorderRadius: () => true,
        showBottomBorderRadius: () => true,
      },
    ],
    [t]
  );

  return (
    <AnalyticsSectionWrapper
      title={t("workspace_analytics.cycle_completion_by_status")}
      subtitle={selectedDurationLabel}
      className="col-span-1"
    >
      {isLoading ? (
        <ChartLoader />
      ) : parsedData && parsedData.length > 0 ? (
        <BarChart
          className="h-[350px] w-full"
          data={parsedData}
          bars={bars}
          xAxis={{
            key: "name",
            label: t("workspace_analytics.cycle_status"),
          }}
          yAxis={{
            key: "completion_percentage",
            label: t("workspace_analytics.completion_percentage"),
            domain: [0, 100],
            offset: -60,
            dx: -24,
          }}
          customTooltipContent={(props) => {
            if (!props.active || !props.payload || props.payload.length === 0) return null;
            const data = props.payload[0].payload;
            return (
              <div className="rounded-md border border-custom-border-200 bg-custom-background-100 p-3 shadow-md">
                <p className="text-sm font-semibold text-custom-text-100 mb-2">
                  {data.name} {t("common.cycles")}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-custom-text-200">
                    {t("workspace_analytics.completion")}: {data.completion_percentage}%
                  </p>
                  <p className="text-xs text-custom-text-200">
                    {t("common.total")}: {data.count} {t("common.cycles")}
                  </p>
                </div>
              </div>
            );
          }}
        />
      ) : (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-custom-border-100 px-5 py-10 md:py-20 md:px-20"
          title={t("workspace_empty_state.analytics_modules.title")}
        />
      )}
    </AnalyticsSectionWrapper>
  );
});

export default CycleCompletionChart;
