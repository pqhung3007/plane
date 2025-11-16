import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { EModalPosition, EModalWidth, ModalCore, Button, Input, TextArea } from "@plane/ui";
import type { TDashboardCreatePayload } from "@plane/types";
import { useCustomDashboard } from "@/hooks/store/use-custom-dashboard";
import { useProject } from "@/hooks/store/use-project";

type TCreateDashboardModal = {
  workspaceSlug: string;
  isOpen: boolean;
  handleClose: () => void;
};

type TFormData = {
  name: string;
  description: string;
  project_ids: string[];
};

export const CreateDashboardModal: FC<TCreateDashboardModal> = observer((props) => {
  const { workspaceSlug, isOpen, handleClose } = props;
  const router = useRouter();

  // Store hooks
  const { createDashboard } = useCustomDashboard();
  const { workspaceProjectIds } = useProject();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TFormData>({
    defaultValues: {
      name: "",
      description: "",
      project_ids: [],
    },
  });

  const onClose = () => {
    reset();
    setSelectedProjectIds([]);
    handleClose();
  };

  const onSubmit = async (data: TFormData) => {
    if (!workspaceSlug || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: TDashboardCreatePayload = {
        name: data.name,
        description: data.description || undefined,
        project_ids: selectedProjectIds,
      };

      const dashboard = await createDashboard(workspaceSlug, payload);

      onClose();

      // Navigate to the new dashboard
      router.push(`/${workspaceSlug}/dashboards/${dashboard.id}`);
    } catch (error) {
      console.error("Failed to create dashboard:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.LG} position={EModalPosition.CENTER}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5 p-5">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-custom-text-100">Create Dashboard</h3>
            <p className="text-sm text-custom-text-200">
              Create a customizable dashboard to visualize and track project progress
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-custom-text-200">
                Dashboard Name <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: "Dashboard name is required",
                  maxLength: { value: 255, message: "Name must be less than 255 characters" },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="e.g., Project Analytics Dashboard"
                    className="w-full"
                    hasError={Boolean(errors.name)}
                  />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium text-custom-text-200">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    id="description"
                    placeholder="Add a description (optional)"
                    className="w-full min-h-[80px]"
                  />
                )}
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-custom-text-200">
                Select Projects <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-custom-text-300">Choose one or more projects to source data from</p>

              <div className="max-h-48 overflow-y-auto space-y-1 border border-custom-border-200 rounded-md p-2">
                {workspaceProjectIds && workspaceProjectIds.length > 0 ? (
                  workspaceProjectIds.map((projectId) => (
                    <label
                      key={projectId}
                      className="flex items-center gap-2 p-2 rounded hover:bg-custom-background-80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(projectId)}
                        onChange={() => toggleProject(projectId)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-custom-text-200">{projectId}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-custom-text-300 p-2">No projects available</p>
                )}
              </div>

              {selectedProjectIds.length === 0 && (
                <p className="text-xs text-red-500">Please select at least one project</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isSubmitting}
              disabled={selectedProjectIds.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Dashboard"}
            </Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
});
