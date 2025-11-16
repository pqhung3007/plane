"use client";

import { observer } from "mobx-react";
import { X, Calendar, Users, Target, Flag } from "lucide-react";
import { Button } from "@plane/ui";
import type { TProject } from "@plane/types";
import { DatePicker } from "@plane/propel";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectMember } from "@/hooks/store/use-project-member";

type Props = {
  project: TProject;
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
  onClose: () => void;
};

export const ProjectOverviewSidebar = observer((props: Props) => {
  const { project, workspaceSlug, projectId, hasEditPermission, onClose } = props;

  // store hooks
  const { updateProject } = useProject();
  const { getProjectMembers, getProjectMemberById } = useProjectMember();

  const projectMembers = getProjectMembers(projectId);
  const projectLead = project.project_lead
    ? getProjectMemberById(projectId, project.project_lead.toString())
    : null;

  const handleUpdateProject = async (data: Partial<TProject>) => {
    try {
      await updateProject(workspaceSlug, projectId, data);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  return (
    <div className="h-full w-80 border-l border-custom-border-200 bg-custom-background-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-custom-border-200">
        <h3 className="text-lg font-semibold text-custom-text-100">
          Project Properties
        </h3>
        <Button variant="neutral-primary" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* State/Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-custom-text-300" />
            <label className="text-sm font-medium text-custom-text-200">
              State
            </label>
          </div>
          <div className="pl-6">
            <p className="text-sm text-custom-text-100">
              {project.network === 2 ? "Private" : "Public"}
            </p>
          </div>
        </div>

        {/* Priority */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="h-4 w-4 text-custom-text-300" />
            <label className="text-sm font-medium text-custom-text-200">
              Priority
            </label>
          </div>
          <div className="pl-6">
            <p className="text-sm text-custom-text-300 italic">
              Not configured
            </p>
          </div>
        </div>

        {/* Team Composition */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-custom-text-300" />
            <label className="text-sm font-medium text-custom-text-200">
              Team
            </label>
          </div>
          <div className="pl-6 space-y-3">
            {/* Project Lead */}
            {projectLead && (
              <div>
                <p className="text-xs text-custom-text-300 mb-1">
                  Project Lead
                </p>
                <div className="flex items-center gap-2">
                  {projectLead.member?.avatar_url ? (
                    <img
                      src={projectLead.member.avatar_url}
                      alt={projectLead.member?.display_name || ""}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-custom-background-90 flex items-center justify-center">
                      <span className="text-xs font-medium text-custom-text-100">
                        {projectLead.member?.display_name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-custom-text-100">
                    {projectLead.member?.display_name || "Unknown"}
                  </span>
                </div>
              </div>
            )}

            {/* Team Members Count */}
            <div>
              <p className="text-xs text-custom-text-300 mb-1">
                Members
              </p>
              <p className="text-sm text-custom-text-100">
                {projectMembers?.length || 0} member{projectMembers?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-custom-text-300" />
            <label className="text-sm font-medium text-custom-text-200">
              Timeline
            </label>
          </div>
          <div className="pl-6 space-y-3">
            {/* Start Date */}
            <div>
              <p className="text-xs text-custom-text-300 mb-1">
                Start Date
              </p>
              {hasEditPermission ? (
                <DatePicker
                  value={project.created_at ? new Date(project.created_at) : null}
                  onChange={(date) => {
                    // Note: Projects don't have a start_date field in the type
                    // This is just for display purposes
                  }}
                  placeholder="Select start date"
                  buttonVariant="transparent-with-text"
                  disabled={!hasEditPermission}
                />
              ) : (
                <p className="text-sm text-custom-text-100">
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "Not set"}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-xs text-custom-text-300 mb-1">
                Due Date
              </p>
              <p className="text-sm text-custom-text-300 italic">
                Not configured
              </p>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="pt-6 border-t border-custom-border-200">
          <h4 className="text-sm font-medium text-custom-text-200 mb-3">
            Project Information
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-custom-text-300 mb-1">
                Identifier
              </p>
              <p className="text-sm text-custom-text-100 font-mono">
                {project.identifier}
              </p>
            </div>
            <div>
              <p className="text-xs text-custom-text-300 mb-1">
                Created
              </p>
              <p className="text-sm text-custom-text-100">
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Unknown"}
              </p>
            </div>
            {project.updated_at && (
              <div>
                <p className="text-xs text-custom-text-300 mb-1">
                  Last Updated
                </p>
                <p className="text-sm text-custom-text-100">
                  {new Date(project.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Enabled */}
        <div className="pt-6 border-t border-custom-border-200">
          <h4 className="text-sm font-medium text-custom-text-200 mb-3">
            Enabled Features
          </h4>
          <div className="space-y-2">
            {[
              { label: "Cycles", enabled: project.cycle_view },
              { label: "Modules", enabled: project.module_view },
              { label: "Milestones", enabled: project.milestone_view },
              { label: "Pages", enabled: project.page_view },
              { label: "Views", enabled: project.issue_views_view },
              { label: "Inbox", enabled: project.inbox_view },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center justify-between">
                <span className="text-sm text-custom-text-100">
                  {feature.label}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    feature.enabled
                      ? "bg-green-500/10 text-green-600"
                      : "bg-custom-background-90 text-custom-text-300"
                  }`}
                >
                  {feature.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
