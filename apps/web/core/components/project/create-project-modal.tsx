import type { FC } from "react";
import { useEffect, useState } from "react";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getAssetIdFromUrl, checkURLValidity } from "@plane/utils";
import { IProjectTemplate } from "@plane/types";
// plane ui
// helpers
// hooks
import useKeypress from "@/hooks/use-keypress";
// plane web components
import { CreateProjectForm } from "@/plane-web/components/projects/create/root";
// plane web types
import type { TProject } from "@/plane-web/types/projects";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
import { ProjectFeatureUpdate } from "./project-feature-update";
import { ProjectTemplateSelector } from "./create/template-selector";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
  data?: Partial<TProject>;
  templateId?: string;
  showTemplateSelector?: boolean;
};

enum EProjectCreationSteps {
  TEMPLATE_SELECTION = "TEMPLATE_SELECTION",
  CREATE_PROJECT = "CREATE_PROJECT",
  FEATURE_SELECTION = "FEATURE_SELECTION",
}

export const CreateProjectModal: FC<Props> = (props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug, data, templateId, showTemplateSelector = true } = props;
  // states
  const [currentStep, setCurrentStep] = useState<EProjectCreationSteps>(
    showTemplateSelector ? EProjectCreationSteps.TEMPLATE_SELECTION : EProjectCreationSteps.CREATE_PROJECT
  );
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<IProjectTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(showTemplateSelector ? EProjectCreationSteps.TEMPLATE_SELECTION : EProjectCreationSteps.CREATE_PROJECT);
      setCreatedProjectId(null);
      setSelectedTemplate(null);
    }
  }, [isOpen, showTemplateSelector]);

  const handleTemplateSelect = (template: IProjectTemplate | null) => {
    setSelectedTemplate(template);
    setCurrentStep(EProjectCreationSteps.CREATE_PROJECT);
  };

  const handleSkipTemplateSelection = () => {
    setSelectedTemplate(null);
    setCurrentStep(EProjectCreationSteps.CREATE_PROJECT);
  };

  const handleNextStep = (projectId: string) => {
    if (!projectId) return;
    setCreatedProjectId(projectId);
    setCurrentStep(EProjectCreationSteps.FEATURE_SELECTION);
  };

  const handleCoverImageStatusUpdate = async (projectId: string, coverImage: string) => {
    if (!checkURLValidity(coverImage)) {
      await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId, projectId, {
        asset_ids: [getAssetIdFromUrl(coverImage)],
      });
    }
  };

  // Prepare template data for project creation
  const getTemplateData = (): Partial<TProject> | undefined => {
    if (!selectedTemplate) return data;

    return {
      ...data,
      network: selectedTemplate.network,
      // Apply template features
      cycle_view: selectedTemplate.cycle_view,
      module_view: selectedTemplate.module_view,
      issue_views_view: selectedTemplate.issue_views_view,
      page_view: selectedTemplate.page_view,
      intake_view: selectedTemplate.intake_view,
      is_issue_type_enabled: selectedTemplate.is_issue_type_enabled,
      is_time_tracking_enabled: selectedTemplate.is_time_tracking_enabled,
    };
  };

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {currentStep === EProjectCreationSteps.TEMPLATE_SELECTION && (
        <ProjectTemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onSkip={handleSkipTemplateSelection}
        />
      )}
      {currentStep === EProjectCreationSteps.CREATE_PROJECT && (
        <CreateProjectForm
          setToFavorite={setToFavorite}
          workspaceSlug={workspaceSlug}
          onClose={onClose}
          updateCoverImageStatus={handleCoverImageStatusUpdate}
          handleNextStep={handleNextStep}
          data={getTemplateData()}
          templateId={templateId}
        />
      )}
      {currentStep === EProjectCreationSteps.FEATURE_SELECTION && (
        <ProjectFeatureUpdate projectId={createdProjectId} workspaceSlug={workspaceSlug} onClose={onClose} />
      )}
    </ModalCore>
  );
};
