"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { Button, CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
import { Dialog, Transition } from "@headlessui/react";
import { IGithubRepositorySync } from "@/services/integrations/github.service";

interface IRepositorySyncProps {
  workspaceSlug: string;
  projectId: string;
  syncs: IGithubRepositorySync[];
  projectStates: any[];
  availableProjects?: any[]; // List of projects in workspace
  availableRepositories?: any[]; // List of GitHub repositories from the integration
  onCreateSync: (data: any) => Promise<void>;
  onUpdateSync: (syncId: string, data: any) => Promise<void>;
  onDeleteSync: (syncId: string) => Promise<void>;
}

interface ICreateSyncForm {
  project_id: string;
  repository: {
    name: string;
    owner: string;
    repository_id: number;
    url: string;
  } | null;
  sync_direction: "unidirectional" | "bidirectional";
  github_open_state: string;
  github_closed_state: string;
}

export const GithubRepositorySync: React.FC<IRepositorySyncProps> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    syncs,
    projectStates,
    availableProjects = [],
    availableRepositories = [],
    onCreateSync,
    onUpdateSync,
    onDeleteSync,
  } = props;

  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ICreateSyncForm>({
    project_id: projectId || "",
    repository: null,
    sync_direction: "unidirectional",
    github_open_state: "",
    github_closed_state: "",
  });

  const handleCreateSync = () => {
    setFormData({
      project_id: projectId || "",
      repository: null,
      sync_direction: "unidirectional",
      github_open_state: "",
      github_closed_state: "",
    });
    setIsCreating(true);
  };

  const handleCloseModal = () => {
    setIsCreating(false);
    setFormData({
      project_id: projectId || "",
      repository: null,
      sync_direction: "unidirectional",
      github_open_state: "",
      github_closed_state: "",
    });
  };

  const handleSubmitCreate = async () => {
    // Validation
    if (!formData.project_id) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select a Plane project",
      });
      return;
    }

    if (!formData.repository) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select a GitHub repository",
      });
      return;
    }

    if (!formData.github_open_state || !formData.github_closed_state) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please configure both issue open and closed states",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateSync({
        repository: formData.repository,
        sync_direction: formData.sync_direction,
        github_open_state: formData.github_open_state,
        github_closed_state: formData.github_closed_state,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Repository sync created successfully",
      });

      handleCloseModal();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to create repository sync",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const selectedProject = availableProjects.find((p) => p.id === formData.project_id);
  const projectSpecificStates = projectStates.filter((state) => state.project === formData.project_id);

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

      {/* Create Sync Modal */}
      <Transition show={isCreating} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={handleCloseModal}>
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
                  <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-4">
                    <Dialog.Title as="h3" className="text-lg font-medium">
                      Link GitHub Repository to a Plane Project
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-custom-text-300 hover:text-custom-text-200"
                      onClick={handleCloseModal}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-5 p-5">
                    {/* Project Selection */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Plane Project <span className="text-red-500">*</span>
                      </label>
                      <CustomSelect
                        value={formData.project_id}
                        onChange={(value: string) => setFormData({ ...formData, project_id: value })}
                        label={selectedProject?.name || "Select project"}
                        buttonClassName="w-full"
                        input
                        optionsClassName="w-full"
                      >
                        {availableProjects.map((project) => (
                          <CustomSelect.Option key={project.id} value={project.id}>
                            {project.name}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                      <p className="mt-1 text-xs text-custom-text-300">
                        Select the Plane project to sync with GitHub
                      </p>
                    </div>

                    {/* Repository Selection */}
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        GitHub Repository <span className="text-red-500">*</span>
                      </label>
                      <CustomSelect
                        value={formData.repository?.repository_id?.toString() || ""}
                        onChange={(value: string) => {
                          const repo = availableRepositories.find((r) => r.id.toString() === value);
                          if (repo) {
                            setFormData({
                              ...formData,
                              repository: {
                                name: repo.name,
                                owner: repo.owner.login,
                                repository_id: repo.id,
                                url: repo.html_url,
                              },
                            });
                          }
                        }}
                        label={
                          formData.repository
                            ? `${formData.repository.owner}/${formData.repository.name}`
                            : "Select repository"
                        }
                        buttonClassName="w-full"
                        input
                        optionsClassName="w-full"
                      >
                        {availableRepositories.map((repo) => (
                          <CustomSelect.Option key={repo.id} value={repo.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span className="text-custom-text-300">{repo.owner.login}/</span>
                              <span>{repo.name}</span>
                            </div>
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                      <p className="mt-1 text-xs text-custom-text-300">
                        Select the GitHub repository to sync issues from
                      </p>
                    </div>

                    {/* Issue Sync State Configuration */}
                    <div className="rounded-lg border border-custom-border-200 p-4">
                      <h4 className="mb-3 text-sm font-medium">Issue Sync State</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-2 block text-xs text-custom-text-300">
                            When GitHub issue is opened <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            value={formData.github_open_state}
                            onChange={(value: string) =>
                              setFormData({ ...formData, github_open_state: value })
                            }
                            label={
                              projectSpecificStates.find((s) => s.id === formData.github_open_state)?.name ||
                              "Select state"
                            }
                            buttonClassName="w-full"
                            input
                            optionsClassName="w-full"
                            disabled={!formData.project_id}
                          >
                            {projectSpecificStates.map((state) => (
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
                          <label className="mb-2 block text-xs text-custom-text-300">
                            When GitHub issue is closed <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            value={formData.github_closed_state}
                            onChange={(value: string) =>
                              setFormData({ ...formData, github_closed_state: value })
                            }
                            label={
                              projectSpecificStates.find((s) => s.id === formData.github_closed_state)?.name ||
                              "Select state"
                            }
                            buttonClassName="w-full"
                            input
                            optionsClassName="w-full"
                            disabled={!formData.project_id}
                          >
                            {projectSpecificStates.map((state) => (
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
                    </div>

                    {/* Sync Direction */}
                    <div className="rounded-lg border border-custom-border-200 p-4">
                      <h4 className="mb-3 text-sm font-medium">Issue Sync Direction</h4>
                      <div className="space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-custom-border-200 p-3 hover:bg-custom-background-80">
                          <input
                            type="radio"
                            name="sync_direction"
                            value="bidirectional"
                            checked={formData.sync_direction === "bidirectional"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sync_direction: e.target.value as "bidirectional",
                              })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="font-medium">Bidirectional</div>
                            <div className="text-xs text-custom-text-300">
                              Sync issues and comments both ways between GitHub and Plane
                            </div>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-custom-border-200 p-3 hover:bg-custom-background-80">
                          <input
                            type="radio"
                            name="sync_direction"
                            value="unidirectional"
                            checked={formData.sync_direction === "unidirectional"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sync_direction: e.target.value as "unidirectional",
                              })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="font-medium">Unidirectional</div>
                            <div className="text-xs text-custom-text-300">
                              Sync issues and comments from GitHub to Plane only
                            </div>
                            {formData.sync_direction === "unidirectional" && (
                              <div className="mt-2 flex items-start gap-2 rounded bg-amber-500/10 p-2 text-xs text-amber-500">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  Data from GitHub Issue will replace data in Linked Plane Work Item (GitHub → Plane
                                  only)
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
                    <Button variant="neutral-primary" size="sm" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitCreate}
                      loading={isSubmitting}
                      disabled={
                        !formData.project_id ||
                        !formData.repository ||
                        !formData.github_open_state ||
                        !formData.github_closed_state
                      }
                    >
                      {isSubmitting ? "Creating..." : "Start Sync"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Existing Syncs List */}
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
