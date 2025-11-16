"use client";

import React from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2, FileText } from "lucide-react";
// types
import type { TWorkItemTemplate } from "@plane/types";
// ui
import { CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { useParams } from "next/navigation";

type Props = {
  template: TWorkItemTemplate;
  onEdit: (template: TWorkItemTemplate) => void;
  onDelete: (template: TWorkItemTemplate) => void;
  onUse?: (template: TWorkItemTemplate) => void;
  isEditable?: boolean;
};

export const WorkItemTemplateItem: React.FC<Props> = observer((props) => {
  const { template, onEdit, onDelete, onUse, isEditable = false } = props;

  const handleUseTemplate = () => {
    if (onUse) {
      onUse(template);
    } else {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Info",
        message: "Please create a new work item and select this template from the template dropdown",
      });
    }
  };

  return (
    <div className="group relative flex items-center justify-between gap-2 rounded border-[0.5px] border-custom-border-200 bg-custom-background-100 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="size-4 flex-shrink-0 text-custom-text-300" />
          <h4 className="text-sm font-medium text-custom-text-100 truncate">{template.name}</h4>
        </div>
        {template.description && (
          <p className="mt-1 text-xs text-custom-text-300 line-clamp-1">{template.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleUseTemplate}
          className="hidden group-hover:flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-custom-text-300 hover:bg-custom-background-80 hover:text-custom-text-200 transition-colors"
        >
          Use template
        </button>

        {isEditable && (
          <CustomMenu ellipsis>
            <CustomMenu.MenuItem onClick={() => onEdit(template)}>
              <div className="flex items-center gap-2">
                <Pencil className="size-3" />
                <span>Edit</span>
              </div>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={() => onDelete(template)}>
              <div className="flex items-center gap-2">
                <Trash2 className="size-3" />
                <span>Delete</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        )}
      </div>
    </div>
  );
});
