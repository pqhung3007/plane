"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectState, TProjectStateGroups } from "@plane/types";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  workspaceSlug: string;
  state: IProjectState | null;
  onClose: () => void;
};

const STATE_GROUPS: { value: TProjectStateGroups; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "planning", label: "Planning" },
  { value: "execution", label: "Execution" },
  { value: "monitoring", label: "Monitoring" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATE_COLORS = [
  "#6b7280", // gray
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#22c55e", // green
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const ProjectStateForm = ({ workspaceSlug, state, onClose }: Props) => {
  const [name, setName] = useState(state?.name || "");
  const [description, setDescription] = useState(state?.description || "");
  const [color, setColor] = useState(state?.color || STATE_COLORS[0]);
  const [group, setGroup] = useState<TProjectStateGroups>(state?.group || "draft");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createProjectState, updateProjectState } = useProjectState();

  useEffect(() => {
    if (state) {
      setName(state.name);
      setDescription(state.description);
      setColor(state.color);
      setGroup(state.group);
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please enter a name for the project state.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        color,
        group,
        workspace: workspaceSlug,
      };

      if (state) {
        await updateProjectState(workspaceSlug, state.id, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project state updated successfully.",
        });
      } else {
        await createProjectState(workspaceSlug, data);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project state created successfully.",
        });
      }
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error || "Failed to save project state. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-base font-medium">{state ? "Edit" : "Create"} Project State</h5>
        <button
          onClick={onClose}
          className="text-custom-text-400 hover:text-custom-text-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-custom-text-200 mb-2 block">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Planning"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-custom-text-200 mb-2 block">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this state"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-custom-text-200 mb-2 block">
            Group <span className="text-red-500">*</span>
          </label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as TProjectStateGroups)}
            className="w-full rounded-md border border-custom-border-200 bg-custom-background-90 px-3 py-2 text-sm outline-none"
            required
          >
            {STATE_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-custom-text-200 mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {STATE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-md border-2 ${
                  color === c ? "border-custom-border-400" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {state ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
};
