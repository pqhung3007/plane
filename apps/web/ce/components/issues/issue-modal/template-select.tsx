"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FileText, ChevronDown } from "lucide-react";
// ui
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useWorkItemTemplate } from "@/hooks/store/use-work-item-template";
// types
import type { TWorkItemTemplate } from "@plane/types";

export type TWorkItemTemplateDropdownSize = "xs" | "sm";

export type TWorkItemTemplateSelect = {
  projectId: string | null;
  typeId: string | null;
  disabled?: boolean;
  size?: TWorkItemTemplateDropdownSize;
  placeholder?: string;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  handleModalClose: () => void;
  handleFormChange?: () => void;
  onTemplateSelect?: (template: TWorkItemTemplate) => void;
};

export const WorkItemTemplateSelect = observer((props: TWorkItemTemplateSelect) => {
  const {
    projectId,
    typeId,
    disabled = false,
    size = "sm",
    placeholder = "Select template",
    renderChevron = true,
    dropDownContainerClassName,
    onTemplateSelect,
  } = props;

  const { workspaceSlug } = useParams();
  const { getProjectTemplates, getTemplatesByTypeId } = useWorkItemTemplate();

  // Get templates for the current project
  const projectTemplates = projectId ? getProjectTemplates(projectId) : undefined;

  // Filter by type if typeId is provided
  const availableTemplates = typeId && projectId ? getTemplatesByTypeId(typeId) : projectTemplates;

  // If no templates available, don't render the selector
  if (!availableTemplates || availableTemplates.length === 0) {
    return null;
  }

  const handleTemplateClick = (template: TWorkItemTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const buttonClasses = cn(
    "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
    {
      "h-6": size === "xs",
      "h-7": size === "sm",
      "cursor-not-allowed opacity-50": disabled,
      "hover:bg-custom-background-80 text-custom-text-300": !disabled,
    },
    dropDownContainerClassName
  );

  return (
    <CustomMenu
      customButton={
        <div className={buttonClasses}>
          <FileText className="size-3" />
          <span>{placeholder}</span>
          {renderChevron && <ChevronDown className="size-3" />}
        </div>
      }
      disabled={disabled}
      placement="bottom-start"
    >
      <div className="max-h-60 overflow-y-auto">
        {availableTemplates.map((template) => (
          <CustomMenu.MenuItem key={template.id} onClick={() => handleTemplateClick(template)}>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-custom-text-200">{template.name}</span>
              {template.description && (
                <span className="text-xs text-custom-text-300 line-clamp-1">{template.description}</span>
              )}
            </div>
          </CustomMenu.MenuItem>
        ))}
      </div>
    </CustomMenu>
  );
});
