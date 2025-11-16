"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import {
  WorkItemTemplateList,
  CreateEditTemplateModal,
} from "@/components/work-item-templates";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// types
import type { TWorkItemTemplate } from "@plane/types";

const TemplatesSettingsPage = observer(() => {
  // store hooks
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();

  // states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<TWorkItemTemplate | null>(null);

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Templates` : undefined;

  // derived values
  const canPerformProjectMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const handleCreateTemplate = () => {
    setTemplateToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleEditTemplate = (template: TWorkItemTemplate) => {
    setTemplateToEdit(template);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setTemplateToEdit(null);
  };

  if (workspaceUserInfo && !canPerformProjectMemberActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <>
      <CreateEditTemplateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        templateToEdit={templateToEdit}
        isWorkspaceLevel={false}
      />

      <SettingsContentWrapper>
        <PageHead title={pageTitle} />
        <div className="h-full w-full">
          <WorkItemTemplateList
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            isWorkspaceLevel={false}
          />
        </div>
      </SettingsContentWrapper>
    </>
  );
});

export default TemplatesSettingsPage;
