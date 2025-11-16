"use client";

import { observer } from "mobx-react";
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { Button, Card, ECardSpacing, ECardVariant } from "@plane/ui";
import type { IMilestone, TMilestoneStatus } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// services
import { MilestoneService } from "@/services/milestone.service";
// components
import { MilestoneCard, MilestoneFilters, MilestoneBulkActions } from "@/components/milestones";
import { MilestoneCreateUpdateModal } from "@/components/milestones";

type Props = {
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

type TSortOption = "target_date_asc" | "target_date_desc" | "name_asc" | "name_desc" | "created_desc";

const milestoneService = new MilestoneService();

export const ProjectOverviewMilestones = observer((props: Props) => {
  const { workspaceSlug, projectId, hasEditPermission } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [milestones, setMilestones] = useState<IMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<IMilestone | null>(null);

  // Filter and sort state
  const [selectedStatuses, setSelectedStatuses] = useState<TMilestoneStatus[]>([]);
  const [sortBy, setSortBy] = useState<TSortOption>("target_date_asc");

  // Bulk selection state
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<Set<string>>(new Set());

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

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSortBy("target_date_asc");
  };

  const handleClearSelection = () => {
    setSelectedMilestoneIds(new Set());
  };

  const handleToggleSelection = (milestoneId: string) => {
    const newSelection = new Set(selectedMilestoneIds);
    if (newSelection.has(milestoneId)) {
      newSelection.delete(milestoneId);
    } else {
      newSelection.add(milestoneId);
    }
    setSelectedMilestoneIds(newSelection);
  };

  const handleBulkSuccess = () => {
    handleClearSelection();
    fetchMilestones();
  };

  // Calculate milestone status
  const getMilestoneStatus = (milestone: IMilestone): TMilestoneStatus => {
    if (!milestone.target_date) return "upcoming";
    const targetDate = new Date(milestone.target_date);
    const now = new Date();
    const totalIssues = milestone.total_issues || 0;
    const completedIssues = milestone.completed_issues || 0;
    const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    if (progressPercentage === 100) return "completed";
    if (now > targetDate && progressPercentage < 100) return "missed";
    return "active";
  };

  // Filter and sort milestones
  const filteredAndSortedMilestones = useMemo(() => {
    let result = [...milestones];

    // Apply status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((milestone) => {
        const status = getMilestoneStatus(milestone);
        return selectedStatuses.includes(status);
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "target_date_asc":
          if (!a.target_date) return 1;
          if (!b.target_date) return -1;
          return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
        case "target_date_desc":
          if (!a.target_date) return 1;
          if (!b.target_date) return -1;
          return new Date(b.target_date).getTime() - new Date(a.target_date).getTime();
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "created_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [milestones, selectedStatuses, sortBy]);

  const hasActiveFilters = selectedStatuses.length > 0 || sortBy !== "target_date_asc";

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
              <Disclosure.Panel className="mt-4 space-y-4">
                {/* Filters */}
                {milestones.length > 0 && (
                  <MilestoneFilters
                    selectedStatuses={selectedStatuses}
                    onStatusChange={setSelectedStatuses}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onClearFilters={handleClearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                )}

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
                ) : filteredAndSortedMilestones.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAndSortedMilestones.map((milestone) => (
                      <div key={milestone.id} className="relative">
                        {hasEditPermission && (
                          <div className="absolute left-3 top-3 z-10">
                            <input
                              type="checkbox"
                              checked={selectedMilestoneIds.has(milestone.id)}
                              onChange={() => handleToggleSelection(milestone.id)}
                              className="h-4 w-4 rounded border-custom-border-300 text-custom-primary-100 focus:ring-custom-primary-100"
                            />
                          </div>
                        )}
                        <MilestoneCard
                          milestone={milestone}
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          hasEditPermission={hasEditPermission}
                          onEdit={handleEditMilestone}
                          onDelete={fetchMilestones}
                        />
                      </div>
                    ))}
                  </div>
                ) : milestones.length > 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-custom-border-200 rounded-lg">
                    <p className="text-sm text-custom-text-300">No milestones match your filters</p>
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      onClick={handleClearFilters}
                      className="mt-3"
                    >
                      Clear filters
                    </Button>
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

      {/* Bulk Actions */}
      {hasEditPermission && (
        <MilestoneBulkActions
          selectedMilestones={selectedMilestoneIds}
          milestones={milestones}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          onClearSelection={handleClearSelection}
          onSuccess={handleBulkSuccess}
        />
      )}
    </>
  );
});
