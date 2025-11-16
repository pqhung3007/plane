"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
import type { ICycle, TCycleEstimateType } from "@plane/types";
import { calculateCycleProgress } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

export type EnhancedCycleHeaderProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle;
};

export const EnhancedCycleHeader: React.FC<EnhancedCycleHeaderProps> = observer((props) => {
  const { workspaceSlug, projectId, cycle } = props;

  // plane hooks
  const { t } = useTranslation();
  const { getEstimateTypeByCycleId } = useCycle();

  // derived values
  const estimateType: TCycleEstimateType = getEstimateTypeByCycleId(cycle.id) || "issues";
  const progressPercentage = calculateCycleProgress(cycle, estimateType);

  const daysLeft = useMemo(() => {
    if (!cycle.end_date) return 0;
    const endDate = new Date(cycle.end_date);
    const today = new Date();
    const days = differenceInDays(endDate, today);
    return Math.max(0, days);
  }, [cycle.end_date]);

  const { completed, pending, total } = useMemo(() => {
    if (estimateType === "points") {
      return {
        completed: cycle.completed_estimate_points || 0,
        pending: (cycle.total_estimate_points || 0) - (cycle.completed_estimate_points || 0) - (cycle.cancelled_estimate_points || 0),
        total: (cycle.total_estimate_points || 0) - (cycle.cancelled_estimate_points || 0),
      };
    } else {
      return {
        completed: cycle.completed_issues || 0,
        pending: (cycle.total_issues || 0) - (cycle.completed_issues || 0) - (cycle.cancelled_issues || 0),
        total: (cycle.total_issues || 0) - (cycle.cancelled_issues || 0),
      };
    }
  }, [cycle, estimateType]);

  // Calculate if leading or trailing based on ideal progress
  const idealProgress = useMemo(() => {
    if (!cycle.start_date || !cycle.end_date) return 0;
    const startDate = new Date(cycle.start_date);
    const endDate = new Date(cycle.end_date);
    const today = new Date();

    const totalDuration = differenceInDays(endDate, startDate);
    const elapsedDuration = differenceInDays(today, startDate);

    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
  }, [cycle.start_date, cycle.end_date]);

  const isLeading = progressPercentage > idealProgress;
  const variance = Math.abs(progressPercentage - idealProgress);

  const formattedStartDate = cycle.start_date ? format(new Date(cycle.start_date), "MMM dd, yyyy") : "";
  const formattedEndDate = cycle.end_date ? format(new Date(cycle.end_date), "MMM dd, yyyy") : "";

  return (
    <div className="flex items-center justify-between gap-4 pb-6 border-b border-custom-border-200">
      <div className="flex items-center gap-4">
        {/* Progress Circle */}
        <Tooltip
          tooltipContent={
            <div className="px-2 py-1.5 space-y-1">
              <div className="text-xs font-medium">{t("Cycle Progress")}</div>
              <div className="text-xs text-custom-text-300">
                {completed} {t("completed")} / {total} {t("total")}
              </div>
              <div className="text-xs text-custom-text-300">
                {pending} {estimateType === "points" ? t("points") : t("work items")} {t("pending")}
              </div>
              <div className="text-xs text-custom-text-300 border-t border-custom-border-300 pt-1 mt-1">
                {daysLeft} {daysLeft === 1 ? t("day") : t("days")} {t("left")}
              </div>
            </div>
          }
        >
          <div className="w-16 h-16 relative cursor-pointer group">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              {/* Progress circle */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={isLeading ? "#22c55e" : progressPercentage > 70 ? "#3b82f6" : "#f59e0b"}
                strokeWidth="3"
                strokeDasharray={`${progressPercentage}, 100`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-custom-text-100">
              {progressPercentage}%
            </span>
          </div>
        </Tooltip>

        {/* Cycle Info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-custom-text-400">{t("Currently active cycle")}</span>
            <span className="text-xs font-medium bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
              {t("Beta")}
            </span>
          </div>
          <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}>
            <h1 className="text-2xl font-semibold text-custom-text-100 hover:text-custom-primary-100 transition-colors">
              {cycle.name}
            </h1>
          </Link>
          <div className="flex items-center gap-2 text-sm text-custom-text-400">
            <span>{formattedStartDate} → {formattedEndDate}</span>
            <span>•</span>
            <span>{daysLeft} {daysLeft === 1 ? t("day") : t("days")} {t("left")}</span>
          </div>
        </div>
      </div>

      {/* Leading/Trailing Indicator */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        isLeading
          ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
          : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
      }`}>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium uppercase tracking-wide">
            {isLeading ? "↗ Leading" : "↘ Trailing"}
          </span>
          <span className="text-sm font-semibold">
            {variance.toFixed(1)}% {isLeading ? "ahead" : "behind"} {t("schedule")}
          </span>
        </div>
      </div>
    </div>
  );
});
