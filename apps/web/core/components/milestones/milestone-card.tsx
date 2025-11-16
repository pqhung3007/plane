"use client";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal, Calendar, CheckCircle2, AlertCircle, Edit, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Disclosure, Menu } from "@headlessui/react";
// plane imports
import type { IMilestone, TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Card, ECardSpacing, ECardVariant } from "@plane/ui";
// services
import { MilestoneService } from "@/services/milestone.service";
// components
import { WorkItemRow } from "./work-item-row";
import { LinkWorkItemsModal } from "./link-work-items-modal";

type Props = {
  milestone: IMilestone;
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
  onEdit: (milestone: IMilestone) => void;
  onDelete: () => void;
};

const milestoneService = new MilestoneService();

export const MilestoneCard: React.FC<Props> = observer((props) => {
  const { milestone, workspaceSlug, projectId, hasEditPermission, onEdit, onDelete } = props;
  const [linkedIssues, setLinkedIssues] = useState<TIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

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

  const statusConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    upcoming: {
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      label: "Upcoming",
    },
    active: {
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      label: "Active",
    },
    "at-risk": {
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
      label: "At Risk",
    },
    missed: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      label: "Missed",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      label: "Completed",
    },
  };

  const StatusIcon = statusConfig[status].icon;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchLinkedIssues = async () => {
    try {
      setIsLoadingIssues(true);
      const response = await milestoneService.getMilestoneIssues(workspaceSlug, projectId, milestone.id);
      // Mock data for now since API might not be ready
      setLinkedIssues([]);
    } catch (error) {
      console.error("Failed to fetch linked issues:", error);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  useEffect(() => {
    if (totalIssues > 0) {
      fetchLinkedIssues();
    }
  }, [milestone.id, totalIssues]);

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

  const handleLinkSuccess = () => {
    fetchLinkedIssues();
    setIsLinkModalOpen(false);
  };

  return (
    <>
      <Card variant={ECardVariant.FLAT} spacing={ECardSpacing.MD} className="border border-custom-border-200">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <StatusIcon className={`h-4 w-4 ${statusConfig[status].color}`} />
            <h3 className="text-base font-semibold text-custom-text-100">{milestone.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-custom-background-90 text-custom-text-300">
              {formatDate(milestone.target_date)}
            </span>
            {hasEditPermission && (
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
            )}
          </div>
        </div>

        {/* Description */}
        {milestone.description && (
          <p className="text-sm text-custom-text-300 mb-4">{milestone.description}</p>
        )}

        {/* Linked Work Items Panel */}
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <div className="border border-custom-border-200 rounded-lg bg-custom-background-90">
              {/* Linked Work Items Header */}
              <div className="flex items-center justify-between p-3">
                <Disclosure.Button className="flex items-center gap-2 hover:bg-custom-background-80 rounded px-2 py-1 -ml-2">
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5 text-custom-text-300" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-custom-text-300" />
                  )}
                  <span className="text-sm font-medium text-custom-text-200">Linked Work items</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      progressPercentage === 100
                        ? "bg-green-500/10 text-green-600"
                        : "bg-custom-background-80 text-custom-text-300"
                    }`}
                  >
                    {progressPercentage}%
                  </span>
                </Disclosure.Button>
                {hasEditPermission && (
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="p-1 hover:bg-custom-background-80 rounded text-custom-text-300 hover:text-custom-text-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Linked Work Items List */}
              <Disclosure.Panel>
                {isLoadingIssues ? (
                  <div className="p-3 space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse h-10 bg-custom-background-80 rounded"></div>
                    ))}
                  </div>
                ) : linkedIssues.length > 0 ? (
                  <div className="divide-y divide-custom-border-200">
                    {linkedIssues.map((issue) => (
                      <WorkItemRow
                        key={issue.id}
                        issue={issue}
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        milestoneId={milestone.id}
                        hasEditPermission={hasEditPermission}
                        onUnlink={fetchLinkedIssues}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-custom-text-300">No linked work items yet</p>
                    {hasEditPermission && (
                      <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="mt-2 text-xs text-custom-primary-100 hover:text-custom-primary-200"
                      >
                        Link work items
                      </button>
                    )}
                  </div>
                )}
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      </Card>

      {/* Link Work Items Modal */}
      {isLinkModalOpen && (
        <LinkWorkItemsModal
          isOpen={isLinkModalOpen}
          handleClose={() => setIsLinkModalOpen(false)}
          milestone={milestone}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onSuccess={handleLinkSuccess}
        />
      )}
    </>
  );
});
