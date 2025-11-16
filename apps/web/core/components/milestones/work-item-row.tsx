"use client";

import React from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Circle, X } from "lucide-react";
import { Menu } from "@headlessui/react";
// plane imports
import type { TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { STATE_GROUPS } from "@plane/constants";
// services
import { MilestoneService } from "@/services/milestone.service";

type Props = {
  issue: TIssue;
  workspaceSlug: string;
  projectId: string;
  milestoneId: string;
  hasEditPermission: boolean;
  onUnlink: () => void;
};

const milestoneService = new MilestoneService();

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "P0", color: "bg-red-500/10 text-red-600" },
  high: { label: "P1", color: "bg-orange-500/10 text-orange-600" },
  medium: { label: "P2", color: "bg-yellow-500/10 text-yellow-600" },
  low: { label: "P3", color: "bg-blue-500/10 text-blue-600" },
  none: { label: "P4", color: "bg-custom-background-90 text-custom-text-300" },
};

export const WorkItemRow: React.FC<Props> = observer((props) => {
  const { issue, workspaceSlug, projectId, milestoneId, hasEditPermission, onUnlink } = props;

  const stateGroup = issue.state_detail?.group || "unstarted";
  const stateColor = STATE_GROUPS[stateGroup]?.color || "#3f76ff";
  const stateName = issue.state_detail?.name || "Todo";

  const priority = issue.priority || "none";
  const priorityInfo = priorityConfig[priority];

  const handleUnlink = async () => {
    if (!confirm("Remove this work item from the milestone?")) return;

    try {
      await milestoneService.removeIssueFromMilestone(workspaceSlug, projectId, milestoneId, issue.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Work item removed from milestone.",
      });
      onUnlink();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to remove work item.",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-custom-background-80 transition-colors">
      {/* Left: Status Icon, ID, Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Circle
          className="h-3 w-3 flex-shrink-0"
          style={{ color: stateColor }}
          fill={stateGroup === "completed" ? stateColor : "none"}
        />
        <span className="text-xs font-medium text-custom-text-300 flex-shrink-0">
          {issue.project_detail?.identifier}-{issue.sequence_id}
        </span>
        <span className="text-sm text-custom-text-100 truncate">{issue.name}</span>
      </div>

      {/* Right: Pills, Avatar, Actions */}
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {/* Status Pill */}
        <span
          className="px-2 py-0.5 text-xs font-medium rounded-md"
          style={{
            backgroundColor: `${stateColor}15`,
            color: stateColor,
          }}
        >
          {stateName}
        </span>

        {/* Priority Pill */}
        {priority && priority !== "none" && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${priorityInfo.color}`}>
            {priorityInfo.label}
          </span>
        )}

        {/* Assignee Avatar */}
        {issue.assignee_ids && issue.assignee_ids.length > 0 && (
          <div className="flex -space-x-1">
            {issue.assignee_ids.slice(0, 2).map((assigneeId, index) => (
              <div
                key={assigneeId}
                className="h-5 w-5 rounded-full bg-custom-background-90 border border-custom-border-200 flex items-center justify-center"
              >
                <span className="text-[10px] font-medium text-custom-text-100">
                  {assigneeId[0]?.toUpperCase()}
                </span>
              </div>
            ))}
            {issue.assignee_ids.length > 2 && (
              <div className="h-5 w-5 rounded-full bg-custom-background-90 border border-custom-border-200 flex items-center justify-center">
                <span className="text-[10px] font-medium text-custom-text-300">
                  +{issue.assignee_ids.length - 2}
                </span>
              </div>
            )}
          </div>
        )}

        {/* More Options */}
        {hasEditPermission && (
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 hover:bg-custom-background-90 rounded">
              <MoreHorizontal className="h-3.5 w-3.5 text-custom-text-300" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-custom-background-100 shadow-lg border border-custom-border-200 z-10">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleUnlink}
                      className={`${
                        active ? "bg-red-500/10" : ""
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-500`}
                    >
                      <X className="mr-2 h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        )}
      </div>
    </div>
  );
});
