"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { Button } from "@plane/ui";
import type { IMilestone } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// services
import { MilestoneService } from "@/services/milestone.service";
// components
import { MilestoneCard } from "./milestone-card";
import { MilestoneCreateUpdateModal } from "./modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

const milestoneService = new MilestoneService();

export const MilestonesList: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, hasEditPermission } = props;
  const [milestones, setMilestones] = useState<IMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<IMilestone | null>(null);
  const [isLinkWorkItemsModalOpen, setIsLinkWorkItemsModalOpen] = useState(false);

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
      const data = await milestoneService.getMilestones(workspaceSlug, projectId);
      setMilestones(data);
    } catch (error) {
      console.error("Failed to fetch milestones:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to fetch milestones.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [workspaceSlug, projectId]);

  const handleCreateSuccess = () => {
    fetchMilestones();
    setIsCreateModalOpen(false);
    setSelectedMilestone(null);
  };

  const handleEditMilestone = (milestone: IMilestone) => {
    setSelectedMilestone(milestone);
    setIsCreateModalOpen(true);
  };

  const handleLinkWorkItems = (milestone: IMilestone) => {
    setSelectedMilestone(milestone);
    setIsLinkWorkItemsModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchMilestones();
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedMilestone(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse border border-custom-border-200 rounded-lg p-4">
            <div className="h-6 bg-custom-background-90 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-custom-background-90 rounded w-2/3 mb-4"></div>
            <div className="h-2 bg-custom-background-90 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {milestones.length > 0 ? (
          milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              onEdit={handleEditMilestone}
              onDelete={handleDeleteSuccess}
              onLinkWorkItems={handleLinkWorkItems}
            />
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-custom-border-200 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-custom-background-90 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-custom-text-300" />
              </div>
              <p className="text-sm font-medium text-custom-text-100 mb-1">No milestones yet</p>
              <p className="text-sm text-custom-text-300 mb-4">
                Create a milestone to track progress toward your goals
              </p>
              {hasEditPermission && (
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Create Milestone</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Update Modal */}
      {isCreateModalOpen && (
        <MilestoneCreateUpdateModal
          isOpen={isCreateModalOpen}
          handleClose={handleCloseModal}
          data={selectedMilestone}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
});
