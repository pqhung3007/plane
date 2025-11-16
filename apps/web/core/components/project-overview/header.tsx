"use client";

import { observer } from "mobx-react";
import { useState } from "react";
import { Info, Upload } from "lucide-react";
// plane imports
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { LogoSpinner, Tooltip } from "@plane/propel";
import type { TProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  project: TProject;
  workspaceSlug: string;
  projectId: string;
  hasEditPermission: boolean;
  onOpenSidebar: () => void;
};

export const ProjectOverviewHeader = observer((props: Props) => {
  const { project, workspaceSlug, projectId, hasEditPermission, onOpenSidebar } = props;
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // store hooks
  const { updateProject } = useProject();

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please upload an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Image size should be less than 5MB",
      });
      return;
    }

    try {
      setIsUploadingBanner(true);
      const formData = new FormData();
      formData.append("cover_image", file);

      await updateProject(workspaceSlug, projectId, formData as any);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Banner uploaded successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to upload banner",
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      await updateProject(workspaceSlug, projectId, { cover_image: "" });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Banner removed successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to remove banner",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="relative h-48 w-full rounded-lg overflow-hidden bg-custom-background-90">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-custom-text-300">
            <div className="text-center">
              <p className="text-sm">No banner image</p>
            </div>
          </div>
        )}

        {/* Upload/Remove Banner Button */}
        {hasEditPermission && (
          <div className="absolute top-4 right-4 flex gap-2">
            {project.cover_image_url && (
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={handleRemoveBanner}
              >
                Remove
              </Button>
            )}
            <label htmlFor="banner-upload">
              <Button
                variant="neutral-primary"
                size="sm"
                disabled={isUploadingBanner}
                onClick={() => document.getElementById("banner-upload")?.click()}
              >
                {isUploadingBanner ? (
                  <LogoSpinner className="h-4 w-4" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload Banner</span>
                  </>
                )}
              </Button>
            </label>
            <input
              id="banner-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>
        )}
      </div>

      {/* Project Info Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Project Logo */}
          <div className="h-16 w-16 rounded-lg bg-custom-background-90 flex items-center justify-center flex-shrink-0 border border-custom-border-200">
            {project.logo_props?.emoji ? (
              <span className="text-3xl">{project.logo_props.emoji}</span>
            ) : project.logo_props?.icon ? (
              <div className="text-3xl" style={{ color: project.logo_props.icon_color || "#000" }}>
                {project.logo_props.icon}
              </div>
            ) : (
              <span className="text-2xl font-semibold text-custom-text-200">
                {project.identifier}
              </span>
            )}
          </div>

          {/* Project Name and Identifier */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-custom-text-100">
              {project.name}
            </h1>
            <p className="text-sm text-custom-text-300 mt-1">
              {project.identifier}
            </p>
          </div>
        </div>

        {/* Info Button to Open Sidebar */}
        <Tooltip tooltipContent="Project Properties">
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={onOpenSidebar}
            className="flex-shrink-0"
          >
            <Info className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});
