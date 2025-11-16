"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// UI
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { NewEmptyState } from "@/components/common";
import { SettingsSidebar } from "@/components/settings";
// hooks
import { PageTemplateService } from "@/core/services/page/page-template.service";
// constants
import { WORKSPACE_SETTINGS } from "@plane/constants";
import { useParams } from "next/navigation";

const pageTemplateService = new PageTemplateService();

export const WorkspaceTemplatesPage = observer(() => {
  const { workspaceSlug } = useParams();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = async () => {
    if (!workspaceSlug) return;

    setIsLoading(true);
    try {
      const data = await pageTemplateService.fetchWorkspaceTemplates(workspaceSlug as string);
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to load templates. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    // TODO: Open create template modal
    setToast({
      type: TOAST_TYPE.INFO,
      title: "Coming soon",
      message: "Template creation modal will open here.",
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!workspaceSlug) return;

    try {
      await pageTemplateService.deleteWorkspaceTemplate(workspaceSlug as string, templateId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Template deleted successfully.",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to delete template. Please try again.",
      });
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <SettingsSidebar />
      <div className="h-full w-full overflow-y-auto pl-0 pr-9 py-8 lg:pl-64">
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 pb-3.5">
          <div className="flex-1">
            <h3 className="text-xl font-medium">Templates</h3>
            <p className="mt-1 text-sm text-custom-text-400">
              Create and manage page templates for your workspace. Templates help you quickly create pages with
              predefined content and structure.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreateTemplate} className="flex-shrink-0">
            <Plus className="h-3 w-3" />
            Create template
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-custom-text-400">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <NewEmptyState
              title="No templates yet"
              description="Create your first page template to standardize and streamline your documentation workflow."
              image="/empty-states/templates.svg"
              primaryButton={{
                text: "Create template",
                onClick: handleCreateTemplate,
              }}
            />
          ) : (
            <div className="space-y-4">
              {templates.map((template: any) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-lg border border-custom-border-200 p-4 hover:bg-custom-background-80"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="mt-1 text-xs text-custom-text-400">{template.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-custom-text-400">
                      <span>Created by {template.created_by_detail?.display_name || "Unknown"}</span>
                      <span>•</span>
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="neutral-primary" size="sm" onClick={() => {}}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default WorkspaceTemplatesPage;
