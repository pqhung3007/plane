"use client";

import React, { useState } from "react";
import { Plus, Trash2, FolderTree } from "lucide-react";
import { Button } from "@plane/propel/button";
import { CustomSelect } from "@plane/ui";
import type {
  TAutomationCondition,
  TAutomationConditionGroup,
  TConditionGroupOperator,
} from "@plane/types";
import { ConditionRow } from "./condition-row";

type Props = {
  group: TAutomationConditionGroup;
  onChange: (group: TAutomationConditionGroup) => void;
  depth?: number;
  stateOptions?: { value: string; label: string }[];
  labelOptions?: { value: string; label: string }[];
  memberOptions?: { value: string; label: string }[];
};

const MAX_DEPTH = 3;

const createEmptyCondition = (): TAutomationCondition => ({
  field: "state",
  operator: "is",
  value: undefined,
});

const createEmptyGroup = (): TAutomationConditionGroup => ({
  operator: "AND",
  conditions: [createEmptyCondition()],
});

export const ConditionGroupBuilder: React.FC<Props> = ({
  group,
  onChange,
  depth = 0,
  stateOptions,
  labelOptions,
  memberOptions,
}) => {
  const handleOperatorChange = (operator: TConditionGroupOperator) => {
    onChange({
      ...group,
      operator,
    });
  };

  const handleConditionChange = (index: number, condition: TAutomationCondition | TAutomationConditionGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = condition;
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const handleAddCondition = () => {
    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyCondition()],
    });
  };

  const handleAddGroup = () => {
    if (depth >= MAX_DEPTH) return;

    onChange({
      ...group,
      conditions: [...group.conditions, createEmptyGroup()],
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (group.conditions.length === 1) return; // Must have at least one condition

    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const isConditionGroup = (item: any): item is TAutomationConditionGroup => {
    return item && typeof item === "object" && "operator" in item && "conditions" in item;
  };

  const indentClass = depth === 0 ? "" : "ml-4 pl-4 border-l-2 border-custom-border-300";

  return (
    <div className={`space-y-3 ${indentClass}`}>
      {/* Group Operator */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-custom-text-300 uppercase">
          {depth === 0 ? "When" : "And"}
        </span>
        <CustomSelect
          value={group.operator}
          onChange={handleOperatorChange}
          options={[
            { value: "AND", label: "ALL of the following are true" },
            { value: "OR", label: "ANY of the following are true" },
          ]}
          label={
            group.operator === "AND"
              ? "ALL of the following are true"
              : "ANY of the following are true"
          }
          buttonClassName="!w-64"
        />
      </div>

      {/* Conditions */}
      <div className="space-y-2">
        {group.conditions.map((condition, index) => (
          <div key={index}>
            {isConditionGroup(condition) ? (
              // Nested group
              <div className="rounded-md border border-custom-border-200 p-3 bg-custom-background-80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-custom-text-200">
                    <FolderTree className="h-3 w-3" />
                    Nested condition group (Level {depth + 2})
                  </div>
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    onClick={() => handleRemoveCondition(index)}
                    className="!px-2"
                    leadingIcon={Trash2}
                  />
                </div>
                <ConditionGroupBuilder
                  group={condition}
                  onChange={(newGroup) => handleConditionChange(index, newGroup)}
                  depth={depth + 1}
                  stateOptions={stateOptions}
                  labelOptions={labelOptions}
                  memberOptions={memberOptions}
                />
              </div>
            ) : (
              // Simple condition
              <ConditionRow
                condition={condition}
                onChange={(newCondition) => handleConditionChange(index, newCondition)}
                onRemove={() => handleRemoveCondition(index)}
                stateOptions={stateOptions}
                labelOptions={labelOptions}
                memberOptions={memberOptions}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="neutral-primary"
          size="sm"
          onClick={handleAddCondition}
          leadingIcon={Plus}
        >
          Add condition
        </Button>

        {depth < MAX_DEPTH && (
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={handleAddGroup}
            leadingIcon={FolderTree}
          >
            Add group
          </Button>
        )}
      </div>
    </div>
  );
};
