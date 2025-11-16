"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button, Input, TextArea, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
import { IProjectTemplate, IProjectTemplateStateConfig, IProjectTemplateLabelConfig, IProjectTemplateWorkItemConfig } from "@plane/types";
import { useProject } from "@/hooks/store";
import { useParams } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  template?: IProjectTemplate;
};

enum ETemplateCreationSteps {
  BASIC_INFO = "BASIC_INFO",
  FEATURES = "FEATURES",
  STATES = "STATES",
  LABELS = "LABELS",
  WORK_ITEMS = "WORK_ITEMS",
}

const STEP_LABELS = {
  [ETemplateCreationSteps.BASIC_INFO]: "Basic Information",
  [ETemplateCreationSteps.FEATURES]: "Features",
  [ETemplateCreationSteps.STATES]: "States",
  [ETemplateCreationSteps.LABELS]: "Labels",
  [ETemplateCreationSteps.WORK_ITEMS]: "Work Items",
};

type FormData = {
  name: string;
  description: string;
  network: number;
  // Features
  module_view: boolean;
  cycle_view: boolean;
  issue_views_view: boolean;
  page_view: boolean;
  intake_view: boolean;
  is_issue_type_enabled: boolean;
  is_time_tracking_enabled: boolean;
  // States
  include_states: boolean;
  states_config: IProjectTemplateStateConfig[];
  // Labels
  include_labels: boolean;
  labels_config: IProjectTemplateLabelConfig[];
  // Work Items
  include_work_items: boolean;
  work_items_config: IProjectTemplateWorkItemConfig[];
};

const DEFAULT_STATES: IProjectTemplateStateConfig[] = [
  { name: "Backlog", color: "#60646C", sequence: 15000, group: "backlog", default: true },
  { name: "Todo", color: "#60646C", sequence: 25000, group: "unstarted" },
  { name: "In Progress", color: "#F59E0B", sequence: 35000, group: "started" },
  { name: "Done", color: "#46A758", sequence: 45000, group: "completed" },
  { name: "Cancelled", color: "#9AA4BC", sequence: 55000, group: "cancelled" },
];

