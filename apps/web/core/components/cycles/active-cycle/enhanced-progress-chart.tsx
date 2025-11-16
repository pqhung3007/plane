"use client";

import React, { useMemo } from "react";
// plane imports
import { AreaChart } from "@plane/propel/charts/area-chart";
import type { TChartData, TCycleEstimateType, TCyclePlotType, TProgressChartData } from "@plane/types";
import { renderFormattedDateWithoutYear } from "@plane/utils";

type EnhancedProgressChartProps = {
  data: TProgressChartData;
  plotType: TCyclePlotType;
  estimateType: TCycleEstimateType;
  totalValue: number;
  currentValue: number;
  idealValue: number;
  isLeading: boolean;
};

export const EnhancedProgressChart: React.FC<EnhancedProgressChartProps> = ({
  data,
  plotType,
  estimateType,
  totalValue,
  currentValue,
  idealValue,
  isLeading,
}) => {
  const chartData: TChartData<string, string>[] = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return data.map((item) => {
      const isPastOrToday = item.date <= today;
      const value = plotType === "burndown" ? item.pending : item.completed;

      return {
        name: renderFormattedDateWithoutYear(item.date),
        date: item.date,
        actual: isPastOrToday && item.actual !== undefined ? item.actual : null,
        ideal: item.ideal !== null ? item.ideal : null,
        // Add separate series for leading/trailing fill areas
        leadingFill: isPastOrToday && item.ideal !== null && value !== undefined
          ? plotType === "burndown"
            ? value < item.ideal ? item.ideal - value : 0  // Burndown: leading when actual < ideal
            : value > item.ideal ? value - item.ideal : 0  // Burnup: leading when actual > ideal
          : null,
        trailingFill: isPastOrToday && item.ideal !== null && value !== undefined
          ? plotType === "burndown"
            ? value > item.ideal ? value - item.ideal : 0  // Burndown: trailing when actual > ideal
            : value < item.ideal ? item.ideal - value : 0  // Burnup: trailing when actual < ideal
          : null,
        scope: item.scope !== undefined ? item.scope : null,
      };
    });
  }, [data, plotType]);

  const plotTitle = estimateType === "points" ? "points" : "work items";
  const valueLabel = plotType === "burndown" ? "Pending" : "Completed";

  return (
    <div className="flex w-full items-center justify-center">
      <AreaChart
        data={chartData}
        areas={[
          // Leading fill area (green)
          {
            key: "leadingFill",
            label: "Leading",
            strokeColor: "transparent",
            fill: plotType === "burndown" ? "#22c55e" : "#22c55e", // green
            fillOpacity: 0.2,
            showDot: false,
            smoothCurves: true,
            strokeOpacity: 0,
            stackId: "fill",
          },
          // Trailing fill area (red)
          {
            key: "trailingFill",
            label: "Trailing",
            strokeColor: "transparent",
            fill: "#ef4444", // red
            fillOpacity: 0.2,
            showDot: false,
            smoothCurves: true,
            strokeOpacity: 0,
            stackId: "fill",
          },
          // Ideal line (dashed gray)
          {
            key: "ideal",
            label: `Ideal ${plotTitle}`,
            strokeColor: "#94a3b8",
            fill: "transparent",
            fillOpacity: 0,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "line-ideal",
            style: {
              strokeDasharray: "6, 3",
              strokeWidth: 2,
            },
          },
          // Actual line (solid blue)
          {
            key: "actual",
            label: `${valueLabel} ${plotTitle}`,
            strokeColor: "#3b82f6",
            fill: "transparent",
            fillOpacity: 0,
            showDot: true,
            smoothCurves: true,
            strokeOpacity: 1,
            stackId: "line-actual",
            style: {
              strokeWidth: 2,
            },
          },
        ]}
        xAxis={{ key: "name", label: "Date" }}
        yAxis={{ key: "actual", label: valueLabel }}
        margin={{ bottom: 50, top: 20, left: 20, right: 20 }}
        className="h-[320px] w-full"
        legend={{
          align: "center",
          verticalAlign: "bottom",
          layout: "horizontal",
          wrapperStyles: {
            paddingTop: 20,
          },
        }}
      />
    </div>
  );
};
