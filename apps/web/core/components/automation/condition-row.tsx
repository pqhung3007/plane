"use client";

import React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@plane/propel/button";
import { CustomSelect } from "@plane/ui";
import type { TAutomationCondition, TAutomationConditionField, TAutomationConditionOperator } from "@plane/types";

type Props = {
  condition: TAutomationCondition;
  onChange: (condition: TAutomationCondition) => void;
  onRemove: () => void;
  stateOptions?: { value: string; label: string }[];
  labelOptions?: { value: string; label: string }[];
  memberOptions?: { value: string; label: string }[];
};

const FIELD_OPTIONS: { value: TAutomationConditionField; label: string }[] = [
  { value: "state", label: "State" },
  { value: "priority", label: "Priority" },
  { value: "label", label: "Label" },
  { value: "assignee", label: "Assignee" },
  { value: "created_by", label: "Created by" },
];

const OPERATOR_OPTIONS: { value: TAutomationConditionOperator; label: string }[] = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

export const ConditionRow: React.FC<Props> = ({
  condition,
  onChange,
  onRemove,
  stateOptions = [],
  labelOptions = [],
  memberOptions = [],
}) => {
  const handleFieldChange = (field: TAutomationConditionField) => {
    onChange({
      ...condition,
      field,
      operator: "is",
      value: undefined,
    });
  };

  const handleOperatorChange = (operator: TAutomationConditionOperator) => {
    onChange({
      ...condition,
      operator,
      value: ["is_empty", "is_not_empty"].includes(operator) ? undefined : condition.value,
    });
  };

  const handleValueChange = (value: any) => {
    onChange({
      ...condition,
      value,
    });
  };

  const getValueOptions = () => {
    switch (condition.field) {
      case "state":
        return stateOptions;
      case "priority":
        return PRIORITY_OPTIONS;
      case "label":
        return labelOptions;
      case "assignee":
      case "created_by":
        return memberOptions;
      default:
        return [];
    }
  };

  const showValueInput = !["is_empty", "is_not_empty"].includes(condition.operator);

  return (
    <div className="flex items-center gap-2 p-3 rounded-md bg-custom-background-90 border border-custom-border-200">
      <CustomSelect
        value={condition.field}
        onChange={handleFieldChange}
        options={FIELD_OPTIONS}
        label={FIELD_OPTIONS.find((o) => o.value === condition.field)?.label || "Select field"}
        buttonClassName="!w-32"
      />

      <CustomSelect
        value={condition.operator}
        onChange={handleOperatorChange}
        options={OPERATOR_OPTIONS}
        label={OPERATOR_OPTIONS.find((o) => o.value === condition.operator)?.label || "Select operator"}
        buttonClassName="!w-36"
      />

      {showValueInput && (
        <CustomSelect
          value={condition.value as string}
          onChange={handleValueChange}
          options={getValueOptions()}
          label={
            getValueOptions().find((o) => o.value === condition.value)?.label || "Select value"
          }
          buttonClassName="flex-1"
        />
      )}

      <Button
        variant="neutral-primary"
        size="sm"
        onClick={onRemove}
        className="!px-2"
        leadingIcon={Trash2}
      />
    </div>
  );
};
