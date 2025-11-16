"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Circle, Check } from "lucide-react";
// plane imports
import { EModalPosition, EModalWidth, ModalCore, Button, Input } from "@plane/ui";
import type { IMilestone, TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { STATE_GROUPS } from "@plane/constants";
// services
import { MilestoneService } from "@/services/milestone.service";
import { IssueService } from "@/services/issue";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  milestone: IMilestone;
  workspaceSlug: string;
  projectId: string;
  onSuccess: () => void;
};

const milestoneService = new MilestoneService();
const issueService = new IssueService();

export const LinkWorkItemsModal: React.FC<Props> = (props) => {
  const { isOpen, handleClose, milestone, workspaceSlug, projectId, onSuccess } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [availableIssues, setAvailableIssues] = useState<TIssue[]>([]);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableIssues();
    }
  }, [isOpen, workspaceSlug, projectId]);

  const fetchAvailableIssues = async () => {
    try {
      setIsLoading(true);
      // Fetch project issues that are not already linked to this milestone
      // This is a mock implementation - in production, you'd filter out already linked issues
      const response = await issueService.getIssues(workspaceSlug, projectId);
      setAvailableIssues(response?.results || []);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      setAvailableIssues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIssues = availableIssues.filter((issue) =>
    issue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${issue.project_detail?.identifier}-${issue.sequence_id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleIssueSelection = (issueId: string) => {
    const newSelection = new Set(selectedIssueIds);
    if (newSelection.has(issueId)) {
      newSelection.delete(issueId);
    } else {
      newSelection.add(issueId);
    }
    setSelectedIssueIds(newSelection);
  };

  const handleLinkIssues = async () => {
    if (selectedIssueIds.size === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one work item.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await milestoneService.addIssuesToMilestone(workspaceSlug, projectId, milestone.id, {
        issues: Array.from(selectedIssueIds),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `${selectedIssueIds.size} work item(s) linked to milestone.`,
      });
      onSuccess();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to link work items.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-custom-border-200">
          <div>
            <h3 className="text-xl font-semibold text-custom-text-100">Link Work Items</h3>
            <p className="text-sm text-custom-text-300 mt-1">
              Select work items to link to "{milestone.name}"
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-custom-text-300 hover:text-custom-text-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-custom-border-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-custom-text-300" />
            <Input
              type="text"
              placeholder="Search work items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-custom-background-90 rounded"></div>
              ))}
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="space-y-1">
              {filteredIssues.map((issue) => {
                const isSelected = selectedIssueIds.has(issue.id);
                const stateGroup = issue.state_detail?.group || "unstarted";
                const stateColor = STATE_GROUPS[stateGroup]?.color || "#3f76ff";

                return (
                  <button
                    key={issue.id}
                    onClick={() => toggleIssueSelection(issue.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-custom-primary-100 bg-custom-primary-100/5"
                        : "border-custom-border-200 hover:border-custom-border-300 hover:bg-custom-background-90"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-custom-primary-100 border-custom-primary-100"
                          : "border-custom-border-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Status Icon */}
                    <Circle
                      className="h-3 w-3 flex-shrink-0"
                      style={{ color: stateColor }}
                      fill={stateGroup === "completed" ? stateColor : "none"}
                    />

                    {/* Issue ID */}
                    <span className="text-xs font-medium text-custom-text-300 flex-shrink-0">
                      {issue.project_detail?.identifier}-{issue.sequence_id}
                    </span>

                    {/* Issue Title */}
                    <span className="text-sm text-custom-text-100 truncate flex-1 text-left">
                      {issue.name}
                    </span>

                    {/* State */}
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-md flex-shrink-0"
                      style={{
                        backgroundColor: `${stateColor}15`,
                        color: stateColor,
                      }}
                    >
                      {issue.state_detail?.name || "Todo"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-custom-text-300">
                {searchQuery ? "No work items found matching your search." : "No work items available to link."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-custom-border-200">
          <p className="text-sm text-custom-text-300">
            {selectedIssueIds.size > 0 && `${selectedIssueIds.size} work item(s) selected`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleLinkIssues}
              loading={isSubmitting}
              disabled={selectedIssueIds.size === 0 || isSubmitting}
            >
              Link {selectedIssueIds.size > 0 ? `(${selectedIssueIds.size})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
};
