"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Plus, Search, FileText, ListTodo, Layout } from "lucide-react";
import { Button, Loader, Input } from "@plane/ui";
import { IProjectTemplate } from "@plane/types";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { ProjectTemplateCard } from "@/components/project-templates";
import { CreateProjectTemplateModal } from "@/components/project-templates";
import { EmptyState } from "@/components/empty-state";
import { useProject } from "@/hooks/store";
import { useParams } from "next/navigation";

type TemplateCategory = "project" | "work-item" | "page";

const TEMPLATE_CATEGORIES = [
  {
    key: "project" as TemplateCategory,
    label: "Project templates",
    icon: Layout,
    description: "Reusable project structures with predefined settings",
  },
  {
    key: "work-item" as TemplateCategory,
    label: "Work item templates",
    icon: ListTodo,
    description: "Pre-configured work item templates for consistent task creation",
  },
  {
    key: "page" as TemplateCategory,
    label: "Page templates",
    icon: FileText,
    description: "Document templates for meeting notes, specs, and more",
  },
];

export default observer(function WorkspaceTemplatesPage() {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("project");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IProjectTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { workspaceSlug } = useParams();
  const { template } = useProject();

  useEffect(() => {
    if (workspaceSlug && activeCategory === "project") {
      template.fetchProjectTemplates(workspaceSlug.toString());
    }
  }, [workspaceSlug, template, activeCategory]);

  const pageTitle = "Templates - Plane";

  const filteredTemplates = template.projectTemplates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasTemplates = template.projectTemplates.length > 0;

  const handleEdit = async (templateId: string) => {
    if (!workspaceSlug) return;
    try {
      const templateDetails = await template.fetchProjectTemplateDetails(
        workspaceSlug.toString(),
        templateId
      );
      setEditingTemplate(templateDetails);
    } catch (error) {
      console.error("Failed to fetch template details:", error);
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingTemplate(null);
  };

  const activeCategoryData = TEMPLATE_CATEGORIES.find((cat) => cat.key === activeCategory);

  const renderProjectTemplates = () => {
    if (template.isLoading) {
      return (
        <Loader className="mt-8 space-y-4">
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
        </Loader>
      );
    }

    if (!hasTemplates) {
      return (
        <EmptyState
          title="No project templates yet"
          description="Get started by creating your first project template to standardize project creation."
          image={
            <div className="w-full h-52 flex items-center justify-center bg-custom-background-80 rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-sm text-custom-text-400">No templates</div>
              </div>
            </div>
          }
          primaryButton={{
            text: "Create your first template",
            icon: <Plus />,
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      );
    }

    return (
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-custom-text-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            prependIcon={<Plus />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create template
          </Button>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-custom-text-400">
              No templates found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((tmpl) => (
              <ProjectTemplateCard
                key={tmpl.id}
                template={tmpl}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderComingSoon = (category: string) => (
    <EmptyState
      title={`${category} templates coming soon`}
      description={`${category} templates will allow you to create reusable templates for ${category.toLowerCase()}s.`}
      image={
        <div className="w-full h-52 flex items-center justify-center bg-custom-background-80 rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">🚀</div>
            <div className="text-sm text-custom-text-400">Coming soon</div>
          </div>
        </div>
      }
    />
  );

  return (
    <>
      <PageHead title={pageTitle} />
      <CreateProjectTemplateModal
        isOpen={isCreateModalOpen || !!editingTemplate}
        onClose={handleCloseModal}
        template={editingTemplate || undefined}
        onSuccess={() => {
          handleCloseModal();
        }}
      />
      <SettingsContentWrapper size="lg">
        <SettingsHeading
          title="Templates"
          description="Create reusable templates to standardize and streamline your workflow across projects, work items, and pages."
        />

        {/* Tabs */}
        <div className="mt-6 border-b border-custom-border-200">
          <div className="flex gap-1">
            {TEMPLATE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.key;
              return (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-custom-primary text-custom-text-100"
                      : "border-transparent text-custom-text-400 hover:text-custom-text-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Description */}
        <div className="mt-4 mb-2">
          <p className="text-sm text-custom-text-400">{activeCategoryData?.description}</p>
        </div>

        {/* Content */}
        <div className="mt-4">
          {activeCategory === "project" && renderProjectTemplates()}
          {activeCategory === "work-item" && renderComingSoon("Work item")}
          {activeCategory === "page" && renderComingSoon("Page")}
        </div>
      </SettingsContentWrapper>
    </>
  );
});
