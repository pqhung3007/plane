"use client";

import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Button, Card, ECardSpacing, ECardVariant } from "@plane/ui";
import type { IProjectUpdate } from "@plane/types";
import { ProjectUpdateService } from "@/services/project";
import { CreateUpdateModal, UpdateCard } from "@/components/project-updates";

type Props = {
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

export const ProjectOverviewUpdates = observer((props: Props) => {
  const { workspaceSlug, projectId, hasEditPermission } = props;

  const [updates, setUpdates] = useState<IProjectUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const service = new ProjectUpdateService();

  const loadUpdates = async () => {
    setIsLoading(true);
    try {
      const fetchedUpdates = await service.getProjectUpdates(workspaceSlug, projectId);
      // Sort by created_at descending (newest first)
      setUpdates(fetchedUpdates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error("Failed to load updates:", error);
      setUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, [workspaceSlug, projectId]);

  const handleUpdateSuccess = () => {
    loadUpdates();
  };

  const handleUpdateDelete = () => {
    loadUpdates();
  };

  return (
    <>
      <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-custom-text-100">Project Updates</h2>
              <p className="text-sm text-custom-text-300 mt-1">Share progress updates with your team</p>
            </div>
            {hasEditPermission && (
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                <span>Post Update</span>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-sm text-custom-text-400">Loading updates...</p>
            </div>
          ) : updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((update) => (
                <UpdateCard
                  key={update.id}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  update={update}
                  hasEditPermission={hasEditPermission}
                  onDelete={handleUpdateDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-custom-border-200 rounded-lg">
              <MessageSquare className="h-12 w-12 text-custom-text-300 mx-auto mb-3" />
              <p className="text-sm text-custom-text-300 mb-4">No updates yet</p>
              {hasEditPermission && (
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Post First Update</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <CreateUpdateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
});
