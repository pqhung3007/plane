"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { ProjectOverviewHeader } from "./header";
import { ProjectOverviewDescription } from "./description";
import { ProjectOverviewMetrics } from "./metrics";
import { ProjectOverviewProgress } from "./progress";
import { ProjectOverviewUpdates } from "./updates";
import { ProjectOverviewActivity } from "./activity";
import { ProjectOverviewSidebar } from "./sidebar";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useState } from "react";

export const ProjectOverviewRoot = observer(() => {
  const { workspaceSlug, projectId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // store hooks
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !projectId) return <></>;

  // derived values
  const project = getProjectById(projectId.toString());
  const hasEditPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (!project) return <></>;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* Project Header */}
          <ProjectOverviewHeader
            project={project}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            hasEditPermission={hasEditPermission}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

          {/* Project Description (Notion-style editor) */}
          <ProjectOverviewDescription
            project={project}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            hasEditPermission={hasEditPermission}
          />

          {/* Project Metrics */}
          <ProjectOverviewMetrics
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />

          {/* Project Progress */}
          <ProjectOverviewProgress
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />

          {/* Project Updates */}
          <ProjectOverviewUpdates
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            hasEditPermission={hasEditPermission}
          />

          {/* Activity Feed */}
          <ProjectOverviewActivity
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
          />
        </div>
      </div>

      {/* Sidebar for Project Properties */}
      {isSidebarOpen && (
        <ProjectOverviewSidebar
          project={project}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          hasEditPermission={hasEditPermission}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
});
