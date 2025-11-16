"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { ICycle, TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { formatActiveCycle } from "@plane/utils";
import { Loader } from "@plane/ui";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
import { useCycle } from "@/hooks/store/use-cycle";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { EnhancedProgressChart } from "./enhanced-progress-chart";
import { EstimateTypeDropdown } from "../dropdowns/estimate-type-dropdown";

export type EnhancedActiveCycleChartProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle | null;
  plotType: TCyclePlotType;
};

export const EnhancedActiveCycleChart: React.FC<EnhancedActiveCycleChartProps> = observer((props) => {
  const { workspaceSlug, projectId, cycle, plotType } = props;

  // plane hooks
  const { t } = useTranslation();

  // hooks
  const { getEstimateTypeByCycleId, setEstimateType } = useCycle();

  // derived values
  const estimateType: TCycleEstimateType = (cycle && getEstimateTypeByCycleId(cycle.id)) || "issues";
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/active-cycle/chart" });

  const onChange = async (value: TCycleEstimateType) => {
    if (!workspaceSlug || !projectId || !cycle || !cycle.id) return;
    setEstimateType(cycle.id, value);
  };

  const chartData = useMemo(() => {
    if (!cycle) return [];
    const isBurnDown = plotType === "burndown";
    const isTypeIssue = estimateType === "issues";
    return formatActiveCycle({ cycle, isBurnDown, isTypeIssue });
  }, [cycle, plotType, estimateType]);

  const totalValue = useMemo(() => {
    if (!cycle) return 0;
    return estimateType === "points"
      ? (cycle.total_estimate_points || 0) - (cycle.cancelled_estimate_points || 0)
      : (cycle.total_issues || 0) - (cycle.cancelled_issues || 0);
  }, [cycle, estimateType]);

  const currentValue = useMemo(() => {
    if (!cycle) return 0;
    const today = new Date().toISOString().split('T')[0];
    const todayData = chartData.find(d => d.date === today);
    if (!todayData) return 0;
    return plotType === "burndown" ? todayData.pending : todayData.completed;
  }, [cycle, chartData, plotType]);

  const idealValue = useMemo(() => {
    if (!cycle) return 0;
    const today = new Date().toISOString().split('T')[0];
    const todayData = chartData.find(d => d.date === today);
    return todayData?.ideal || 0;
  }, [cycle, chartData]);

  const isLeading = plotType === "burndown"
    ? currentValue < idealValue // For burndown, fewer pending items is leading
    : currentValue > idealValue; // For burnup, more completed items is leading

  const variance = Math.abs(currentValue - idealValue);

  return cycle && chartData.length > 0 ? (
    <div className="flex flex-col min-h-[20rem] gap-4 px-4 py-4 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base text-custom-text-300 font-semibold">
            {plotType === "burndown" ? t("Burn-down") : t("Build-up")}
          </h3>
          <span className="text-sm text-custom-text-400">for</span>
          <EstimateTypeDropdown
            value={estimateType}
            onChange={onChange}
            cycleId={cycle.id}
            projectId={projectId}
          />
        </div>
      </div>

      {cycle.total_issues > 0 ? (
        <>
          <div className="h-full w-full">
            <EnhancedProgressChart
              data={chartData}
              plotType={plotType}
              estimateType={estimateType}
              totalValue={totalValue}
              currentValue={currentValue}
              idealValue={idealValue}
              isLeading={isLeading}
            />
          </div>

          {/* Metrics Summary */}
          <div className="flex items-center justify-between text-sm border-t border-custom-border-200 pt-3">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-custom-text-400">
                  {plotType === "burndown" ? "Today's ideal pending" : "Today's ideal done"}
                </span>
                <span className="text-custom-text-300 font-semibold">{Math.round(idealValue)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-custom-text-400">
                  {plotType === "burndown" ? "Pending" : "Done"}
                </span>
                <span className="text-custom-text-300 font-semibold">{Math.round(currentValue)}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md ${
              isLeading
                ? 'bg-green-500/10 text-green-600'
                : 'bg-red-500/10 text-red-600'
            }`}>
              <span className="font-medium">
                {isLeading ? "Leading" : "Trailing"} by {variance.toFixed(0)} {estimateType === "points" ? "points" : "work items"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <SimpleEmptyState title={t("active_cycle.empty_state.chart.title")} assetPath={resolvedPath} />
        </div>
      )}
    </div>
  ) : (
    <Loader className="flex flex-col min-h-[20rem] gap-5 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      <Loader.Item width="100%" height="100%" />
    </Loader>
  );
});
