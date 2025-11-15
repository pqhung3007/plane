import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane package imports
import { CHART_COLOR_PALETTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import type { TBarItem, TChartDatum } from "@plane/types";
// plane web components
import { generateExtendedColors } from "@/components/chart/utils";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { AnalyticsService } from "@/services/analytics.service";
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";

const analyticsService = new AnalyticsService();

const ProjectsStatusChart = observer(() => {
  const { t } = useTranslation();
  // store hooks
  const { selectedDuration, selectedProjects, isPeekView } = useAnalytics();
  const { resolvedTheme } = useTheme();
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();

  const { data: projectsStatusData, isLoading } = useSWR(
    `projects-status-chart-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<{ data: TChartDatum<string, string>[]; schema: Record<string, string> }>(
        workspaceSlug,
        "projects-status",
        {
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
        },
        isPeekView
      )
  );

  const chartData: TChartDatum<string, string>[] = useMemo(() => {
    if (!projectsStatusData?.data) return [];
    return projectsStatusData.data;
  }, [projectsStatusData]);

  const baseColors = CHART_COLOR_PALETTES[0]?.[resolvedTheme === "dark" ? "dark" : "light"];
  const extendedColors = generateExtendedColors(baseColors ?? [], chartData.length);

  const bars: TBarItem<string>[] = useMemo(
    () => [
      {
        key: "projects",
        label: t("common.projects"),
        stackId: "bar-one",
        fill: (payload) => {
          const index = chartData.findIndex((item) => item.key === payload.key);
          return extendedColors[index] || baseColors?.[0] || "#3b82f6";
        },
        textClassName: "",
        showPercentage: false,
        showTopBorderRadius: () => true,
        showBottomBorderRadius: () => true,
      },
    ],
    [chartData, extendedColors, baseColors, t]
  );

  if (isLoading) return <ChartLoader />;

  return (
    <AnalyticsSectionWrapper
      i18nTitle="workspace_analytics.projects_by_status"
      i18nSubtitle="workspace_analytics.projects_by_status_subtitle"
    >
      <div className="flex flex-col gap-4">
        <BarChart
          data={chartData}
          bars={bars}
          xAxisKey="name"
          yAxisDomain={[0, 9]}
          showGrid
          showTooltip
          showLegend={false}
        />
      </div>
    </AnalyticsSectionWrapper>
  );
});

export default ProjectsStatusChart;
