"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkItemTemplate } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// hooks
import { useWorkItemTemplate } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: TWorkItemTemplate | null;
  isWorkspaceLevel?: boolean;
};

export const DeleteWorkItemTemplateModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, isWorkspaceLevel = false } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { deleteTemplate, deleteWorkspaceTemplate } = useWorkItemTemplate();
  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;
    if (!isWorkspaceLevel && !projectId) return;

    setIsDeleteLoading(true);

    try {
      if (isWorkspaceLevel) {
        await deleteWorkspaceTemplate(workspaceSlug.toString(), data.id);
      } else {
        await deleteTemplate(workspaceSlug.toString(), projectId!.toString(), data.id);
      }

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Template deleted successfully",
      });
      handleClose();
    } catch (err: any) {
      setIsDeleteLoading(false);

      const error = err?.error || "Template could not be deleted. Please try again.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error,
      });
    }
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title="Delete Template"
      content={
        <>
          Are you sure you want to delete <span className="font-medium text-custom-text-100">{data?.name}</span>? This
          action cannot be undone.
        </>
      }
    />
  );
});
