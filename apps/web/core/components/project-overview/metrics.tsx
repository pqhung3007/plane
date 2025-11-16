"use client";

import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { CircularProgressIndicator, Card, ECardSpacing, ECardVariant } from "@plane/ui";
import type { TProjectAnalyticsCount } from "@plane/types";
// services
import { ProjectService } from "@/services/project";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const projectService = new ProjectService();

export const ProjectOverviewMetrics = observer((props: Props) => {
  const { workspaceSlug, projectId } = props;
  const [analytics, setAnalytics] = useState<TProjectAnalyticsCount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await projectService.getProjectAnalyticsCount(workspaceSlug, {
          project_ids: projectId,
          fields: "total_issues,completed_issues,total_cycles,total_modules,total_members",
        });

        if (response && response.length > 0) {
          setAnalytics(response[0]);
        }
      } catch (error) {
        console.error("Failed to fetch project analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [workspaceSlug, projectId]);

  if (isLoading) {
    return (
      <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-custom-background-90 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-custom-background-90 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const totalIssues = analytics?.total_issues || 0;
  const completedIssues = analytics?.completed_issues || 0;
  const completionPercentage = totalIssues > 0
    ? Math.round((completedIssues / totalIssues) * 100)
    : 0;

  const metrics = [
    {
      label: "Total Issues",
      value: totalIssues,
      color: "#3A3A3A",
    },
    {
      label: "Completed",
      value: completedIssues,
      color: "#16A34A",
      percentage: completionPercentage,
    },
    {
      label: "Cycles",
      value: analytics?.total_cycles || 0,
      color: "#3B82F6",
    },
    {
      label: "Modules",
      value: analytics?.total_modules || 0,
      color: "#8B5CF6",
    },
  ];

  return (
    <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-custom-text-100">
          Project Metrics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-custom-background-90 border border-custom-border-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs text-custom-text-300 mb-1">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-semibold text-custom-text-100">
                    {metric.value}
                  </p>
                </div>
                {metric.percentage !== undefined && (
                  <CircularProgressIndicator
                    size={40}
                    percentage={metric.percentage}
                    strokeWidth={3}
                  >
                    <span className="text-xs font-medium">
                      {metric.percentage}%
                    </span>
                  </CircularProgressIndicator>
                )}
              </div>
              {metric.percentage !== undefined && (
                <div className="mt-2">
                  <div className="h-1.5 bg-custom-background-80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${metric.percentage}%`,
                        backgroundColor: metric.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
});
