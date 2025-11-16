"use client";

import { FC, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input, TOAST_TYPE, setToast, TextArea } from "@plane/ui";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// services
import { IssueTimeLogService, type TTimeLogCreateData } from "@/services/issue/issue_time_log.service";

type TLogWorkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  onSuccess?: () => void;
};

type TFormData = {
  hours: number;
  minutes: number;
  description: string;
  logged_date: string;
  billable: boolean;
};

const issueTimeLogService = new IssueTimeLogService();

export const LogWorkModal: FC<TLogWorkModalProps> = (props) => {
  const { isOpen, onClose, workspaceSlug, projectId, issueId, onSuccess } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TFormData>({
    defaultValues: {
      hours: 0,
      minutes: 0,
      description: "",
      logged_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      billable: false,
    },
  });

  const onSubmit = async (data: TFormData) => {
    try {
      setIsSubmitting(true);

      // Convert hours and minutes to total minutes
      const totalMinutes = (data.hours * 60) + data.minutes;

      if (totalMinutes <= 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Duration must be greater than 0",
        });
        return;
      }

      const payload: TTimeLogCreateData = {
        duration_minutes: totalMinutes,
        logged_date: data.logged_date,
        description: data.description || undefined,
        billable: data.billable,
      };

      await issueTimeLogService.createIssueTimeLog(
        workspaceSlug,
        projectId,
        issueId,
        payload
      );

      reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error logging work:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.message || "Failed to log work",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4 bg-custom-background-100 p-6">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">Log Work</h3>
            <p className="mt-1 text-sm text-custom-text-300">
              Record the time you spent working on this work item
            </p>
          </div>

          <div className="space-y-4">
            {/* Time Duration */}
            <div>
              <label className="mb-2 block text-sm font-medium text-custom-text-200">
                Time Spent <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="hours"
                    rules={{
                      required: "Required",
                      min: { value: 0, message: "Must be >= 0" },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        placeholder="Hours"
                        className="w-full"
                        hasError={!!errors.hours}
                      />
                    )}
                  />
                  {errors.hours && <p className="mt-1 text-xs text-red-500">{errors.hours.message}</p>}
                </div>
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="minutes"
                    rules={{
                      required: "Required",
                      min: { value: 0, message: "Must be >= 0" },
                      max: { value: 59, message: "Must be < 60" },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Minutes"
                        className="w-full"
                        hasError={!!errors.minutes}
                      />
                    )}
                  />
                  {errors.minutes && <p className="mt-1 text-xs text-red-500">{errors.minutes.message}</p>}
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-custom-text-200">
                Date Worked <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="logged_date"
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full"
                    hasError={!!errors.logged_date}
                  />
                )}
              />
              {errors.logged_date && (
                <p className="mt-1 text-xs text-red-500">{errors.logged_date.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-custom-text-200">Description (Optional)</label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextArea {...field} placeholder="What did you work on?" className="w-full" rows={3} />
                )}
              />
            </div>

            {/* Billable Checkbox */}
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="billable"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-custom-border-300"
                  />
                )}
              />
              <label className="text-sm text-custom-text-200">Mark as billable</label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 bg-custom-background-100 p-4">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Logging..." : "Log Work"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
};
