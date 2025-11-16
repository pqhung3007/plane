import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import CycleCompletionChart from "./cycle-completion-chart";
import ModulesCyclesTable from "./cycles-table";

const Modules: React.FC = () => (
  <AnalyticsWrapper i18nTitle="sidebar.modules">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="modules" />
      <CycleCompletionChart />
      <ModulesCyclesTable />
    </div>
  </AnalyticsWrapper>
);

export { Modules };
