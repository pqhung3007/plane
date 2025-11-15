import React from "react";
import AnalyticsWrapper from "../analytics-wrapper";
import TotalInsights from "../total-insights";
import ProjectsStatusChart from "./projects-status-chart";
import ProjectsInsightTable from "./projects-insight-table";

const Projects: React.FC = () => (
  <AnalyticsWrapper i18nTitle="common.projects">
    <div className="flex flex-col gap-14">
      <TotalInsights analyticsType="projects" />
      <ProjectsStatusChart />
      <ProjectsInsightTable />
    </div>
  </AnalyticsWrapper>
);

export { Projects };
