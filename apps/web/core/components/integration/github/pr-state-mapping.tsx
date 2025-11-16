"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2, Info } from "lucide-react";
import { Button, CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
import { IGithubPRStateMapping } from "@/services/integrations/github.service";

interface IPRStateMappingProps {
  workspaceSlug: string;
  projectId: string;
  mappings: IGithubPRStateMapping[];
  projectStates: any[];
  repositories: any[];
  onCreateMapping: (data: any) => Promise<void>;
  onUpdateMapping: (mappingId: string, data: any) => Promise<void>;
  onDeleteMapping: (mappingId: string) => Promise<void>;
}

const PR_STATES = [
  { key: "pr_draft_state", label: "Draft PR Created", description: "When PR is created as draft" },
  { key: "pr_opened_state", label: "PR Opened", description: "When PR is opened or ready for review" },
  { key: "pr_review_requested_state", label: "Review Requested", description: "When review is requested" },
  { key: "pr_approved_state", label: "PR Approved", description: "When PR is approved" },
  { key: "pr_merged_state", label: "PR Merged", description: "When PR is merged" },
  { key: "pr_closed_state", label: "PR Closed", description: "When PR is closed without merging" },
];

export const GithubPRStateMapping: React.FC<IPRStateMappingProps> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    mappings,
    projectStates,
    repositories,
    onCreateMapping,
    onUpdateMapping,
    onDeleteMapping,
  } = props;

  const [showInfo, setShowInfo] = useState(false);

  const handleUpdateState = async (mappingId: string, stateKey: string, stateId: string) => {
    try {
      await onUpdateMapping(mappingId, { [stateKey]: stateId });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "PR state mapping updated successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to update PR state mapping",
      });
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm("Are you sure you want to delete this PR state mapping?")) return;

    try {
      await onDeleteMapping(mappingId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "PR state mapping deleted successfully",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete PR state mapping",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Pull Request State Automation</h3>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-custom-text-300 hover:text-custom-text-200"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-custom-text-300">
            Automatically update Plane issue states based on PR lifecycle events
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          prependIcon={<Plus />}
          onClick={() => console.log("Create PR mapping")}
        >
          Add Mapping
        </Button>
      </div>

      {showInfo && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 text-sm">
          <h4 className="font-medium text-blue-500 mb-2">How PR Automation Works</h4>
          <ul className="space-y-2 text-custom-text-300">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                <strong>With brackets [WEB-344]:</strong> PR title/description references with brackets trigger
                state automation
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                <strong>Without brackets WEB-344:</strong> Issues are linked but states don't update automatically
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>
                <strong>Example:</strong> PR title "[WEB-344] Add feature" will update WEB-344's state when PR
                status changes
              </span>
            </li>
          </ul>
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-8 text-center">
          <p className="text-sm text-custom-text-300">
            No PR state mappings configured yet. Click "Add Mapping" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mappings.map((mapping) => (
            <div
              key={mapping.id}
              className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">
                  {mapping.repository_detail
                    ? `${mapping.repository_detail.owner}/${mapping.repository_detail.name}`
                    : "Repository"}
                </h4>
                <Button
                  variant="danger"
                  size="sm"
                  prependIcon={<Trash2 className="h-3 w-3" />}
                  onClick={() => handleDeleteMapping(mapping.id)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {PR_STATES.map((prState) => {
                  const stateKey = prState.key as keyof IGithubPRStateMapping;
                  const detailKey = `${prState.key}_detail` as keyof IGithubPRStateMapping;
                  const currentState = mapping[stateKey];
                  const currentStateDetail = mapping[detailKey] as
                    | { id: string; name: string; color: string }
                    | null
                    | undefined;

                  return (
                    <div key={prState.key}>
                      <label className="text-xs text-custom-text-300">{prState.label}</label>
                      <p className="text-xs text-custom-text-400 mb-1">{prState.description}</p>
                      <CustomSelect
                        value={currentState as string || ""}
                        onChange={(value: string) => handleUpdateState(mapping.id, prState.key, value)}
                        label={currentStateDetail?.name || "Select state"}
                        buttonClassName="w-full"
                        input
                        optionsClassName="w-full"
                      >
                        <CustomSelect.Option value="">
                          <span className="text-custom-text-400">No automation</span>
                        </CustomSelect.Option>
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
