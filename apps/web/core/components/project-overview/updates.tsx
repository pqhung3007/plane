"use client";

import { observer } from "mobx-react";
import { useState } from "react";
import { Plus, MessageSquare, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button, Card, ECardSpacing, ECardVariant } from "@plane/ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

type TUpdateStatus = "on-track" | "at-risk" | "off-track" | "info";

type TUpdate = {
  id: string;
  status: TUpdateStatus;
  title: string;
  description: string;
  author: string;
  createdAt: Date;
};

// Mock data - In production, this would come from an API
const mockUpdates: TUpdate[] = [
  {
    id: "1",
    status: "on-track",
    title: "Sprint 1 Completed Successfully",
    description: "All planned features for Sprint 1 have been completed and deployed to staging environment.",
    author: "John Doe",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    id: "2",
    status: "at-risk",
    title: "Backend API Performance Issues",
    description: "We've identified some performance bottlenecks in the API. The team is working on optimizations.",
    author: "Jane Smith",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
];

const statusConfig: Record<TUpdateStatus, { icon: any; color: string; bgColor: string; label: string }> = {
  "on-track": {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    label: "On Track",
  },
  "at-risk": {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    label: "At Risk",
  },
  "off-track": {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    label: "Off Track",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    label: "Info",
  },
};

export const ProjectOverviewUpdates = observer((props: Props) => {
  const { workspaceSlug, projectId, hasEditPermission } = props;
  const [updates, setUpdates] = useState<TUpdate[]>(mockUpdates);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-custom-text-100">
              Project Updates
            </h2>
            <p className="text-sm text-custom-text-300 mt-1">
              Share progress updates with your team
            </p>
          </div>
          {hasEditPermission && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingUpdate(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Post Update</span>
            </Button>
          )}
        </div>

        {updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update) => {
              const StatusIcon = statusConfig[update.status].icon;
              return (
                <div
                  key={update.id}
                  className="border border-custom-border-200 rounded-lg p-4 hover:bg-custom-background-90 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${statusConfig[update.status].bgColor} flex-shrink-0`}
                    >
                      <StatusIcon
                        className={`h-5 w-5 ${statusConfig[update.status].color}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${statusConfig[update.status].bgColor} ${statusConfig[update.status].color}`}
                        >
                          {statusConfig[update.status].label}
                        </span>
                        <span className="text-xs text-custom-text-300">
                          {formatRelativeTime(update.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-custom-text-100 mb-1">
                        {update.title}
                      </h3>
                      <p className="text-sm text-custom-text-200 mb-2">
                        {update.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-custom-background-90 flex items-center justify-center">
                          <span className="text-xs font-medium text-custom-text-100">
                            {update.author[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-custom-text-300">
                          {update.author}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-custom-border-200 rounded-lg">
            <MessageSquare className="h-12 w-12 text-custom-text-300 mx-auto mb-3" />
            <p className="text-sm text-custom-text-300 mb-4">
              No updates yet
            </p>
            {hasEditPermission && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingUpdate(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Post First Update</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});
