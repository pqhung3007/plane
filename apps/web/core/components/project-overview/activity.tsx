"use client";

import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { Activity, CheckCircle2, UserPlus, FileText, GitBranch, Clock } from "lucide-react";
import { Card, ECardSpacing, ECardVariant } from "@plane/ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

type TActivityType = "issue_created" | "issue_completed" | "member_added" | "cycle_created" | "module_created";

type TActivity = {
  id: string;
  type: TActivityType;
  title: string;
  description: string;
  actor: string;
  createdAt: Date;
};

// Mock data - In production, this would come from an API
const mockActivities: TActivity[] = [
  {
    id: "1",
    type: "issue_completed",
    title: "Issue Completed",
    description: 'marked "Fix login validation bug" as completed',
    actor: "John Doe",
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: "2",
    type: "member_added",
    title: "Member Added",
    description: "added Sarah Johnson to the project",
    actor: "Jane Smith",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "3",
    type: "cycle_created",
    title: "Cycle Created",
    description: 'created a new cycle "Sprint 2"',
    actor: "Mike Wilson",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: "4",
    type: "issue_created",
    title: "Issue Created",
    description: 'created issue "Implement dark mode"',
    actor: "John Doe",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: "5",
    type: "module_created",
    title: "Module Created",
    description: 'created module "Authentication System"',
    actor: "Jane Smith",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
];

const activityConfig: Record<TActivityType, { icon: any; color: string; bgColor: string }> = {
  issue_created: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  issue_completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  member_added: {
    icon: UserPlus,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  cycle_created: {
    icon: GitBranch,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
  },
  module_created: {
    icon: GitBranch,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
};

export const ProjectOverviewActivity = observer((props: Props) => {
  const { workspaceSlug, projectId } = props;
  const [activities, setActivities] = useState<TActivity[]>(mockActivities);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-custom-text-100">
            Activity Feed
          </h2>
          <p className="text-sm text-custom-text-300 mt-1">
            Recent project activities and changes
          </p>
        </div>

        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const ActivityIcon = activityConfig[activity.type].icon;
              const isLast = index === activities.length - 1;

              return (
                <div key={activity.id} className="relative">
                  {!isLast && (
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-custom-border-200" />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${activityConfig[activity.type].bgColor} flex-shrink-0 z-10 relative`}
                    >
                      <ActivityIcon
                        className={`h-4 w-4 ${activityConfig[activity.type].color}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full bg-custom-background-90 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-custom-text-100">
                            {activity.actor[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-custom-text-100">
                            <span className="font-medium">{activity.actor}</span>{" "}
                            <span className="text-custom-text-200">
                              {activity.description}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-custom-text-300 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-custom-border-200 rounded-lg">
            <Activity className="h-12 w-12 text-custom-text-300 mx-auto mb-3" />
            <p className="text-sm text-custom-text-300">
              No recent activity
            </p>
          </div>
        )}
      </div>
    </Card>
  );
});
