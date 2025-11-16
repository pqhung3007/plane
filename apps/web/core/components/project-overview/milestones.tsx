"use client";

import { observer } from "mobx-react";
import { useState } from "react";
import { Plus, Target } from "lucide-react";
// plane imports
import { Button, Card, ECardSpacing, ECardVariant } from "@plane/ui";
// components
import { MilestonesList } from "@/components/milestones";
import { MilestoneCreateUpdateModal } from "@/components/milestones";

type Props = {
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
};

export const ProjectOverviewMilestones = observer((props: Props) => {
  const { workspaceSlug, projectId, hasEditPermission } = props;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <Card variant={ECardVariant.WITH_SHADOW} spacing={ECardSpacing.LG}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-custom-text-100">Milestones</h2>
                <p className="text-sm text-custom-text-300 mt-0.5">
                  Track progress toward strategic objectives and critical deliverables
                </p>
              </div>
            </div>
            {hasEditPermission && (
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Button>
            )}
          </div>

          <MilestonesList
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            hasEditPermission={hasEditPermission}
          />
        </div>
      </Card>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <MilestoneCreateUpdateModal
          isOpen={isCreateModalOpen}
          handleClose={() => setIsCreateModalOpen(false)}
          data={null}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
        />
      )}
    </>
  );
});
