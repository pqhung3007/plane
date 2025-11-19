"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { ModalCore, Button, Input, TOAST_TYPE, setToast } from "@plane/ui";
import type { IProjectUpdateFormData, TProjectUpdateStatus } from "@plane/types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const statusOptions: { value: TProjectUpdateStatus; label: string; icon: any; color: string }[] = [
  {
    value: "on_track",
    label: "🚀 On Track",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    value: "at_risk",
    label: "⚠️ At Risk",
    icon: AlertCircle,
    color: "text-yellow-600",
  },
  {
    value: "off_track",
    label: "❗ Off Track",
    icon: XCircle,
    color: "text-red-600",
  },
];

export const CreateUpdateModal = observer((props: Props) => {
  const { workspaceSlug, projectId, isOpen, onClose, onSuccess } = props;

  const [formData, setFormData] = useState<IProjectUpdateFormData>({
    status: "on_track",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Please enter an update message",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Import the service dynamically to avoid circular dependencies
      const { ProjectUpdateService } = await import("@/services/project");
      const service = new ProjectUpdateService();

      await service.createProjectUpdate(workspaceSlug, projectId, formData);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Update posted successfully",
      });

      setFormData({ status: "on_track", message: "" });
      onSuccess();
      onClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to post update. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <div className="flex flex-col gap-4 p-6 w-full max-w-2xl">
        <div>
          <h2 className="text-xl font-semibold text-custom-text-100">Post Project Update</h2>
          <p className="text-sm text-custom-text-300 mt-1">
            Share the current status and progress of your project
          </p>
        </div>

        <div className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-custom-text-200 mb-2">
              Project Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: option.value })}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? "border-custom-primary bg-custom-primary/10"
                          : "border-custom-border-200 hover:border-custom-border-300 hover:bg-custom-background-90"
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? "text-custom-primary" : option.color}`} />
                    <span className={`text-sm font-medium ${isSelected ? "text-custom-primary" : "text-custom-text-200"}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-custom-text-200 mb-2">
              Update Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Share what's been accomplished, any blockers, and next steps..."
              rows={6}
              className="w-full px-3 py-2 bg-custom-background-100 border border-custom-border-200 rounded-md text-sm text-custom-text-100 placeholder-custom-text-400 focus:outline-none focus:ring-2 focus:ring-custom-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-custom-text-400 mt-1">
              {formData.message.length} characters
            </p>
          </div>

          {/* Status Descriptions */}
          <div className="bg-custom-background-90 p-4 rounded-lg space-y-2">
            <p className="text-xs font-medium text-custom-text-200">Status Guidelines:</p>
            <ul className="text-xs text-custom-text-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-green-600">🚀</span>
                <span><strong>On Track:</strong> Project is progressing as planned with no significant blockers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <span><strong>At Risk:</strong> Potential issues or dependencies that need attention</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">❗</span>
                <span><strong>Off Track:</strong> Significant blockers preventing progress, immediate action required</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting}>
            Post Update
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
