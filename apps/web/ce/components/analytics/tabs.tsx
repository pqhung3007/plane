import type { AnalyticsTab } from "@plane/types";
import { Overview } from "@/components/analytics/overview";
import { WorkItems } from "@/components/analytics/work-items";
import { Modules } from "@/components/analytics/modules";

export const getAnalyticsTabs = (t: (key: string, params?: Record<string, any>) => string): AnalyticsTab[] => [
  { key: "overview", label: t("common.overview"), content: Overview, isDisabled: false },
  { key: "work-items", label: t("sidebar.work_items"), content: WorkItems, isDisabled: false },
  { key: "modules", label: t("sidebar.modules"), content: Modules, isDisabled: false },
];
