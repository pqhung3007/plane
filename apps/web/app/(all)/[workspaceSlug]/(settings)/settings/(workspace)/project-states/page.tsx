"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { ProjectStatesSettings } from "@/components/workspace/settings/project-states/project-states-settings";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";

const WorkspaceProjectStatesSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Project States` : undefined;

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <section className="w-full h-full">
        <div className="flex justify-between gap-4 pb-3.5 items-start">
          <div>
            <h4 className="text-xl font-medium">Project States</h4>
            <p className="text-sm text-custom-text-400 mt-1">
              Track the overall progress of your projects with customizable states
            </p>
          </div>
        </div>
        <ProjectStatesSettings workspaceSlug={workspaceSlug?.toString() ?? ""} />
      </section>
    </SettingsContentWrapper>
  );
});

export default WorkspaceProjectStatesSettingsPage;
