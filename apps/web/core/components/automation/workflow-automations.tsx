"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Settings2, Play, Pause, Trash2, Activity } from "lucide-react";
import useSWR, { mutate } from "swr";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { ToggleSwitch } from "@plane/ui";
import type { TProjectAutomation } from "@plane/types";
// services
import { AutomationService } from "@/services/project/automation.service";
// components
import { WorkflowAutomationModal } from "./workflow-automation-modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  canPerformAdminActions: boolean;
};

const automationService = new AutomationService();

export const WorkflowAutomations = observer(({ workspaceSlug, projectId, canPerformAdminActions }: Props) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<TProjectAutomation | null>(null);

  // Fetch automations
  const { data: automations, isLoading } = useSWR(
    workspaceSlug && projectId ? `AUTOMATIONS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => automationService.getProjectAutomations(workspaceSlug, projectId)
      : null
  );

  const handleCreateAutomation = () => {
    setSelectedAutomation(null);
    setIsModalOpen(true);
  };

  const handleEditAutomation = (automation: TProjectAutomation) => {
    setSelectedAutomation(automation);
    setIsModalOpen(true);
  };

  const handleToggleAutomation = async (automation: TProjectAutomation) => {
    if (!workspaceSlug || !projectId) return;

    try {
      await automationService.toggleAutomationStatus(
        workspaceSlug,
        projectId,
        automation.id,
        !automation.is_active
      );

      // Refresh the list
      mutate(`AUTOMATIONS_${workspaceSlug}_${projectId}`);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: `Automation ${automation.is_active ? "disabled" : "enabled"} successfully.`,
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update automation status.",
      });
    }
  };

  const handleDeleteAutomation = async (automation: TProjectAutomation) => {
    if (!workspaceSlug || !projectId) return;
    if (!confirm(`Are you sure you want to delete "${automation.name}"?`)) return;

    try {
      await automationService.deleteAutomation(workspaceSlug, projectId, automation.id);

      // Refresh the list
      mutate(`AUTOMATIONS_${workspaceSlug}_${projectId}`);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Automation deleted successfully.",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete automation.",
      });
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      issue_created: "Work item created",
      issue_updated: "Work item updated",
      state_changed: "State changed",
      assignee_changed: "Assignee changed",
      comment_created: "Comment created",
    };
    return labels[triggerType] || triggerType;
  };

  const getActionsSummary = (automation: TProjectAutomation) => {
    const actionCount = automation.actions?.length || 0;
    if (actionCount === 0) return "No actions";
    if (actionCount === 1) return "1 action";
    return `${actionCount} actions`;
  };

  if (isLoading) {
    return (
      <div className="border-t border-custom-border-100 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Workflow Automations</h3>
            <p className="text-sm text-custom-text-200">
              Automate your workflow with custom triggers and actions
            </p>
          </div>
        </div>
        <div className="text-sm text-custom-text-300">Loading automations...</div>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-custom-border-100 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Workflow Automations</h3>
            <p className="text-sm text-custom-text-200">
              Automate your workflow with custom triggers and actions
            </p>
          </div>
          {canPerformAdminActions && (
            <Button variant="primary" size="sm" onClick={handleCreateAutomation} leadingIcon={Plus}>
              Create automation
            </Button>
          )}
        </div>

        {!automations || automations.length === 0 ? (
          <div className="rounded-md border border-custom-border-200 p-8 text-center">
            <Settings2 className="mx-auto h-12 w-12 text-custom-text-300 mb-4" />
            <h3 className="text-sm font-medium text-custom-text-100 mb-1">No automations yet</h3>
            <p className="text-xs text-custom-text-300 mb-4">
              Create your first workflow automation to streamline your project management
            </p>
            {canPerformAdminActions && (
              <Button variant="neutral-primary" size="sm" onClick={handleCreateAutomation} leadingIcon={Plus}>
                Create automation
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="group rounded-md border border-custom-border-200 p-4 hover:bg-custom-background-80 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-custom-text-100">{automation.name}</h4>
                      {automation.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                          <Play className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-custom-background-80 px-2 py-0.5 text-xs text-custom-text-300">
                          <Pause className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </div>

                    {automation.description && (
                      <p className="text-xs text-custom-text-300 mb-2">{automation.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-custom-text-300">
                      <span>
                        <span className="font-medium">Trigger:</span> {getTriggerLabel(automation.trigger_type)}
                      </span>
                      <span>•</span>
                      <span>
                        <span className="font-medium">Actions:</span> {getActionsSummary(automation)}
                      </span>
                      {automation.execution_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {automation.execution_count} executions
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {canPerformAdminActions && (
                    <div className="flex items-center gap-2 ml-4">
                      <ToggleSwitch
                        value={automation.is_active}
                        onChange={() => handleToggleAutomation(automation)}
                        size="sm"
                      />
                      <Button
                        variant="neutral-primary"
                        size="sm"
                        onClick={() => handleEditAutomation(automation)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="neutral-primary"
                        size="sm"
                        onClick={() => handleDeleteAutomation(automation)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        leadingIcon={Trash2}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <WorkflowAutomationModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          automation={selectedAutomation}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAutomation(null);
          }}
          onSuccess={() => {
            mutate(`AUTOMATIONS_${workspaceSlug}_${projectId}`);
          }}
        />
      )}
    </>
  );
});
