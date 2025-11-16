"use client";

import { observer } from "mobx-react";
import { MoreVertical, Trash2, Edit, Copy } from "lucide-react";
import { IProjectTemplateLite } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { useProject } from "@/hooks/store";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  template: IProjectTemplateLite;
  onEdit?: (templateId: string) => void;
};

export const ProjectTemplateCard = observer(({ template, onEdit }: Props) => {
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { template: templateStore } = useProject();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!workspaceSlug) return;

    if (window.confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await templateStore.deleteProjectTemplate(workspaceSlug.toString(), template.id);
      } catch (error) {
        console.error("Failed to delete template:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUse = async () => {
    if (!workspaceSlug) return;

    try {
      await templateStore.useProjectTemplate(workspaceSlug.toString(), template.id);
      // Navigate to project creation with template
      router.push(`/${workspaceSlug}/projects?template=${template.id}`);
    } catch (error) {
      console.error("Failed to use template:", error);
    }
  };

  return (
    <div className="group relative flex flex-col bg-custom-background-100 border border-custom-border-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {template.emoji ? (
            <span className="text-2xl flex-shrink-0">{template.emoji}</span>
          ) : template.logo_props?.icon ? (
            <div
              className="h-8 w-8 flex-shrink-0 rounded flex items-center justify-center text-white"
              style={{ backgroundColor: template.logo_props.icon.color || "#6b7280" }}
            >
              <span className="text-sm">{template.logo_props.icon.name?.slice(0, 2).toUpperCase()}</span>
            </div>
          ) : (
            <div className="h-8 w-8 flex-shrink-0 rounded bg-custom-background-80 flex items-center justify-center">
              <span className="text-sm text-custom-text-400">📋</span>
            </div>
          )}
        </div>
        <CustomMenu
          customButton={
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4 text-custom-text-400" />
            </div>
          }
          placement="bottom-end"
        >
          <CustomMenu.MenuItem onClick={handleUse}>
            <div className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              <span>Use template</span>
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={() => onEdit?.(template.id)}>
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </div>
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={handleDelete} disabled={isDeleting}>
            <div className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </div>
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>

      {/* Cover Image */}
      {template.cover_image_url && (
        <div className="mb-3 -mx-4 -mt-4">
          <img
            src={template.cover_image_url}
            alt={template.name}
            className="w-full h-32 object-cover rounded-t-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-medium text-sm text-custom-text-100 mb-1 line-clamp-1">
          {template.name}
        </h3>
        {template.description && (
          <p className="text-xs text-custom-text-400 line-clamp-2">
            {template.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-custom-border-200 flex items-center justify-between text-xs text-custom-text-400">
        <span>Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}</span>
        <span>{new Date(template.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
});
