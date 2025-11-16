"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Search, ChevronRight, X } from "lucide-react";
import { Button, Input, Loader } from "@plane/ui";
import { IProjectTemplate } from "@plane/types";
import { useProject } from "@/hooks/store";
import { useParams } from "next/navigation";

type Props = {
  onSelectTemplate: (template: IProjectTemplate | null) => void;
  onSkip: () => void;
};

export const ProjectTemplateSelector = observer(({ onSelectTemplate, onSkip }: Props) => {
  const { workspaceSlug } = useParams();
  const { template: templateStore } = useProject();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<IProjectTemplate | null>(null);

  useEffect(() => {
    if (workspaceSlug) {
      templateStore.fetchProjectTemplates(workspaceSlug.toString());
    }
  }, [workspaceSlug, templateStore]);

  const filteredTemplates = templateStore.projectTemplates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = async (templateId: string) => {
    if (!workspaceSlug) return;
    try {
      const template = await templateStore.fetchProjectTemplateDetails(
        workspaceSlug.toString(),
        templateId
      );
      setSelectedTemplate(template);
    } catch (error) {
      console.error("Failed to fetch template details:", error);
    }
  };

  const handleContinue = () => {
    onSelectTemplate(selectedTemplate);
  };

  if (templateStore.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader>
          <Loader.Item height="60px" />
          <Loader.Item height="60px" />
          <Loader.Item height="60px" />
        </Loader>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-custom-border-200">
        <h2 className="text-xl font-semibold text-custom-text-100">Choose a Template</h2>
        <p className="text-sm text-custom-text-400 mt-1">
          Start with a pre-configured template or create a blank project
        </p>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-custom-border-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-custom-text-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Blank Project Option */}
        <div
          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all mb-3 ${
            selectedTemplate === null
              ? "border-custom-primary bg-custom-primary-100/10"
              : "border-custom-border-200 hover:border-custom-border-300"
          }`}
          onClick={() => setSelectedTemplate(null)}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-custom-background-80 flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-custom-text-100">Blank Project</h4>
              <p className="text-xs text-custom-text-400">Start from scratch with default settings</p>
            </div>
          </div>
          {selectedTemplate === null && (
            <div className="h-5 w-5 rounded-full bg-custom-primary flex items-center justify-center">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Templates */}
        {filteredTemplates.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-custom-text-400">
              {searchQuery ? `No templates found matching "${searchQuery}"` : "No templates available"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? "border-custom-primary bg-custom-primary-100/10"
                    : "border-custom-border-200 hover:border-custom-border-300"
                }`}
                onClick={() => handleSelectTemplate(template.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {template.emoji ? (
                    <span className="text-2xl flex-shrink-0">{template.emoji}</span>
                  ) : template.logo_props?.icon ? (
                    <div
                      className="h-10 w-10 flex-shrink-0 rounded flex items-center justify-center text-white"
                      style={{ backgroundColor: template.logo_props.icon.color || "#6b7280" }}
                    >
                      <span className="text-sm font-medium">
                        {template.logo_props.icon.name?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <div className="h-10 w-10 flex-shrink-0 rounded bg-custom-background-80 flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-custom-text-100 truncate">{template.name}</h4>
                    {template.description && (
                      <p className="text-xs text-custom-text-400 line-clamp-1">{template.description}</p>
                    )}
                    <p className="text-xs text-custom-text-400 mt-1">
                      Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}
                    </p>
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="h-5 w-5 rounded-full bg-custom-primary flex items-center justify-center ml-2">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-custom-border-200 flex items-center justify-between">
        <Button variant="neutral-primary" size="sm" onClick={onSkip}>
          Skip
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleContinue}
          appendIcon={<ChevronRight />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
});
