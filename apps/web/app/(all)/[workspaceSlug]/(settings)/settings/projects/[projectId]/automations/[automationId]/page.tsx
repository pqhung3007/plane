"use client";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectAutomation } from "@plane/types";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { AutomationService } from "@/services/project/automation.service";
// local
import { AutomationDetailHeader } from "./header";

const automationService = new AutomationService();

const AutomationDetailPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug: workspaceSlugParam, projectId: projectIdParam, automationId: automationIdParam } = useParams();
  const workspaceSlug = workspaceSlugParam?.toString();
  const projectId = projectIdParam?.toString();
  const automationId = automationIdParam?.toString();

  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();

  // state
  const [automation, setAutomation] = useState<TProjectAutomation | null>(null);
  const [automations, setAutomations] = useState<TProjectAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // derived values
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  // Fetch automation data
  useEffect(() => {
    if (!workspaceSlug || !projectId || !automationId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch all automations for the dropdown
        const allAutomations = await automationService.getProjectAutomations(workspaceSlug, projectId);
        setAutomations(allAutomations);

        // Fetch the specific automation
        const data = await automationService.getAutomation(workspaceSlug, projectId, automationId);
        setAutomation(data);
      } catch (error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to load automation.",
        });
        router.push(`/${workspaceSlug}/settings/projects/${projectId}/automations`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, projectId, automationId, router]);

  // derived values
  const pageTitle = projectDetails?.name && automation?.name
    ? `${projectDetails?.name} - ${automation?.name}`
    : undefined;

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  if (isLoading) {
    return (
      <SettingsContentWrapper size="lg">
        <PageHead title={pageTitle} />
        <div className="flex items-center justify-center h-full py-20">
          <div className="text-custom-text-300">Loading automation...</div>
        </div>
      </SettingsContentWrapper>
    );
  }

  if (!automation) {
    return (
      <SettingsContentWrapper size="lg">
        <PageHead title={pageTitle} />
        <div className="flex items-center justify-center h-full py-20">
          <div className="text-custom-text-300">Automation not found</div>
        </div>
      </SettingsContentWrapper>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <SettingsContentWrapper size="lg">
        <AutomationDetailHeader automations={automations} currentAutomation={automation} />

        <div className="p-6">
          <div className="space-y-6">
            {/* Automation Details */}
            <div>
              <h2 className="text-xl font-semibold text-custom-text-100 mb-2">{automation.name}</h2>
              {automation.description && (
                <p className="text-sm text-custom-text-300">{automation.description}</p>
              )}
            </div>

            {/* Automation Status */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-custom-border-200 bg-custom-background-90">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-custom-text-200">Status:</span>
                <span className={`text-sm font-medium ${automation.is_active ? 'text-green-600' : 'text-custom-text-400'}`}>
                  {automation.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-custom-text-200">Executions:</span>
                <span className="text-sm text-custom-text-100">{automation.execution_count || 0}</span>
              </div>
              {automation.last_executed_at && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-custom-text-200">Last run:</span>
                  <span className="text-sm text-custom-text-100">
                    {new Date(automation.last_executed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Trigger Configuration */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-custom-text-200 uppercase">Trigger</h3>
              <div className="p-4 rounded-lg border border-custom-border-200 bg-custom-background-90">
                <p className="text-sm text-custom-text-100">
                  Type: <span className="font-medium">{automation.trigger_type}</span>
                </p>
                {automation.trigger_config && Object.keys(automation.trigger_config).length > 0 && (
                  <pre className="mt-2 text-xs text-custom-text-300">
                    {JSON.stringify(automation.trigger_config, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-custom-text-200 uppercase">Conditions</h3>
              <div className="p-4 rounded-lg border border-custom-border-200 bg-custom-background-90">
                <pre className="text-xs text-custom-text-300">
                  {JSON.stringify(automation.conditions, null, 2)}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-custom-text-200 uppercase">Actions</h3>
              <div className="space-y-2">
                {automation.actions.map((action, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-custom-border-200 bg-custom-background-90"
                  >
                    <p className="text-sm font-medium text-custom-text-100 mb-2">
                      {index + 1}. {action.type}
                    </p>
                    <pre className="text-xs text-custom-text-300">
                      {JSON.stringify(action.config, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SettingsContentWrapper>
    </>
  );
});

export default AutomationDetailPage;
