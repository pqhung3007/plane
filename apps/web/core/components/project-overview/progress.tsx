"use client";

import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { LinearProgressIndicator, Card, ECardSpacing, ECardVariant } from "@plane/ui";
import { PROGRESS_STATE_GROUPS_DETAILS } from "@plane/constants";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { EIssuesStoreType } from "@/plane-web/types/issue";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

type TProgressData = {
  id: string;
  value: number;
  color: string;
  name: string;
};

export const ProjectOverviewProgress = observer((props: Props) => {
  const { workspaceSlug, projectId } = props;
  const [progressData, setProgressData] = useState<TProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // store hooks
  const { issueMap } = useIssues(EIssuesStoreType.PROJECT);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);

        // Get all issues and count by state group
        const issues = Object.values(issueMap || {});

        // Initialize counts
        const counts = {
          backlog_issues: 0,
          unstarted_issues: 0,
          started_issues: 0,
          completed_issues: 0,
        };

        // Count issues by state group
        issues.forEach((issue) => {
          if (issue.project_id === projectId) {
            const stateGroup = issue.state_detail?.group;
            if (stateGroup === "backlog") counts.backlog_issues++;
            else if (stateGroup === "unstarted") counts.unstarted_issues++;
            else if (stateGroup === "started") counts.started_issues++;
            else if (stateGroup === "completed") counts.completed_issues++;
          }
        });

        // Create progress data
        const data: TProgressData[] = PROGRESS_STATE_GROUPS_DETAILS.map((group) => ({
          id: group.key,
          name: group.title,
          color: group.color,
          value: counts[group.key as keyof typeof counts] || 0,
        }));

        setProgressData(data);
      } catch (error) {
        console.error("Failed to fetch project progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [projectId, issueMap]);

  if (isLoading) {
    return (
      <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-custom-background-90 rounded w-1/4"></div>
          <div className="h-8 bg-custom-background-90 rounded"></div>
        </div>
      </Card>
    );
  }

  const totalIssues = progressData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-custom-text-100">
            Project Progress
          </h2>
          <p className="text-sm text-custom-text-300 mt-1">
            Track progress across all tasks
          </p>
        </div>

        {totalIssues > 0 ? (
          <>
            {/* Linear Progress Indicator */}
            <div className="space-y-3">
              <LinearProgressIndicator
                data={progressData}
                size="lg"
                inPercentage={false}
              />

              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {progressData.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-custom-text-300 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm font-medium text-custom-text-100">
                        {item.value} {item.value === 1 ? "issue" : "issues"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="pt-4 border-t border-custom-border-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-custom-text-300 mb-1">
                    Total Issues
                  </p>
                  <p className="text-xl font-semibold text-custom-text-100">
                    {totalIssues}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-custom-text-300 mb-1">
                    Completed
                  </p>
                  <p className="text-xl font-semibold text-green-600">
                    {progressData.find((d) => d.id === "completed_issues")?.value || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-custom-text-300 mb-1">
                    In Progress
                  </p>
                  <p className="text-xl font-semibold text-orange-500">
                    {progressData.find((d) => d.id === "started_issues")?.value || 0}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-custom-text-300">
              No issues found in this project
            </p>
          </div>
        )}
      </div>
    </Card>
  );
});
