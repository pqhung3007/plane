"use client";

import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { Button, Card, ECardSpacing, ECardVariant } from "@plane/ui";
import type { IMilestone } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// services
import { MilestoneService } from "@/services/milestone.service";
// components
import { MilestoneCard } from "@/components/milestones";
import { MilestoneCreateUpdateModal } from "@/components/milestones";

type Props = {
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

const milestoneService = new MilestoneService();

export const ProjectOverviewMilestones = observer((props: Props) => {
  const { workspaceSlug, projectId, hasEditPermission } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [milestones, setMilestones] = useState<IMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<IMilestone | null>(null);

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

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedMilestone(null);
  };

  return (
    <>
      <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <Disclosure.Button className="flex items-center gap-2 hover:bg-custom-background-90 rounded px-2 py-1 -ml-2">
                  {open ? (
                    <ChevronDown className="h-4 w-4 text-custom-text-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-custom-text-300" />
                  )}
                  <h2 className="text-lg font-semibold text-custom-text-100">Milestones</h2>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-custom-background-90 text-custom-text-300">
                    {milestones.length}
                  </span>
                </Disclosure.Button>
                {hasEditPermission && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="p-1.5 hover:bg-custom-background-90 rounded text-custom-text-300 hover:text-custom-text-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <Disclosure.Panel className="mt-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse border border-custom-border-200 rounded-lg p-4">
                        <div className="h-6 bg-custom-background-90 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-custom-background-90 rounded w-2/3 mb-4"></div>
                        <div className="h-2 bg-custom-background-90 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : milestones.length > 0 ? (
                  <div className="space-y-4">
                    {milestones.map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        hasEditPermission={hasEditPermission}
                        onEdit={handleEditMilestone}
                        onDelete={fetchMilestones}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-custom-border-200 rounded-lg">
                    <p className="text-sm text-custom-text-300">No milestones yet</p>
                    {hasEditPermission && (
                      <Button
                        variant="neutral-primary"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-3"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Milestone</span>
                      </Button>
                    )}
                  </div>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </Card>

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
