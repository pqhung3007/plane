import type { FC } from "react";
import { observer } from "mobx-react";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { LineChart } from "@plane/propel/charts/line-chart";
import { AreaChart } from "@plane/propel/charts/area-chart";
import { PieChart } from "@plane/propel/charts/pie-chart";
import type { TCustomWidget, TWidgetDataResponse } from "@plane/types";

type TWidgetProps = {
  widget: TCustomWidget;
  data?: TWidgetDataResponse;
  mode: "view" | "edit";
};

// Color schemes mapping
const COLOR_SCHEMES: Record<string, string[]> = {
  modern: ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"],
  horizon: ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7"],
  sunset: ["#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e"],
  ocean: ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e"],
  forest: ["#22c55e", "#16a34a", "#15803d", "#14532d", "#052e16"],
  vibrant: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"],
  monochrome: ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af"],
};

const BarChartWidget: FC<TWidgetProps> = observer(({ widget, data }) => {
  const { appearance_config } = widget;
  const colors = COLOR_SCHEMES[appearance_config.color_scheme] || COLOR_SCHEMES.modern;

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-custom-text-300">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const chartData = data.data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <BarChart
      className="h-full w-full"
      data={chartData}
      bars={[
        {
          key: "value",
          label: appearance_config.title || "Value",
          fill: colors[0],
        },
      ]}
      xAxis={{ key: "name" }}
      yAxis={{ key: "value" }}
      showLegend={appearance_config.show_legends}
      showTooltip={appearance_config.show_tooltips}
    />
  );
});

const LineChartWidget: FC<TWidgetProps> = observer(({ widget, data }) => {
  const { appearance_config } = widget;
  const colors = COLOR_SCHEMES[appearance_config.color_scheme] || COLOR_SCHEMES.modern;

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-custom-text-300">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <LineChart
      className="h-full w-full"
      data={data.data}
      lines={[
        {
          key: "value",
          label: appearance_config.title || "Value",
          stroke: colors[0],
        },
      ]}
      xAxis={{ key: "name" }}
      yAxis={{ key: "value" }}
      showLegend={appearance_config.show_legends}
      showTooltip={appearance_config.show_tooltips}
      curve={appearance_config.smooth_curve ? "monotone" : "linear"}
      showDots={appearance_config.show_markers}
    />
  );
});

const AreaChartWidget: FC<TWidgetProps> = observer(({ widget, data }) => {
  const { appearance_config } = widget;
  const colors = COLOR_SCHEMES[appearance_config.color_scheme] || COLOR_SCHEMES.modern;

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-custom-text-300">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <AreaChart
      className="h-full w-full"
      data={data.data}
      areas={[
        {
          key: "value",
          label: appearance_config.title || "Value",
          fill: colors[0],
        },
      ]}
      xAxis={{ key: "name" }}
      yAxis={{ key: "value" }}
      showLegend={appearance_config.show_legends}
      showTooltip={appearance_config.show_tooltips}
      fillOpacity={appearance_config.fill_opacity || 0.6}
    />
  );
});

const PieChartWidget: FC<TWidgetProps> = observer(({ widget, data }) => {
  const { appearance_config } = widget;
  const colors = COLOR_SCHEMES[appearance_config.color_scheme] || COLOR_SCHEMES.modern;

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-custom-text-300">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const chartData = data.data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <PieChart
      className="h-full w-full"
      data={chartData}
      dataKey="value"
      nameKey="name"
      showLegend={appearance_config.show_legends}
      showTooltip={appearance_config.show_tooltips}
      innerRadius={widget.type === "donut" ? "50%" : "0%"}
    />
  );
});

const NumberWidget: FC<TWidgetProps> = observer(({ widget, data }) => {
  const { appearance_config } = widget;

  const value = data?.total || data?.data?.[0]?.value || 0;
  const formatValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6">
      <div className="text-6xl font-bold text-custom-primary mb-2">{formatValue(value)}</div>
      <div className="text-lg text-custom-text-200">{appearance_config.title || "Total"}</div>
      {data?.summary && (
        <div className="mt-4 text-sm text-custom-text-300 space-y-1">
          {data.summary.min !== undefined && <div>Min: {data.summary.min}</div>}
          {data.summary.max !== undefined && <div>Max: {data.summary.max}</div>}
          {data.summary.avg !== undefined && <div>Avg: {data.summary.avg.toFixed(1)}</div>}
        </div>
      )}
    </div>
  );
});

export const WidgetRenderer: FC<TWidgetProps> = observer((props) => {
  const { widget } = props;

  switch (widget.type) {
    case "bar":
      return <BarChartWidget {...props} />;
    case "line":
      return <LineChartWidget {...props} />;
    case "area":
      return <AreaChartWidget {...props} />;
    case "donut":
    case "pie":
      return <PieChartWidget {...props} />;
    case "number":
      return <NumberWidget {...props} />;
    default:
      return (
        <div className="h-full flex items-center justify-center text-custom-text-300">
          <p className="text-sm">Unknown widget type</p>
        </div>
      );
  }
});
