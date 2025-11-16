"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Calendar, AlertCircle, CheckCircle2, Edit, Trash2, Plus } from "lucide-react";
// plane imports
import { LinearProgressIndicator } from "@plane/ui";
import { Disclosure, Menu } from "@headlessui/react";
import type { IMilestone } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// services
import { MilestoneService } from "@/services/milestone.service";

type Props = {
  milestone: IMilestone;
  workspaceSlug: string;
  projectId: string;
  onEdit: (milestone: IMilestone) => void;
  onDelete: () => void;
  onLinkWorkItems: (milestone: IMilestone) => void;
};

const milestoneService = new MilestoneService();

export const MilestoneCard: React.FC<Props> = observer((props) => {
  const { milestone, workspaceSlug, projectId, onEdit, onDelete, onLinkWorkItems } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  const totalIssues = milestone.total_issues || 0;
  const completedIssues = milestone.completed_issues || 0;
  const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  // Calculate status based on target date
  const getStatus = () => {
    if (!milestone.target_date) return "upcoming";
    const targetDate = new Date(milestone.target_date);
    const now = new Date();
    const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (progressPercentage === 100) return "completed";
    if (now > targetDate && progressPercentage < 100) return "missed";
    if (daysUntilTarget <= 7 && progressPercentage < 100) return "at-risk";
    return "active";
  };

  const status = getStatus();

  const statusConfig: Record<
    string,
    { icon: any; color: string; bgColor: string; label: string; textColor: string }
  > = {
    upcoming: {
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
      label: "Upcoming",
    },
    active: {
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-600",
      label: "Active",
    },
    "at-risk": {
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-600",
      label: "At Risk",
    },
    missed: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      textColor: "text-red-600",
      label: "Missed",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      textColor: "text-green-600",
      label: "Completed",
    },
  };

  const StatusIcon = statusConfig[status].icon;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = () => {
    if (!milestone.target_date) return null;
    const targetDate = new Date(milestone.target_date);
    const now = new Date();
    const daysUntil = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    return `${daysUntil} days remaining`;
  };

  const progressData = [
    {
      id: "completed",
      name: "Completed",
      value: milestone.completed_issues || 0,
      color: "#16A34A",
    },
    {
      id: "started",
      name: "Started",
      value: milestone.started_issues || 0,
      color: "#F59E0B",
    },
    {
      id: "unstarted",
      name: "Unstarted",
      value: milestone.unstarted_issues || 0,
      color: "#3A3A3A",
    },
    {
      id: "backlog",
      name: "Backlog",
      value: milestone.backlog_issues || 0,
      color: "#A3A3A3",
    },
  ];

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;

    try {
      await milestoneService.deleteMilestone(workspaceSlug, projectId, milestone.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Milestone deleted successfully.",
      });
      onDelete();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete milestone. Please try again.",
      });
    }
  };

  return (
    <div className="border border-custom-border-200 rounded-lg overflow-hidden hover:border-custom-border-300 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-custom-text-100">{milestone.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${statusConfig[status].bgColor} ${statusConfig[status].textColor}`}>
                {statusConfig[status].label}
              </span>
            </div>
            {milestone.description && (
              <p className="text-sm text-custom-text-300 line-clamp-2 mb-2">{milestone.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-custom-text-300">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(milestone.target_date)}</span>
              </div>
              {getDaysRemaining() && (
                <div className="flex items-center gap-1">
                  <StatusIcon className={`h-3 w-3 ${statusConfig[status].color}`} />
                  <span>{getDaysRemaining()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 hover:bg-custom-background-90 rounded">
              <MoreHorizontal className="h-4 w-4 text-custom-text-300" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-custom-border-200 rounded-md bg-custom-background-100 shadow-lg border border-custom-border-200 z-10">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onEdit(milestone)}
                      className={`${
                        active ? "bg-custom-background-90" : ""
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-custom-text-100`}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onLinkWorkItems(milestone)}
                      className={`${
                        active ? "bg-custom-background-90" : ""
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-custom-text-100`}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Link work items
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDelete}
                      className={`${
                        active ? "bg-red-500/10" : ""
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-500`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-custom-text-300">Progress</span>
            <span className="font-medium text-custom-text-100">
              {completedIssues} / {totalIssues} issues
            </span>
          </div>
          {totalIssues > 0 && (
            <LinearProgressIndicator data={progressData} size="md" inPercentage={false} />
          )}
        </div>
      </div>
    </div>
  );
});
