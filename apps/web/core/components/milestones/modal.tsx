"use client";

import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { X } from "lucide-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { DatePicker } from "@plane/propel";
import type { IMilestone } from "@plane/types";
// ui
import { Button, Input, TextArea, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";
// services
import { MilestoneService } from "@/services/milestone.service";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IMilestone | null;
  workspaceSlug: string;
  projectId: string;
  onSuccess?: (milestone: IMilestone) => void;
};

type FormData = {
  name: string;
  description: string;
  target_date: Date | null;
};

const milestoneService = new MilestoneService();

export const MilestoneCreateUpdateModal: React.FC<Props> = (props) => {
  const { isOpen, handleClose, data, workspaceSlug, projectId, onSuccess } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      target_date: data?.target_date ? new Date(data.target_date) : null,
    },
  });

  const handleCreateMilestone = async (payload: Partial<IMilestone>) => {
    if (!workspaceSlug || !projectId) return;

    try {
      const milestone = await milestoneService.createMilestone(workspaceSlug, projectId, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Milestone created successfully.",
      });
      if (onSuccess) onSuccess(milestone);
      handleClose();
      reset();
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.detail ?? "Error in creating milestone. Please try again.",
      });
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, payload: Partial<IMilestone>) => {
    if (!workspaceSlug || !projectId) return;

    try {
      const milestone = await milestoneService.updateMilestone(workspaceSlug, projectId, milestoneId, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Milestone updated successfully.",
      });
      if (onSuccess) onSuccess(milestone);
      handleClose();
      reset();
    } catch (err: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.detail ?? "Error in updating milestone. Please try again.",
      });
    }
  };

  const onSubmit = async (formData: FormData) => {
    if (!workspaceSlug || !projectId) return;

    setIsSubmitting(true);

    const payload: Partial<IMilestone> = {
      name: formData.name,
      description: formData.description,
      target_date: renderFormattedPayloadDate(formData.target_date) ?? null,
    };

    if (data?.id) {
      await handleUpdateMilestone(data.id, payload);
    } else {
      await handleCreateMilestone(payload);
    }

    setIsSubmitting(false);
  };

  const handleModalClose = () => {
    handleClose();
    reset();
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-custom-text-100">
              {data?.id ? "Update" : "Create"} Milestone
            </h3>
            <button
              type="button"
              onClick={handleModalClose}
              className="text-custom-text-300 hover:text-custom-text-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="text-sm font-medium text-custom-text-200 mb-2 block">
                Title <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Title is required",
                  maxLength: {
                    value: 255,
                    message: "Title should be less than 255 characters",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="e.g., Q4 Launch"
                    className="w-full"
                    hasError={!!errors.name}
                  />
                )}
              />
              {errors.name && <span className="text-xs text-red-500 mt-1">{errors.name.message}</span>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="text-sm font-medium text-custom-text-200 mb-2 block">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    id="description"
                    placeholder="Add context about the milestone's purpose and goals..."
                    className="w-full min-h-[100px]"
                  />
                )}
              />
            </div>

            {/* Target Date */}
            <div>
              <label htmlFor="target_date" className="text-sm font-medium text-custom-text-200 mb-2 block">
                Target Date
              </label>
              <Controller
                name="target_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select target date"
                    buttonVariant="outline"
                  />
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-custom-border-200">
            <Button variant="neutral-primary" size="sm" onClick={handleModalClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {data?.id ? "Update" : "Create"} Milestone
            </Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
};
