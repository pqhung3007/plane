"use client";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { Input, TextArea, ToggleSwitch, CustomSelect } from "@plane/ui";
import type {
  TProjectAutomation,
  TProjectAutomationCreate,
  TAutomationTriggerType,
  TAutomationConditionGroup,
  TAutomationAction,
} from "@plane/types";
// services
import { AutomationService } from "@/services/project/automation.service";
import { ProjectStateService } from "@/services/project/project-state.service";
// components
import { ConditionGroupBuilder } from "./condition-group-builder";
import { ActionBuilder } from "./action-builder";

type Props = {
  workspaceSlug: string;
  projectId: string;
  automation: TProjectAutomation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const automationService = new AutomationService();
const stateService = new ProjectStateService();

const TRIGGER_OPTIONS: { value: TAutomationTriggerType; label: string; description: string }[] = [
  {
    value: "issue_created",
    label: "Work item is created",
    description: "Trigger when a new work item is created",
  },
  {
    value: "issue_updated",
    label: "Work item is updated",
    description: "Trigger when any field of a work item is updated",
  },
  {
    value: "state_changed",
    label: "State changes",
    description: "Trigger when work item state changes",
  },
  {
    value: "assignee_changed",
    label: "Assignee changes",
    description: "Trigger when assignees are added or removed",
  },
  {
    value: "comment_created",
    label: "Comment is created",
    description: "Trigger when a new comment is added",
  },
];

const createDefaultConditionGroup = (): TAutomationConditionGroup => ({
  operator: "AND",
  conditions: [
    {
      field: "state",
      operator: "is",
      value: undefined,
    },
  ],
});

const createDefaultActions = (): TAutomationAction[] => [
  {
    type: "add_comment",
    config: {
      comment: "This issue was automatically processed by workflow automation.",
    },
  },
];

export const AdvancedAutomationBuilder = observer(
  ({ workspaceSlug, projectId, automation, isOpen, onClose, onSuccess }: Props) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [triggerType, setTriggerType] = useState<TAutomationTriggerType>("issue_created");
    const [conditionGroup, setConditionGroup] = useState<TAutomationConditionGroup>(createDefaultConditionGroup());
    const [actions, setActions] = useState<TAutomationAction[]>(createDefaultActions());

    // Fetch states for dropdown
    const { data: states } = useSWR(
      workspaceSlug && projectId ? `PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
      workspaceSlug && projectId ? () => stateService.getStates(workspaceSlug, projectId) : null
    );

    const stateOptions =
      states?.map((state) => ({
        value: state.id,
        label: state.name,
      })) || [];

    // Initialize form with automation data if editing
    useEffect(() => {
      if (automation) {
        setName(automation.name);
        setDescription(automation.description || "");
        setIsActive(automation.is_active);
        setTriggerType(automation.trigger_type);

        // Handle conditions - support both simple and complex
        if (Array.isArray(automation.conditions)) {
          // Simple array - convert to group
          setConditionGroup({
            operator: "AND",
            conditions: automation.conditions,
          });
        } else {
          // Already a group
          setConditionGroup(automation.conditions as TAutomationConditionGroup);
        }

        setActions(automation.actions);
      } else {
        // Reset form for new automation
        setName("");
        setDescription("");
        setIsActive(true);
        setTriggerType("issue_created");
        setConditionGroup(createDefaultConditionGroup());
        setActions(createDefaultActions());
      }
    }, [automation]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!workspaceSlug || !projectId) return;
      if (!name.trim()) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Please provide a name for the automation.",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const data: TProjectAutomationCreate = {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
          trigger_type: triggerType,
          trigger_config: {},
          conditions: conditionGroup,
          actions: actions,
          sort_order: 65535,
          project: projectId,
        };

        if (automation) {
          // Update existing automation
          await automationService.updateAutomation(workspaceSlug, projectId, automation.id, {
            name: data.name,
            description: data.description,
            is_active: data.is_active,
            trigger_type: data.trigger_type,
            conditions: data.conditions,
            actions: data.actions,
          });

          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Automation updated successfully.",
          });
        } else {
          // Create new automation
          await automationService.createAutomation(workspaceSlug, projectId, data);

          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Automation created successfully.",
          });
        }

        onSuccess();
        onClose();
      } catch (error: any) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.message || "Failed to save automation.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
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
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
                  <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-custom-primary" />
                        <Dialog.Title as="h3" className="text-lg font-semibold text-custom-text-100">
                          {automation ? "Edit Automation" : "Create Advanced Automation"}
                        </Dialog.Title>
                      </div>
                      <button
                        type="button"
                        className="text-custom-text-300 hover:text-custom-text-100"
                        onClick={onClose}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-custom-text-200">Basic Information</h4>

                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-custom-text-200 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter automation name"
                            className="w-full"
                            autoFocus
                          />
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-custom-text-200 mb-1">
                            Description
                          </label>
                          <TextArea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this automation does"
                            className="w-full min-h-[60px]"
                          />
                        </div>
                      </div>

                      {/* Trigger */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-custom-text-200">Trigger</h4>

                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-custom-primary/10 text-custom-primary text-sm font-medium">
                            IF
                          </span>
                          <div className="flex-1">
                            <CustomSelect
                              value={triggerType}
                              onChange={(value) => setTriggerType(value as TAutomationTriggerType)}
                              options={TRIGGER_OPTIONS}
                              label={TRIGGER_OPTIONS.find((o) => o.value === triggerType)?.label || "Select trigger"}
                              buttonClassName="w-full"
                            />
                            <p className="text-xs text-custom-text-400 mt-1">
                              {TRIGGER_OPTIONS.find((o) => o.value === triggerType)?.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Conditions */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-custom-text-200">Conditions</h4>

                        <ConditionGroupBuilder
                          group={conditionGroup}
                          onChange={setConditionGroup}
                          stateOptions={stateOptions}
                          labelOptions={[]}
                          memberOptions={[]}
                        />
                      </div>

                      {/* Actions */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-custom-text-200">Actions</h4>

                        <ActionBuilder
                          actions={actions}
                          onChange={setActions}
                          stateOptions={stateOptions}
                          labelOptions={[]}
                          memberOptions={[]}
                        />
                      </div>

                      {/* Active Toggle */}
                      <div className="rounded-md border border-custom-border-200 p-4 bg-custom-background-80">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-custom-text-100">Activate automation</p>
                            <p className="text-xs text-custom-text-300 mt-0.5">
                              Enable this automation to run automatically when triggered
                            </p>
                          </div>
                          <ToggleSwitch value={isActive} onChange={() => setIsActive(!isActive)} />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-custom-border-200">
                      <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                        {automation ? "Update automation" : "Create automation"}
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
  }
);
