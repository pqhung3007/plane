"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectOverviewRoot } from "@/components/project-overview/root";
// hooks
import { useProject } from "@/hooks/store/use-project";

const ProjectOverviewPage = observer(() => {
  const { projectId } = useParams();
  // i18n
  const { t } = useTranslation();
  // store
  const { getProjectById } = useProject();

  if (!projectId) {
    return <></>;
  }

  // derived values
  const project = getProjectById(projectId.toString());
  const pageTitle = project?.name ? `${project?.name} - Overview` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <ProjectOverviewRoot />
      </div>
    </>
  );
});

export default ProjectOverviewPage;
