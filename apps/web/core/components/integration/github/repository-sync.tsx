"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2, Settings } from "lucide-react";
import { Button, CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
import { IGithubRepositorySync } from "@/services/integrations/github.service";

interface IRepositorySyncProps {
  workspaceSlug: string;
  projectId: string;
  syncs: IGithubRepositorySync[];
  projectStates: any[];
  onCreateSync: (data: any) => Promise<void>;
  onUpdateSync: (syncId: string, data: any) => Promise<void>;
  onDeleteSync: (syncId: string) => Promise<void>;
}

export const GithubRepositorySync: React.FC<IRepositorySyncProps> = observer((props) => {
  const { workspaceSlug, projectId, syncs, projectStates, onCreateSync, onUpdateSync, onDeleteSync } = props;

  const [isCreating, setIsCreating] = useState(false);
  const [editingSyncId, setEditingSyncId] = useState<string | null>(null);

  const handleCreateSync = () => {
    setIsCreating(true);
  };

  const handleUpdateSyncDirection = async (syncId: string, direction: "unidirectional" | "bidirectional") => {
    try {
      await onUpdateSync(syncId, { sync_direction: direction });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Sync direction updated successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update sync direction",
      });
    }
  };

  const handleUpdateState = async (syncId: string, stateType: "open" | "closed", stateId: string) => {
    try {
      const data =
        stateType === "open" ? { github_open_state: stateId } : { github_closed_state: stateId };
      await onUpdateSync(syncId, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "State mapping updated successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update state mapping",
      });
    }
  };

  const handleDeleteSync = async (syncId: string) => {
    if (!confirm("Are you sure you want to delete this repository sync?")) return;

    try {
      await onDeleteSync(syncId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Repository sync deleted successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete repository sync",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Project Issue Sync</h3>
          <p className="text-sm text-custom-text-300">
            Sync GitHub issues with Plane work items for this project
          </p>
        </div>
        <Button variant="primary" size="sm" prependIcon={<Plus />} onClick={handleCreateSync}>
          Add Sync
        </Button>
      </div>

      {syncs.length === 0 ? (
        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-8 text-center">
          <p className="text-sm text-custom-text-300">
            No repository syncs configured yet. Click "Add Sync" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {syncs.map((sync) => (
            <div
              key={sync.id}
              className="flex items-center justify-between rounded-lg border border-custom-border-200 bg-custom-background-100 p-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {sync.repository.owner}/{sync.repository.name}
                  </h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      sync.sync_direction === "bidirectional"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-gray-500/20 text-gray-500"
                    }`}
                  >
                    {sync.sync_direction === "bidirectional" ? "↔ Bidirectional" : "→ Unidirectional"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-custom-text-300">When GitHub issue is opened</label>
                    <CustomSelect
                      value={sync.github_open_state || ""}
                      onChange={(value: string) => handleUpdateState(sync.id, "open", value)}
                      label={sync.github_open_state_detail?.name || "Select state"}
                      buttonClassName="w-full"
                      input
                      optionsClassName="w-full"
                    >
                      {projectStates.map((state) => (
                        <CustomSelect.Option key={state.id} value={state.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: state.color }}
                            />
                            {state.name}
                          </div>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>

                  <div>
                    <label className="text-xs text-custom-text-300">When GitHub issue is closed</label>
                    <CustomSelect
                      value={sync.github_closed_state || ""}
                      onChange={(value: string) => handleUpdateState(sync.id, "closed", value)}
                      label={sync.github_closed_state_detail?.name || "Select state"}
                      buttonClassName="w-full"
                      input
                      optionsClassName="w-full"
                    >
                      {projectStates.map((state) => (
                        <CustomSelect.Option key={state.id} value={state.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: state.color }}
                            />
                            {state.name}
                          </div>
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-custom-text-300">Sync Direction</label>
                  <CustomSelect
                    value={sync.sync_direction}
                    onChange={(value: "unidirectional" | "bidirectional") =>
                      handleUpdateSyncDirection(sync.id, value)
                    }
                    label={sync.sync_direction === "bidirectional" ? "Bidirectional" : "Unidirectional"}
                    buttonClassName="w-full"
                    input
                  >
                    <CustomSelect.Option value="unidirectional">
                      <div className="space-y-1">
                        <div>→ Unidirectional (GitHub → Plane)</div>
                        <div className="text-xs text-custom-text-300">
                          Sync from GitHub to Plane only. Plane changes won't sync back.
                        </div>
                      </div>
                    </CustomSelect.Option>
                    <CustomSelect.Option value="bidirectional">
                      <div className="space-y-1">
                        <div>↔ Bidirectional</div>
                        <div className="text-xs text-custom-text-300">
                          Sync both ways. Changes in either platform will sync to the other.
                        </div>
                      </div>
                    </CustomSelect.Option>
                  </CustomSelect>
                </div>
              </div>

              <Button
                variant="danger"
                size="sm"
                prependIcon={<Trash2 className="h-3 w-3" />}
                onClick={() => handleDeleteSync(sync.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
