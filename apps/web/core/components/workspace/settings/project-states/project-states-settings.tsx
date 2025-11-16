"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectState } from "@plane/types";
// components
import { ProjectStateForm } from "./project-state-form";
import { ProjectStateItem } from "./project-state-item";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  workspaceSlug: string;
};

export const ProjectStatesSettings = observer(({ workspaceSlug }: Props) => {
  // states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingState, setEditingState] = useState<IProjectState | null>(null);
  // store hooks
  const { projectStateIds, getProjectStateById, fetchProjectStates, deleteProjectState } = useProjectState();

  useEffect(() => {
    if (workspaceSlug) {
      fetchProjectStates(workspaceSlug).catch((err) => {
        console.error("Error fetching project states:", err);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to fetch project states. Please try again.",
        });
      });
    }
  }, [workspaceSlug, fetchProjectStates]);

  const handleDelete = async (stateId: string) => {
    if (!workspaceSlug) return;

    try {
      await deleteProjectState(workspaceSlug, stateId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Project state deleted successfully.",
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.error || "Failed to delete project state. Please try again.",
      });
    }
  };

  const handleEdit = (state: IProjectState) => {
    setEditingState(state);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingState(null);
  };

  // Group states by their group
  const groupedStates: Record<string, IProjectState[]> = {};
  projectStateIds?.forEach((stateId) => {
    const state = getProjectStateById(stateId);
    if (state) {
      if (!groupedStates[state.group]) {
        groupedStates[state.group] = [];
      }
      groupedStates[state.group].push(state);
    }
  });

  const groupDisplayNames: Record<string, string> = {
    draft: "Draft",
    planning: "Planning",
    execution: "Execution",
    monitoring: "Monitoring",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add State
        </Button>
      </div>

      {isFormOpen && (
        <ProjectStateForm
          workspaceSlug={workspaceSlug}
          state={editingState}
          onClose={handleCloseForm}
        />
      )}

      <div className="space-y-4">
        {Object.entries(groupedStates).map(([group, states]) => (
          <div key={group} className="space-y-2">
            <h5 className="text-sm font-medium text-custom-text-300">{groupDisplayNames[group]}</h5>
            <div className="space-y-2">
              {states
                .sort((a, b) => a.sequence - b.sequence)
                .map((state) => (
                  <ProjectStateItem
                    key={state.id}
                    state={state}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {(!projectStateIds || projectStateIds.length === 0) && !isFormOpen && (
        <div className="text-center py-12">
          <p className="text-custom-text-400">No project states found. Add one to get started.</p>
        </div>
      )}
    </div>
  );
});
