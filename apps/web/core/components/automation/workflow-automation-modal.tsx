"use client";

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { Input, TextArea, ToggleSwitch } from "@plane/ui";
import type {
  TProjectAutomation,
  TProjectAutomationCreate,
  TAutomationTriggerType,
  TAutomationCondition,
  TAutomationAction,
} from "@plane/types";
// services
import { AutomationService } from "@/services/project/automation.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  automation: TProjectAutomation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const automationService = new AutomationService();

const TRIGGER_OPTIONS: { value: TAutomationTriggerType; label: string }[] = [
  { value: "issue_created", label: "Work item is created" },
  { value: "issue_updated", label: "Work item is updated" },
  { value: "state_changed", label: "State changes" },
  { value: "assignee_changed", label: "Assignee changes" },
  { value: "comment_created", label: "Comment is created" },
];

export const WorkflowAutomationModal = observer(
  ({ workspaceSlug, projectId, automation, isOpen, onClose, onSuccess }: Props) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [triggerType, setTriggerType] = useState<TAutomationTriggerType>("issue_created");

    // Initialize form with automation data if editing
    useEffect(() => {
      if (automation) {
        setName(automation.name);
        setDescription(automation.description || "");
        setIsActive(automation.is_active);
        setTriggerType(automation.trigger_type);
      } else {
        // Reset form for new automation
        setName("");
        setDescription("");
        setIsActive(true);
        setTriggerType("issue_created");
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
          conditions: [],
          actions: [
            {
              type: "add_comment",
              config: {
                comment: "This issue was automatically processed by workflow automation.",
              },
            },
          ],
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
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-custom-text-100">
                        {automation ? "Edit Automation" : "Create Automation"}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="text-custom-text-300 hover:text-custom-text-100"
                        onClick={onClose}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="px-5 py-4 space-y-4">
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
                          className="w-full min-h-[80px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="trigger" className="block text-sm font-medium text-custom-text-200 mb-1">
                          Trigger <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="trigger"
                          value={triggerType}
                          onChange={(e) => setTriggerType(e.target.value as TAutomationTriggerType)}
                          className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 focus:border-custom-primary focus:outline-none"
                        >
                          {TRIGGER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-md bg-custom-background-80">
                        <div>
                          <p className="text-sm font-medium text-custom-text-100">Active</p>
                          <p className="text-xs text-custom-text-300">Enable this automation to run automatically</p>
                        </div>
                        <ToggleSwitch value={isActive} onChange={() => setIsActive(!isActive)} />
                      </div>

                      <div className="rounded-md border border-custom-border-200 p-3 bg-custom-background-80">
                        <p className="text-xs text-custom-text-300">
                          <strong>Note:</strong> This is a simplified automation creation interface. The automation will
                          add a default comment when triggered. For advanced configuration with custom conditions and
                          actions, please use the API or update the automation after creation.
                        </p>
                      </div>
                    </div>

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
