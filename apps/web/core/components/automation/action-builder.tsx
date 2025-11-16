"use client";

import React from "react";
import { Plus, Trash2, MoveRight } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input, TextArea, CustomSelect } from "@plane/ui";
import type { TAutomationAction, TAutomationActionType } from "@plane/types";

type Props = {
  actions: TAutomationAction[];
  onChange: (actions: TAutomationAction[]) => void;
  stateOptions?: { value: string; label: string }[];
  labelOptions?: { value: string; label: string }[];
  memberOptions?: { value: string; label: string }[];
};

const ACTION_TYPE_OPTIONS: { value: TAutomationActionType; label: string; icon: string }[] = [
  { value: "add_comment", label: "Add comment", icon: "💬" },
  { value: "change_state", label: "Change state", icon: "🔄" },
  { value: "change_priority", label: "Change priority", icon: "⚡" },
  { value: "add_assignee", label: "Add assignee", icon: "👤" },
  { value: "remove_assignee", label: "Remove assignee", icon: "👤" },
  { value: "add_label", label: "Add label", icon: "🏷️" },
  { value: "remove_label", label: "Remove label", icon: "🏷️" },
  { value: "set_start_date", label: "Set start date", icon: "📅" },
  { value: "set_due_date", label: "Set due date", icon: "📅" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

const createEmptyAction = (): TAutomationAction => ({
  type: "add_comment",
  config: { comment: "" },
});

export const ActionBuilder: React.FC<Props> = ({
  actions,
  onChange,
  stateOptions = [],
  labelOptions = [],
  memberOptions = [],
}) => {
  const handleActionTypeChange = (index: number, type: TAutomationActionType) => {
    const newActions = [...actions];
    newActions[index] = {
      type,
      config: getDefaultConfig(type),
    };
    onChange(newActions);
  };

  const handleConfigChange = (index: number, configKey: string, value: any) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      config: {
        ...newActions[index].config,
        [configKey]: value,
      },
    };
    onChange(newActions);
  };

  const handleAddAction = () => {
    onChange([...actions, createEmptyAction()]);
  };

  const handleRemoveAction = (index: number) => {
    if (actions.length === 1) return; // Must have at least one action
    onChange(actions.filter((_, i) => i !== index));
  };

  const getDefaultConfig = (type: TAutomationActionType) => {
    switch (type) {
      case "add_comment":
        return { comment: "" };
      case "change_state":
        return { state_id: "" };
      case "change_priority":
        return { priority: "medium" };
      case "add_assignee":
      case "remove_assignee":
        return { assignee_ids: [] };
      case "add_label":
      case "remove_label":
        return { label_ids: [] };
      case "set_start_date":
        return { start_date: "" };
      case "set_due_date":
        return { due_date: "" };
      default:
        return {};
    }
  };

  const renderActionConfig = (action: TAutomationAction, index: number) => {
    const { type, config } = action;

    switch (type) {
      case "add_comment":
        return (
          <TextArea
            value={(config.comment as string) || ""}
            onChange={(e) => handleConfigChange(index, "comment", e.target.value)}
            placeholder="Enter comment text..."
            className="w-full min-h-[60px]"
          />
        );

      case "change_state":
        return (
          <CustomSelect
            value={config.state_id as string}
            onChange={(value) => handleConfigChange(index, "state_id", value)}
            options={stateOptions}
            label={
              stateOptions.find((o) => o.value === config.state_id)?.label || "Select state"
            }
            buttonClassName="w-full"
          />
        );

      case "change_priority":
        return (
          <CustomSelect
            value={config.priority as string}
            onChange={(value) => handleConfigChange(index, "priority", value)}
            options={PRIORITY_OPTIONS}
            label={
              PRIORITY_OPTIONS.find((o) => o.value === config.priority)?.label || "Select priority"
            }
            buttonClassName="w-full"
          />
        );

      case "add_assignee":
      case "remove_assignee":
        return (
          <CustomSelect
            value={(config.assignee_ids as string[])?.[0] || ""}
            onChange={(value) => handleConfigChange(index, "assignee_ids", [value])}
            options={memberOptions}
            label={
              memberOptions.find((o) => o.value === (config.assignee_ids as string[])?.[0])?.label ||
              "Select assignee"
            }
            buttonClassName="w-full"
          />
        );

      case "add_label":
      case "remove_label":
        return (
          <CustomSelect
            value={(config.label_ids as string[])?.[0] || ""}
            onChange={(value) => handleConfigChange(index, "label_ids", [value])}
            options={labelOptions}
            label={
              labelOptions.find((o) => o.value === (config.label_ids as string[])?.[0])?.label ||
              "Select label"
            }
            buttonClassName="w-full"
          />
        );

      case "set_start_date":
        return (
          <Input
            type="date"
            value={(config.start_date as string) || ""}
            onChange={(e) => handleConfigChange(index, "start_date", e.target.value)}
            className="w-full"
          />
        );

      case "set_due_date":
        return (
          <Input
            type="date"
            value={(config.due_date as string) || ""}
            onChange={(e) => handleConfigChange(index, "due_date", e.target.value)}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-custom-text-300 uppercase">
        Then perform these actions
      </div>

      {actions.map((action, index) => (
        <div
          key={index}
          className="rounded-md border border-custom-border-200 p-4 bg-custom-background-90 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-custom-primary text-white text-xs font-medium">
              {index + 1}
            </span>

            <CustomSelect
              value={action.type}
              onChange={(value) => handleActionTypeChange(index, value as TAutomationActionType)}
              options={ACTION_TYPE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: `${opt.icon} ${opt.label}`,
              }))}
              label={
                ACTION_TYPE_OPTIONS.find((o) => o.value === action.type)
                  ? `${ACTION_TYPE_OPTIONS.find((o) => o.value === action.type)!.icon} ${
                      ACTION_TYPE_OPTIONS.find((o) => o.value === action.type)!.label
                    }`
                  : "Select action"
              }
              buttonClassName="flex-1"
            />

            {actions.length > 1 && (
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={() => handleRemoveAction(index)}
                className="!px-2"
                leadingIcon={Trash2}
              />
            )}
          </div>

          <div>{renderActionConfig(action, index)}</div>

          {index < actions.length - 1 && (
            <div className="flex items-center gap-2 text-xs text-custom-text-400">
              <MoveRight className="h-3 w-3" />
              <span>Then</span>
            </div>
          )}
        </div>
      ))}

      <Button
        variant="neutral-primary"
        size="sm"
        onClick={handleAddAction}
        leadingIcon={Plus}
        className="w-full"
      >
        Add another action
      </Button>
    </div>
  );
};
