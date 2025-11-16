"use client";

import React from "react";
import { Trash2, X } from "lucide-react";
// plane imports
import { Button } from "@plane/ui";
import type { IMilestone } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// services
import { MilestoneService } from "@/services/milestone.service";

type Props = {
  selectedMilestones: Set<string>;
  milestones: IMilestone[];
  workspaceSlug: string;
  projectId: string;
  onClearSelection: () => void;
  onSuccess: () => void;
};

const milestoneService = new MilestoneService();

export const MilestoneBulkActions: React.FC<Props> = (props) => {
  const { selectedMilestones, milestones, workspaceSlug, projectId, onClearSelection, onSuccess } = props;
  const [isDeleting, setIsDeleting] = React.useState(false);

  const selectedCount = selectedMilestones.size;

  if (selectedCount === 0) return null;

  const handleBulkDelete = async () => {
    const selectedNames = milestones
      .filter((m) => selectedMilestones.has(m.id))
      .map((m) => m.name)
      .join(", ");

    if (!confirm(`Are you sure you want to delete ${selectedCount} milestone(s)?\n\n${selectedNames}`)) {
      return;
    }

    try {
      setIsDeleting(true);
      // Delete all selected milestones
      await Promise.all(
        Array.from(selectedMilestones).map((milestoneId) =>
          milestoneService.deleteMilestone(workspaceSlug, projectId, milestoneId)
        )
      );

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `${selectedCount} milestone(s) deleted successfully.`,
      });
      onClearSelection();
      onSuccess();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete some milestones.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-custom-background-100 border border-custom-border-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-custom-text-100">
            {selectedCount} selected
          </span>
        </div>

        <div className="h-4 w-px bg-custom-border-200" />

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={handleBulkDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>

          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-custom-background-90 rounded text-custom-text-300 hover:text-custom-text-100"
            disabled={isDeleting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
