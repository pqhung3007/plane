"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import type { ICycle, TCycleEstimateType } from "@plane/types";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

export type EnhancedCycleMetricsProps = {
  cycle: ICycle;
  handleFiltersUpdate: (conditions: TWorkItemFilterCondition[]) => void;
};

export const EnhancedCycleMetrics: React.FC<EnhancedCycleMetricsProps> = observer((props) => {
  const { cycle, handleFiltersUpdate } = props;

  // plane hooks
  const { t } = useTranslation();
  const { getEstimateTypeByCycleId } = useCycle();

  // derived values
  const estimateType: TCycleEstimateType = getEstimateTypeByCycleId(cycle.id) || "issues";

  const metrics = useMemo(() => {
    if (estimateType === "points") {
      const total = cycle.total_estimate_points || 0;
      const cancelled = cycle.cancelled_estimate_points || 0;
      const scope = total - cancelled;
      const pending = (cycle.backlog_estimate_points || 0) + (cycle.unstarted_estimate_points || 0) + (cycle.started_estimate_points || 0);
      const started = cycle.started_estimate_points || 0;
      const unstarted = cycle.unstarted_estimate_points || 0;
      const backlog = cycle.backlog_estimate_points || 0;
      const completed = cycle.completed_estimate_points || 0;

      // Calculate ideal pending based on time elapsed
      const idealPending = scope > 0 ? Math.round(scope * 0.5) : 0; // Simplified - you can make this more accurate

      return {
        scope,
        pending,
        started,
        unstarted,
        backlog,
        completed,
        cancelled,
        idealPending,
        variance: pending - idealPending,
      };
    } else {
      const total = cycle.total_issues || 0;
      const cancelled = cycle.cancelled_issues || 0;
      const scope = total - cancelled;
      const pending = (cycle.backlog_issues || 0) + (cycle.unstarted_issues || 0) + (cycle.started_issues || 0);
      const started = cycle.started_issues || 0;
      const unstarted = cycle.unstarted_issues || 0;
      const backlog = cycle.backlog_issues || 0;
      const completed = cycle.completed_issues || 0;

      // Calculate ideal pending based on time elapsed
      const idealPending = scope > 0 ? Math.round(scope * 0.5) : 0; // Simplified

      return {
        scope,
        pending,
        started,
        unstarted,
        backlog,
        completed,
        cancelled,
        idealPending,
        variance: pending - idealPending,
      };
    }
  }, [cycle, estimateType]);

  const isTrailing = metrics.variance > 0;
  const unitLabel = estimateType === "points" ? t("points") : t("work items");

  return (
    <div className="flex flex-col min-h-[20rem] gap-6 py-4 px-4 bg-custom-background-100 border border-custom-border-200 rounded-lg">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-custom-text-300 mb-2">
          {t("Breakdown of this cycle's work items")}
        </h3>
        <div className={`flex items-center gap-1.5 font-medium ${
          isTrailing ? 'text-red-600' : 'text-green-600'
        }`}>
          <span className="text-lg">{isTrailing ? '↓' : '↑'}</span>
          <span>
            {isTrailing ? t("Trailing") : t("Leading")} by {Math.abs(metrics.variance)} {unitLabel}
          </span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-custom-border-200">
          <span className="text-sm text-custom-text-400">{t("Today's ideal pending")}</span>
          <span className="text-sm font-semibold text-custom-text-300">{metrics.idealPending}</span>
        </div>

        <div
          className="flex justify-between items-center cursor-pointer hover:bg-custom-background-80 -mx-2 px-2 py-1.5 rounded transition-colors"
          onClick={() => {
            const stateGroups = ['backlog', 'unstarted', 'started'];
            handleFiltersUpdate([{ property: "state_group", operator: "in", value: stateGroups }]);
          }}
        >
          <span className="text-sm text-custom-text-300">{t("Pending")}</span>
          <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
            isTrailing
              ? 'bg-red-500/10 text-red-700 dark:text-red-400'
              : 'bg-green-500/10 text-green-700 dark:text-green-400'
          }`}>
            {metrics.pending}
          </span>
        </div>

        <div
          className="flex justify-between items-center cursor-pointer hover:bg-custom-background-80 -mx-2 px-2 py-1.5 rounded transition-colors"
          onClick={() => {
            handleFiltersUpdate([{ property: "state_group", operator: "in", value: ['started'] }]);
          }}
        >
          <span className="text-sm text-custom-text-300">{t("Started")}</span>
          <span className="text-sm font-semibold px-2.5 py-0.5 bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-full">
            {metrics.started}
          </span>
        </div>

        <div
          className="flex justify-between items-center cursor-pointer hover:bg-custom-background-80 -mx-2 px-2 py-1.5 rounded transition-colors"
          onClick={() => {
            handleFiltersUpdate([{ property: "state_group", operator: "in", value: ['completed'] }]);
          }}
        >
          <span className="text-sm text-custom-text-300">{t("Completed")}</span>
          <span className="text-sm font-semibold px-2.5 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full">
            {metrics.completed}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-custom-border-200">
          <span className="text-sm text-custom-text-400">{t("Scope")}</span>
          <span className="text-sm font-semibold text-custom-text-300">{metrics.scope}</span>
        </div>
      </div>

      {/* Other State Groups */}
      <div className="space-y-3 pt-3 border-t border-custom-border-200">
        <h4 className="text-sm font-semibold text-custom-text-300">
          {t("Other work item state groups")}
        </h4>

        <div
          className="flex justify-between items-center text-sm cursor-pointer hover:bg-custom-background-80 -mx-2 px-2 py-1.5 rounded transition-colors"
          onClick={() => {
            handleFiltersUpdate([{ property: "state_group", operator: "in", value: ['unstarted'] }]);
          }}
        >
          <span className="text-custom-text-400">{t("Unstarted")}</span>
          <span className="text-custom-text-300">{metrics.unstarted}</span>
        </div>

        <div
          className="flex justify-between items-center text-sm cursor-pointer hover:bg-custom-background-80 -mx-2 px-2 py-1.5 rounded transition-colors"
          onClick={() => {
            handleFiltersUpdate([{ property: "state_group", operator: "in", value: ['backlog'] }]);
          }}
        >
          <span className="text-custom-text-400">{t("Backlog")}</span>
          <span className="text-custom-text-300">{metrics.backlog}</span>
        </div>

        {metrics.cancelled > 0 && (
          <div
            className="flex justify-between items-center text-sm cursor-pointer hover:bg-custom-background-80 -mx-2 px-2 py-1.5 rounded transition-colors"
            onClick={() => {
              handleFiltersUpdate([{ property: "state_group", operator: "in", value: ['cancelled'] }]);
            }}
          >
            <span className="text-custom-text-400">{t("Cancelled")}</span>
            <span className="text-custom-text-300">{metrics.cancelled}</span>
          </div>
        )}
      </div>
    </div>
  );
});
