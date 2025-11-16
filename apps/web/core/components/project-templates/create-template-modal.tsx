"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Button, Input, TextArea, TOAST_TYPE, setToast } from "@plane/ui";
import { IProjectTemplate } from "@plane/types";
import { useProject } from "@/hooks/store";
import { useParams } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type FormData = {
  name: string;
  description: string;
  network: number;
};

export const CreateProjectTemplateModal = observer(({ isOpen, onClose, onSuccess }: Props) => {
  const { workspaceSlug } = useParams();
  const { template: templateStore } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      network: 2, // Public by default
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!workspaceSlug) return;

    setIsSubmitting(true);
    try {
      await templateStore.createProjectTemplate(workspaceSlug.toString(), {
        name: data.name,
        description: data.description,
        network: data.network,
        // Default feature flags
        module_view: false,
        cycle_view: false,
        issue_views_view: false,
        page_view: true,
        intake_view: false,
        is_issue_type_enabled: false,
        is_time_tracking_enabled: false,
        // Default content configuration
        include_states: false,
        states_config: [],
        include_labels: false,
        labels_config: [],
        include_issue_types: false,
        issue_types_config: [],
        include_work_items: false,
        work_items_config: [],
      } as Partial<IProjectTemplate>);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: "Template created successfully",
      });

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to create template:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to create template",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as="div">
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
                    <Dialog.Title as="h3" className="text-lg font-medium text-custom-text-100">
                      Create Project Template
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-custom-text-400 hover:text-custom-text-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-custom-text-200 mb-2">
                        Template Name <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        control={control}
                        name="name"
                        rules={{
                          required: "Name is required",
                          maxLength: {
                            value: 255,
                            message: "Name must be less than 255 characters",
                          },
                        }}
                        render={({ field: { value, onChange } }) => (
                          <Input
                            id="name"
                            type="text"
                            value={value}
                            onChange={onChange}
                            placeholder="e.g., Web Development Project"
                            hasError={Boolean(errors.name)}
                          />
                        )}
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-custom-text-200 mb-2">
                        Description
                      </label>
                      <Controller
                        control={control}
                        name="description"
                        render={({ field: { value, onChange } }) => (
                          <TextArea
                            id="description"
                            value={value}
                            onChange={onChange}
                            placeholder="Describe when and how to use this template..."
                            className="min-h-[100px]"
                          />
                        )}
                      />
                    </div>

                    <div className="bg-custom-background-80 rounded-lg p-4">
                      <p className="text-xs text-custom-text-400">
                        After creating the template, you can configure:
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-custom-text-400 list-disc list-inside">
                        <li>Project visibility and lead</li>
                        <li>Optional features (modules, cycles, pages, etc.)</li>
                        <li>Custom states, labels, and issue types</li>
                        <li>Initial work items</li>
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-custom-border-200">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Template"}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
