"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { Input, TextArea } from "@plane/ui";
import type { TProjectAutomation } from "@plane/types";
// services
import { AutomationService } from "@/services/project/automation.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  automation: TProjectAutomation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const automationService = new AutomationService();

export const AutomationEditDialog: React.FC<Props> = ({
  workspaceSlug,
  projectId,
  automation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(automation.name);
  const [description, setDescription] = useState(automation.description || "");

  useEffect(() => {
    setName(automation.name);
    setDescription(automation.description || "");
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
      await automationService.updateAutomation(workspaceSlug, projectId, automation.id, {
        name: name.trim(),
        description: description.trim(),
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Automation updated successfully.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.message || "Failed to update automation.",
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-custom-border-200">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-custom-text-100">
                      Edit Automation
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
                  </div>

                  <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-custom-border-200">
                    <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                      Update automation
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
};
