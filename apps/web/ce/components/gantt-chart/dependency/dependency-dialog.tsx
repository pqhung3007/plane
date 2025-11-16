import { FC, useContext } from "react";
import { observer } from "mobx-react";
import { X } from "lucide-react";
// lib
import { StoreContext } from "@/lib/store-context";
// plane-web
import type { TIssueRelationTypes } from "@/plane-web/types";

type Props = {
  sourceId: string;
  targetId: string;
  relationType: TIssueRelationTypes;
  onClose: () => void;
};

const RELATION_LABELS: Record<TIssueRelationTypes, (source: string, target: string) => string> = {
  blocking: (source, target) => `${source} is blocking ${target}`,
  blocked_by: (source, target) => `${source} is blocked by ${target}`,
  starts_before: (source, target) => `${source} starts before ${target}`,
  starts_after: (source, target) => `${source} starts after ${target}`,
  finishes_before: (source, target) => `${source} finishes before ${target}`,
  finishes_after: (source, target) => `${source} finishes after ${target}`,
  relates_to: (source, target) => `${source} relates to ${target}`,
  duplicate: (source, target) => `${source} is a duplicate of ${target}`,
};

const RELATION_TYPE_LABELS: Record<string, string> = {
  blocking: "Finish-to-Start",
  blocked_by: "Finish-to-Start",
  starts_before: "Start-to-Start",
  starts_after: "Start-to-Start",
  finishes_before: "Finish-to-Finish",
  finishes_after: "Finish-to-Finish",
  relates_to: "Related",
  duplicate: "Duplicate",
};

export const DependencyDialog: FC<Props> = observer(({ sourceId, targetId, relationType, onClose }) => {
  const context = useContext(StoreContext);

  if (!context) return null;

  const issueStore = context.issue.issues;
  const sourceIssue = issueStore.getIssueById(sourceId);
  const targetIssue = issueStore.getIssueById(targetId);

  if (!sourceIssue || !targetIssue) return null;

  const relationLabel = RELATION_LABELS[relationType]?.(
    sourceIssue.name,
    targetIssue.name
  ) || "Unknown relation";

  const typeLabel = RELATION_TYPE_LABELS[relationType] || "Unknown type";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-custom-background-100 rounded-lg shadow-lg p-4 min-w-[400px] max-w-[600px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-custom-text-100">Task Dependency</h3>
            <p className="text-xs text-custom-text-300 mt-1">{typeLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-custom-text-300 hover:text-custom-text-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-custom-primary-100" />
            <p className="text-sm text-custom-text-200">{relationLabel}</p>
          </div>

          <div className="border-t border-custom-border-200 pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-custom-text-400 mb-1">Source Task</p>
                <p className="text-sm font-medium text-custom-text-100 truncate">{sourceIssue.name}</p>
                <p className="text-xs text-custom-text-300 mt-1">
                  {sourceIssue.start_date && sourceIssue.target_date
                    ? `${new Date(sourceIssue.start_date).toLocaleDateString()} - ${new Date(sourceIssue.target_date).toLocaleDateString()}`
                    : "No dates set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-custom-text-400 mb-1">Target Task</p>
                <p className="text-sm font-medium text-custom-text-100 truncate">{targetIssue.name}</p>
                <p className="text-xs text-custom-text-300 mt-1">
                  {targetIssue.start_date && targetIssue.target_date
                    ? `${new Date(targetIssue.start_date).toLocaleDateString()} - ${new Date(targetIssue.target_date).toLocaleDateString()}`
                    : "No dates set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
