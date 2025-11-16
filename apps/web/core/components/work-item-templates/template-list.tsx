"use client";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { TWorkItemTemplate } from "@plane/types";
import { Loader } from "@plane/ui";
// hooks
import { useWorkItemTemplate } from "@/hooks/store";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { SettingsHeading } from "../settings/heading";
import { DeleteWorkItemTemplateModal } from "./delete-template-modal";
import { WorkItemTemplateItem } from "./template-item";

type Props = {
  onCreateTemplate: () => void;
  onEditTemplate: (template: TWorkItemTemplate) => void;
  onUseTemplate?: (template: TWorkItemTemplate) => void;
  isWorkspaceLevel?: boolean;
};

export const WorkItemTemplateList: React.FC<Props> = observer((props) => {
  const { onCreateTemplate, onEditTemplate, onUseTemplate, isWorkspaceLevel = false } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [selectDeleteTemplate, setSelectDeleteTemplate] = useState<TWorkItemTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectTemplates, workspaceTemplates, fetchProjectTemplates, fetchWorkspaceTemplates } =
    useWorkItemTemplate();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const isEditable = isWorkspaceLevel
    ? allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE)
    : allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const templates = isWorkspaceLevel ? workspaceTemplates : projectTemplates;

  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!workspaceSlug) return;

      try {
        setIsLoading(true);
        if (isWorkspaceLevel) {
          await fetchWorkspaceTemplates(workspaceSlug.toString());
        } else if (projectId) {
          await fetchProjectTemplates(workspaceSlug.toString(), projectId.toString());
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [workspaceSlug, projectId, isWorkspaceLevel, fetchProjectTemplates, fetchWorkspaceTemplates]);

  return (
    <>
      <DeleteWorkItemTemplateModal
        isOpen={!!selectDeleteTemplate}
        data={selectDeleteTemplate ?? null}
        onClose={() => setSelectDeleteTemplate(null)}
        isWorkspaceLevel={isWorkspaceLevel}
      />

      <SettingsHeading
        title="Work Item Templates"
        description="Create reusable templates for common work items to streamline your workflow and ensure consistency across your team."
        button={{
          label: "Create template",
          onClick: onCreateTemplate,
        }}
        showButton={isEditable}
      />

      <div className="w-full py-2">
        {isLoading ? (
          <Loader className="space-y-3">
            <Loader.Item height="64px" />
            <Loader.Item height="64px" />
            <Loader.Item height="64px" />
          </Loader>
        ) : templates && templates.length > 0 ? (
          <div className="mt-3 space-y-2">
            {templates.map((template) => (
              <WorkItemTemplateItem
                key={template.id}
                template={template}
                onEdit={onEditTemplate}
                onDelete={setSelectDeleteTemplate}
                onUse={onUseTemplate}
                isEditable={isEditable}
              />
            ))}
          </div>
        ) : (
          <EmptyStateCompact
            assetKey="empty-state"
            assetClassName="size-20"
            title="No templates yet"
            description="Create your first work item template to save time and ensure consistency across your work items."
            actions={
              isEditable
                ? [
                    {
                      label: "Create template",
                      onClick: onCreateTemplate,
                    },
                  ]
                : []
            }
            align="start"
            rootClassName="py-20"
          />
        )}
      </div>
    </>
  );
});