export const CreateProjectTemplateModal = observer(({ isOpen, onClose, onSuccess, template }: Props) => {
  const { workspaceSlug } = useParams();
  const { template: templateStore } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<ETemplateCreationSteps>(ETemplateCreationSteps.BASIC_INFO);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: template ? {
      name: template.name,
      description: template.description || "",
      network: template.network,
      module_view: template.module_view,
      cycle_view: template.cycle_view,
      issue_views_view: template.issue_views_view,
      page_view: template.page_view,
      intake_view: template.intake_view,
      is_issue_type_enabled: template.is_issue_type_enabled,
      is_time_tracking_enabled: template.is_time_tracking_enabled,
      include_states: template.include_states,
      states_config: template.states_config || [],
      include_labels: template.include_labels,
      labels_config: template.labels_config || [],
      include_work_items: template.include_work_items,
      work_items_config: template.work_items_config || [],
    } : {
      name: "",
      description: "",
      network: 2,
      module_view: false,
      cycle_view: false,
      issue_views_view: false,
      page_view: true,
      intake_view: false,
      is_issue_type_enabled: false,
      is_time_tracking_enabled: false,
      include_states: false,
      states_config: [],
      include_labels: false,
      labels_config: [],
      include_work_items: false,
      work_items_config: [],
    },
  });

  const includeStates = watch("include_states");
  const includeLabels = watch("include_labels");
  const includeWorkItems = watch("include_work_items");
  const statesConfig = watch("states_config");
  const labelsConfig = watch("labels_config");
  const workItemsConfig = watch("work_items_config");

  const handleClose = () => {
    reset();
    setCurrentStep(ETemplateCreationSteps.BASIC_INFO);
    onClose();
  };

  const handleNext = () => {
    const steps = Object.values(ETemplateCreationSteps);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps = Object.values(ETemplateCreationSteps);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!workspaceSlug) return;

    setIsSubmitting(true);
    try {
      if (template) {
        await templateStore.updateProjectTemplate(workspaceSlug.toString(), template.id, data as Partial<IProjectTemplate>);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Template updated successfully",
        });
      } else {
        await templateStore.createProjectTemplate(workspaceSlug.toString(), data as Partial<IProjectTemplate>);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "Template created successfully",
        });
      }

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to save template:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to save template",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add default states when include_states is enabled
  const handleIncludeStatesToggle = (checked: boolean) => {
    setValue("include_states", checked);
    if (checked && statesConfig.length === 0) {
      setValue("states_config", DEFAULT_STATES);
    }
  };

  const addState = () => {
    setValue("states_config", [...statesConfig, { name: "", color: "#60646C", sequence: (statesConfig.length + 1) * 10000, group: "unstarted" }]);
  };

  const removeState = (index: number) => {
    setValue("states_config", statesConfig.filter((_, i) => i !== index));
  };

  const updateState = (index: number, field: keyof IProjectTemplateStateConfig, value: any) => {
    const updated = [...statesConfig];
    updated[index] = { ...updated[index], [field]: value };
    setValue("states_config", updated);
  };

  const addLabel = () => {
    setValue("labels_config", [...labelsConfig, { name: "", color: "#6b7280" }]);
  };

  const removeLabel = (index: number) => {
    setValue("labels_config", labelsConfig.filter((_, i) => i !== index));
  };

  const updateLabel = (index: number, field: keyof IProjectTemplateLabelConfig, value: any) => {
    const updated = [...labelsConfig];
    updated[index] = { ...updated[index], [field]: value };
    setValue("labels_config", updated);
  };

  const addWorkItem = () => {
    setValue("work_items_config", [...workItemsConfig, { name: "", description: "" }]);
  };

  const removeWorkItem = (index: number) => {
    setValue("work_items_config", workItemsConfig.filter((_, i) => i !== index));
  };

  const updateWorkItem = (index: number, field: keyof IProjectTemplateWorkItemConfig, value: any) => {
    const updated = [...workItemsConfig];
    updated[index] = { ...updated[index], [field]: value };
    setValue("work_items_config", updated);
  };

  const isFirstStep = currentStep === ETemplateCreationSteps.BASIC_INFO;
  const isLastStep = currentStep === ETemplateCreationSteps.WORK_ITEMS;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium text-custom-text-100">
                        {template ? "Edit Project Template" : "Create Project Template"}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-custom-text-400">
                        Step {Object.values(ETemplateCreationSteps).indexOf(currentStep) + 1} of{" "}
                        {Object.values(ETemplateCreationSteps).length}: {STEP_LABELS[currentStep]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-custom-text-400 hover:text-custom-text-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  <div className="px-5 py-3 border-b border-custom-border-200">
                    <div className="flex justify-between">
                      {Object.values(ETemplateCreationSteps).map((step, index) => (
                        <div
                          key={step}
                          className={`flex-1 ${index > 0 ? "ml-2" : ""}`}
                        >
                          <div
                            className={`h-1 rounded-full transition-colors ${
                              Object.values(ETemplateCreationSteps).indexOf(currentStep) >= index
                                ? "bg-custom-primary"
                                : "bg-custom-border-200"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-6 max-h-[60vh] overflow-y-auto">
                    {/* Step 1: Basic Info */}
                    {currentStep === ETemplateCreationSteps.BASIC_INFO && (
                      <div className="space-y-4">
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
                                className="min-h-[120px]"
                              />
                            )}
                          />
                        </div>

                        <div>
                          <label htmlFor="network" className="block text-sm font-medium text-custom-text-200 mb-2">
                            Default Visibility
                          </label>
                          <Controller
                            control={control}
                            name="network"
                            render={({ field: { value, onChange } }) => (
                              <select
                                id="network"
                                value={value}
                                onChange={onChange}
                                className="w-full px-3 py-2 text-sm border border-custom-border-200 rounded-md bg-custom-background-100 text-custom-text-100 focus:outline-none focus:ring-2 focus:ring-custom-primary"
                              >
                                <option value={2}>Public</option>
                                <option value={0}>Secret</option>
                              </select>
                            )}
                          />
                          <p className="mt-1 text-xs text-custom-text-400">
                            Projects created from this template will use this visibility setting by default
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Features */}
                    {currentStep === ETemplateCreationSteps.FEATURES && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-custom-text-200 mb-4">
                            Project Features
                          </h4>
                          <p className="text-xs text-custom-text-400 mb-4">
                            Select which features should be enabled in projects created from this template
                          </p>
                          <div className="space-y-4">
                            <Controller
                              control={control}
                              name="cycle_view"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3 border-b border-custom-border-200">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Cycles</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Timebox work as you see fit per project
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                            <Controller
                              control={control}
                              name="module_view"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3 border-b border-custom-border-200">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Modules</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Group work into sub-project-like setups
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                            <Controller
                              control={control}
                              name="issue_views_view"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3 border-b border-custom-border-200">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Views</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Save sorts, filters, and display options
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                            <Controller
                              control={control}
                              name="page_view"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3 border-b border-custom-border-200">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Pages</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Create documentation and notes
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                            <Controller
                              control={control}
                              name="intake_view"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3 border-b border-custom-border-200">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Intake</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Consider work items before adding to project
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                            <Controller
                              control={control}
                              name="is_issue_type_enabled"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3 border-b border-custom-border-200">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Issue Types</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Categorize work items by type
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                            <Controller
                              control={control}
                              name="is_time_tracking_enabled"
                              render={({ field: { value, onChange } }) => (
                                <div className="flex items-center justify-between py-3">
                                  <div>
                                    <h5 className="text-sm font-medium text-custom-text-100">Time Tracking</h5>
                                    <p className="text-xs text-custom-text-400 mt-1">
                                      Log time and see timesheets
                                    </p>
                                  </div>
                                  <ToggleSwitch value={value} onChange={onChange} />
                                </div>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: States */}
                    {currentStep === ETemplateCreationSteps.STATES && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-custom-text-200">Custom States</h4>
                            <p className="text-xs text-custom-text-400 mt-1">
                              Define custom workflow states for projects created from this template
                            </p>
                          </div>
                          <ToggleSwitch value={includeStates} onChange={handleIncludeStatesToggle} />
                        </div>

                        {includeStates && (
                          <div className="space-y-3 mt-4">
                            {statesConfig.map((state, index) => (
                              <div key={index} className="flex items-start gap-2 p-3 border border-custom-border-200 rounded-lg">
                                <Input
                                  type="text"
                                  placeholder="State name"
                                  value={state.name}
                                  onChange={(e) => updateState(index, "name", e.target.value)}
                                  className="flex-1"
                                />
                                <input
                                  type="color"
                                  value={state.color}
                                  onChange={(e) => updateState(index, "color", e.target.value)}
                                  className="h-9 w-16 rounded cursor-pointer"
                                />
                                <select
                                  value={state.group}
                                  onChange={(e) => updateState(index, "group", e.target.value)}
                                  className="h-9 px-2 text-sm border border-custom-border-200 rounded-md bg-custom-background-100"
                                >
                                  <option value="backlog">Backlog</option>
                                  <option value="unstarted">Unstarted</option>
                                  <option value="started">Started</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeState(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button variant="neutral-primary" size="sm" onClick={addState}>
                              Add State
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Labels */}
                    {currentStep === ETemplateCreationSteps.LABELS && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-custom-text-200">Labels</h4>
                            <p className="text-xs text-custom-text-400 mt-1">
                              Create default labels for projects from this template
                            </p>
                          </div>
                          <Controller
                            control={control}
                            name="include_labels"
                            render={({ field: { value, onChange } }) => (
                              <ToggleSwitch value={value} onChange={onChange} />
                            )}
                          />
                        </div>

                        {includeLabels && (
                          <div className="space-y-3 mt-4">
                            {labelsConfig.map((label, index) => (
                              <div key={index} className="flex items-start gap-2 p-3 border border-custom-border-200 rounded-lg">
                                <Input
                                  type="text"
                                  placeholder="Label name"
                                  value={label.name}
                                  onChange={(e) => updateLabel(index, "name", e.target.value)}
                                  className="flex-1"
                                />
                                <input
                                  type="color"
                                  value={label.color}
                                  onChange={(e) => updateLabel(index, "color", e.target.value)}
                                  className="h-9 w-16 rounded cursor-pointer"
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeLabel(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button variant="neutral-primary" size="sm" onClick={addLabel}>
                              Add Label
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 5: Work Items */}
                    {currentStep === ETemplateCreationSteps.WORK_ITEMS && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-custom-text-200">Initial Work Items</h4>
                            <p className="text-xs text-custom-text-400 mt-1">
                              Define tasks that will be created automatically
                            </p>
                          </div>
                          <Controller
                            control={control}
                            name="include_work_items"
                            render={({ field: { value, onChange } }) => (
                              <ToggleSwitch value={value} onChange={onChange} />
                            )}
                          />
                        </div>

                        {includeWorkItems && (
                          <div className="space-y-3 mt-4">
                            {workItemsConfig.map((item, index) => (
                              <div key={index} className="flex flex-col gap-2 p-3 border border-custom-border-200 rounded-lg">
                                <Input
                                  type="text"
                                  placeholder="Work item name"
                                  value={item.name}
                                  onChange={(e) => updateWorkItem(index, "name", e.target.value)}
                                />
                                <TextArea
                                  placeholder="Description (optional)"
                                  value={item.description || ""}
                                  onChange={(e) => updateWorkItem(index, "description", e.target.value)}
                                  className="min-h-[60px]"
                                />
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeWorkItem(index)}
                                  className="self-end"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button variant="neutral-primary" size="sm" onClick={addWorkItem}>
                              Add Work Item
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-4 border-t border-custom-border-200">
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={isFirstStep}
                      prependIcon={<ChevronLeft />}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      {!isLastStep ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleNext}
                          appendIcon={<ChevronRight />}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                          {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
                        </Button>
                      )}
                    </div>
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
