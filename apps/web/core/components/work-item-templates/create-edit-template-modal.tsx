"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkItemTemplate, TWorkItemTemplateCreatePayload } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
// hooks
import { useWorkItemTemplate } from "@/hooks/store/use-work-item-template";
// ui
import { Dialog } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: TWorkItemTemplate | null;
  isWorkspaceLevel?: boolean;
};

const defaultValues: Partial<TWorkItemTemplateCreatePayload> = {
  name: "",
  description: "",
  type_id: null,
  project_id: "",
  properties: {
    name: "",
    description_html: "",
    state_id: null,
    priority: null,
    label_ids: [],
    assignee_ids: [],
    module_ids: [],
    estimate_point: null,
    start_date: null,
    target_date: null,
    sub_work_items: [],
  },
};

export const CreateEditTemplateModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, templateToEdit, isWorkspaceLevel = false } = props;

  // router
  const { workspaceSlug, projectId } = useParams();

  // store hooks
  const { createTemplate, createWorkspaceTemplate, updateTemplate, updateWorkspaceTemplate } = useWorkItemTemplate();

  // form
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TWorkItemTemplateCreatePayload>({
    defaultValues,
  });

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const onSubmit = async (data: TWorkItemTemplateCreatePayload) => {
    if (!workspaceSlug) return;
    if (!isWorkspaceLevel && !projectId) return;

    try {
      // Set project_id if creating a project-level template
      if (!isWorkspaceLevel && projectId) {
        data.project_id = projectId.toString();
      }

      if (templateToEdit) {
        // Update existing template
        if (isWorkspaceLevel) {
          await updateWorkspaceTemplate(workspaceSlug.toString(), templateToEdit.id, data);
        } else {
          await updateTemplate(workspaceSlug.toString(), projectId!.toString(), templateToEdit.id, data);
        }

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Template updated successfully",
        });
      } else {
        // Create new template
        if (isWorkspaceLevel) {
          await createWorkspaceTemplate(workspaceSlug.toString(), data);
        } else {
          await createTemplate(workspaceSlug.toString(), projectId!.toString(), data);
        }

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Template created successfully",
        });
      }

      handleClose();
    } catch (error: any) {
      console.error("Error saving template:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.message || "Something went wrong. Please try again.",
      });
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (templateToEdit) {
      setValue("name", templateToEdit.name);
      setValue("description", templateToEdit.description);
      setValue("type_id", templateToEdit.type_id);
      setValue("project_id", templateToEdit.project_id);
      setValue("properties", templateToEdit.properties);
    } else {
      reset(defaultValues);
    }
  }, [templateToEdit, setValue, reset]);

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} size="2xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Dialog.Panel>
          <Dialog.Title>{templateToEdit ? "Edit Template" : "Create Template"}</Dialog.Title>
          <Dialog.Description>
            {templateToEdit
              ? "Update the template details below"
              : "Create a reusable template for common work items"}
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            {/* Template Name */}
            <div>
              <label htmlFor="name" className="mb-2 text-sm text-custom-text-200">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Template name is required",
                  maxLength: {
                    value: 255,
                    message: "Template name cannot exceed 255 characters",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder="e.g., Bug Report Template"
                    hasError={!!errors.name}
                    className="w-full"
                  />
                )}
              />
              {errors.name && <span className="mt-1 text-xs text-red-500">{errors.name.message}</span>}
            </div>

            {/* Template Description */}
            <div>
              <label htmlFor="description" className="mb-2 text-sm text-custom-text-200">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    id="description"
                    placeholder="Describe when and how to use this template..."
                    className="w-full min-h-[80px]"
                  />
                )}
              />
            </div>

            {/* Default Title Format */}
            <div>
              <label htmlFor="properties.name" className="mb-2 text-sm text-custom-text-200">
                Default Title Format
              </label>
              <Controller
                name="properties.name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="properties.name"
                    placeholder="e.g., [BUG] Issue title"
                    className="w-full"
                  />
                )}
              />
              <p className="mt-1 text-xs text-custom-text-300">
                This will be used as the default title when creating a work item from this template
              </p>
            </div>

            {/* Default Description */}
            <div>
              <label htmlFor="properties.description_html" className="mb-2 text-sm text-custom-text-200">
                Default Description
              </label>
              <Controller
                name="properties.description_html"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    id="properties.description_html"
                    placeholder="Enter default description content..."
                    className="w-full min-h-[120px]"
                  />
                )}
              />
              <p className="mt-1 text-xs text-custom-text-300">
                This content will be pre-filled in the description when using this template
              </p>
            </div>
          </div>

          <Dialog.Actions>
            <Button variant="neutral-primary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {templateToEdit ? "Update Template" : "Create Template"}
            </Button>
          </Dialog.Actions>
        </Dialog.Panel>
      </form>
    </Dialog>
  );
});
