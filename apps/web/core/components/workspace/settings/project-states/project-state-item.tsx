"use client";

import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import type { IProjectState } from "@plane/types";

type Props = {
  state: IProjectState;
  onEdit: (state: IProjectState) => void;
  onDelete: (stateId: string) => void;
};

export const ProjectStateItem = ({ state, onEdit, onDelete }: Props) => {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: state.color }}
        />
        <div>
          <p className="text-sm font-medium">{state.name}</p>
          {state.description && (
            <p className="text-xs text-custom-text-400 mt-0.5">{state.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="neutral-primary"
          size="sm"
          onClick={() => onEdit(state)}
          className="!px-2"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="neutral-primary"
          size="sm"
          onClick={() => onDelete(state.id)}
          className="!px-2 text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
