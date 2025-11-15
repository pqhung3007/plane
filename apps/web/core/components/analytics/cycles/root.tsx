import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import CycleCompletionChart from "./cycle-completion-chart";
import CyclesInsightTable from "./cycles-insight-table";

const Cycles: React.FC = () => (
  <AnalyticsWrapper i18nTitle="common.cycles">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="cycles" />
      <CycleCompletionChart />
      <CyclesInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Cycles };
