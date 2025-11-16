"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Settings2, MoreVertical, Pencil, Trash2, Circle } from "lucide-react";
import useSWR, { mutate } from "swr";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { ToggleSwitch } from "@plane/ui";
import type { TProjectAutomation, TAutomationActivity } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// services
import { AutomationService } from "@/services/project/automation.service";
// components
import { WorkflowAutomationModal } from "./workflow-automation-modal";
// helpers
import { renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  canPerformAdminActions: boolean;
};

const automationService = new AutomationService();

export const WorkflowAutomationsTable = observer(({ workspaceSlug, projectId, canPerformAdminActions }: Props) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<TProjectAutomation | null>(null);
  const [loadingActivities, setLoadingActivities] = useState<Set<string>>(new Set());

  // Fetch automations
  const { data: automations, isLoading } = useSWR(
    workspaceSlug && projectId ? `AUTOMATIONS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => automationService.getProjectAutomations(workspaceSlug, projectId)
      : null
  );

  // Fetch activities for each automation
  const { data: activities } = useSWR(
    automations && workspaceSlug && projectId
      ? `AUTOMATION_ACTIVITIES_${workspaceSlug}_${projectId}`
      : null,
    async () => {
      if (!automations) return {};

      const activitiesMap: Record<string, TAutomationActivity> = {};

      await Promise.all(
        automations.map(async (automation) => {
          try {
            const activity = await automationService.getAutomationActivity(
              workspaceSlug,
              projectId,
              automation.id
            );
            activitiesMap[automation.id] = activity;
          } catch (error) {
            // Silently fail for individual automations
          }
        })
      );

      return activitiesMap;
    }
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
      mutate(`AUTOMATION_ACTIVITIES_${workspaceSlug}_${projectId}`);

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

  const getSuccessRate = (activity?: TAutomationActivity) => {
    if (!activity) return { successRate: 0, failRate: 0 };

    const { success_count, failed_count, total_executions } = activity.statistics;

    if (total_executions === 0) return { successRate: 0, failRate: 0 };

    const successRate = (success_count / total_executions) * 100;
    const failRate = (failed_count / total_executions) * 100;

    return { successRate, failRate };
  };

  const getStatusBadge = (activity?: TAutomationActivity) => {
    if (!activity || !activity.recent_logs || activity.recent_logs.length === 0) {
      return <span className="text-xs text-custom-text-400">Never run</span>;
    }

    const lastLog = activity.recent_logs[0];
    const statusColors = {
      success: "text-green-600",
      failed: "text-red-600",
      skipped: "text-yellow-600",
    };

    return (
      <span className={`text-xs font-medium ${statusColors[lastLog.status]}`}>
        {lastLog.status.charAt(0).toUpperCase() + lastLog.status.slice(1)}
      </span>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getOwnerName = (automation: TProjectAutomation) => {
    // TODO: Fetch actual user name from created_by ID
    return "Admin";
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
          <div className="rounded-md border border-custom-border-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-custom-background-80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Automation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Avg Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Executions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                    Updated
                  </th>
                  {canPerformAdminActions && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-custom-text-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-custom-background-100 divide-y divide-custom-border-200">
                {automations.map((automation) => {
                  const activity = activities?.[automation.id];
                  const { successRate, failRate } = getSuccessRate(activity);

                  return (
                    <tr key={automation.id} className="hover:bg-custom-background-80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Success/Failure indicator */}
                          <div className="flex items-center gap-0.5">
                            {automation.execution_count > 0 ? (
                              <>
                                <Circle
                                  className="h-2 w-2 fill-green-500 text-green-500"
                                  style={{ opacity: successRate / 100 }}
                                />
                                <Circle
                                  className="h-2 w-2 fill-red-500 text-red-500"
                                  style={{ opacity: failRate / 100 }}
                                />
                              </>
                            ) : (
                              <Circle className="h-2 w-2 fill-custom-text-400 text-custom-text-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-custom-text-100">
                                {automation.name}
                              </span>
                              <ToggleSwitch
                                value={automation.is_active}
                                onChange={() => handleToggleAutomation(automation)}
                                size="sm"
                                disabled={!canPerformAdminActions}
                              />
                            </div>
                            {automation.description && (
                              <p className="text-xs text-custom-text-300 mt-0.5">
                                {automation.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {automation.last_executed_at ? (
                          <div>
                            <div>{renderFormattedDate(automation.last_executed_at)}</div>
                            <div className="text-xs text-custom-text-400">
                              {renderFormattedTime(automation.last_executed_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-custom-text-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {getStatusBadge(activity)}
                      </td>

                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {formatDuration(activity?.statistics.average_execution_time_ms || null)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-custom-text-100">
                          {automation.execution_count}
                        </div>
                        {activity && automation.execution_count > 0 && (
                          <div className="text-xs text-custom-text-400">
                            {activity.statistics.success_count}✓ / {activity.statistics.failed_count}✗ / {activity.statistics.skipped_count}⊗
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {getOwnerName(automation)}
                      </td>

                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {renderFormattedDate(automation.created_at)}
                      </td>

                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {renderFormattedDate(automation.updated_at)}
                      </td>

                      {canPerformAdminActions && (
                        <td className="px-4 py-3 text-right">
                          <CustomMenu
                            ellipsis
                            customButton={
                              <div className="flex items-center justify-center">
                                <MoreVertical className="h-4 w-4 text-custom-text-300" />
                              </div>
                            }
                          >
                            <CustomMenu.MenuItem
                              onClick={() => handleEditAutomation(automation)}
                            >
                              <div className="flex items-center gap-2">
                                <Pencil className="h-3 w-3" />
                                Edit
                              </div>
                            </CustomMenu.MenuItem>
                            <CustomMenu.MenuItem
                              onClick={() => handleDeleteAutomation(automation)}
                            >
                              <div className="flex items-center gap-2 text-red-500">
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </div>
                            </CustomMenu.MenuItem>
                          </CustomMenu>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            mutate(`AUTOMATION_ACTIVITIES_${workspaceSlug}_${projectId}`);
          }}
        />
      )}
    </>
  );
});
