import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import UserWorkItemsChart from "./user-workitems-chart";
import UserAnalyticsTable from "./user-analytics-table";

const UserAnalytics: React.FC = () => (
  <AnalyticsWrapper i18nTitle="User Analytics">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="user-analytics" />
      <UserWorkItemsChart />
      <UserAnalyticsTable />
    </div>
  </AnalyticsWrapper>
);

export { UserAnalytics };
