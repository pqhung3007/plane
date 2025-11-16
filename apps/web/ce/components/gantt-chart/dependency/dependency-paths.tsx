import type { FC } from "react";
import { observer } from "mobx-react";
import { useContext, useState, useCallback } from "react";
import type { TIssue } from "@plane/types";
// lib
import { StoreContext } from "@/lib/store-context";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// plane-web
import type { TIssueRelationTypes } from "@/plane-web/types";
// components
import { DependencyDialog } from "./dependency-dialog";

type Props = {
  isEpic?: boolean;
};

type DependencyLine = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isViolated: boolean;
  sourceId: string;
  targetId: string;
  relationType: TIssueRelationTypes;
};

const BLOCK_HEIGHT = 32; // height of gantt block in pixels
const BLOCK_VERTICAL_SPACING = 40; // vertical space between blocks

/**
 * Checks if a dependency is violated based on its type and dates
 */
const isDependencyViolated = (
  relationType: TIssueRelationTypes,
  sourceIssue: TIssue,
  targetIssue: TIssue
): boolean => {
  const sourceStart = sourceIssue.start_date ? new Date(sourceIssue.start_date) : null;
  const sourceEnd = sourceIssue.target_date ? new Date(sourceIssue.target_date) : null;
  const targetStart = targetIssue.start_date ? new Date(targetIssue.start_date) : null;
  const targetEnd = targetIssue.target_date ? new Date(targetIssue.target_date) : null;

  switch (relationType) {
    case "blocking": // Finish-to-Start: target can't start before source finishes
      if (sourceEnd && targetStart) {
        return targetStart < sourceEnd;
      }
      return false;

    case "starts_before": // Start-to-Start: target can't start before source starts
      if (sourceStart && targetStart) {
        return targetStart < sourceStart;
      }
      return false;

    case "finishes_before": // Finish-to-Finish: target can't finish before source finishes
      if (sourceEnd && targetEnd) {
        return targetEnd < sourceEnd;
      }
      return false;

    default:
      return false;
  }
};

/**
 * Calculate the path for connecting two blocks
 */
const calculatePath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  relationType: TIssueRelationTypes
): string => {
  // Determine connection points based on relation type
  const isStartToStart = relationType === "starts_before" || relationType === "starts_after";
  const isFinishToFinish = relationType === "finishes_before" || relationType === "finishes_after";

  // Adjust y-coordinates to center of blocks
  const cy1 = y1 + BLOCK_HEIGHT / 2;
  const cy2 = y2 + BLOCK_HEIGHT / 2;

  // For start-to-start, both connect from left side
  // For finish-to-finish, both connect from right side
  // For blocking (finish-to-start), connect from right to left

  const controlPointOffset = Math.abs(x2 - x1) / 3;

  if (isStartToStart) {
    // Both from left side
    const cpx1 = x1 - controlPointOffset;
    const cpx2 = x2 - controlPointOffset;
    return `M ${x1} ${cy1} C ${cpx1} ${cy1}, ${cpx2} ${cy2}, ${x2} ${cy2}`;
  } else if (isFinishToFinish) {
    // Both from right side
    const cpx1 = x1 + controlPointOffset;
    const cpx2 = x2 + controlPointOffset;
    return `M ${x1} ${cy1} C ${cpx1} ${cy1}, ${cpx2} ${cy2}, ${x2} ${cy2}`;
  } else {
    // Finish-to-start (blocking): from right to left
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${cy1} C ${midX} ${cy1}, ${midX} ${cy2}, ${x2} ${cy2}`;
  }
};

export const TimelineDependencyPaths: FC<Props> = observer((props) => {
  const { isEpic = false } = props;
  const context = useContext(StoreContext);
  const timelineStore = useTimeLineChartStore();
  const [selectedDependency, setSelectedDependency] = useState<{
    sourceId: string;
    targetId: string;
    relationType: TIssueRelationTypes;
  } | null>(null);

  const handlePathClick = useCallback(
    (sourceId: string, targetId: string, relationType: TIssueRelationTypes) => {
      setSelectedDependency({ sourceId, targetId, relationType });
    },
    []
  );

  const handleCloseDialog = useCallback(() => {
    setSelectedDependency(null);
  }, []);

  if (!context || !timelineStore.isDependencyEnabled || !timelineStore.blockIds) {
    return null;
  }

  const issueStore = context.issue.issues;
  const relationStore = context.issueDetail?.relation;

  if (!relationStore) return null;

  const dependencyLines: DependencyLine[] = [];
  const processedPairs = new Set<string>(); // Track processed pairs to avoid duplicates

  // Iterate through all blocks to find their relations
  timelineStore.blockIds.forEach((blockId, index) => {
    const block = timelineStore.getBlockById(blockId);
    if (!block || !block.position || !block.start_date || !block.target_date) return;

    const issue = issueStore.getIssueById(blockId) as TIssue | undefined;
    if (!issue) return;

    const relations = relationStore.getRelationsByIssueId(blockId);
    if (!relations) return;

    // Process each type of relation
    const relationTypes: TIssueRelationTypes[] = [
      "blocking",
      "starts_before",
      "finishes_before",
    ];

    relationTypes.forEach((relationType) => {
      const relatedIssueIds = relations[relationType];
      if (!relatedIssueIds || relatedIssueIds.length === 0) return;

      relatedIssueIds.forEach((relatedIssueId) => {
        // Create a unique key for this pair to avoid duplicates
        const pairKey = [blockId, relatedIssueId].sort().join("-");
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const relatedBlock = timelineStore.getBlockById(relatedIssueId);
        if (!relatedBlock || !relatedBlock.position || !relatedBlock.start_date || !relatedBlock.target_date)
          return;

        const relatedIssue = issueStore.getIssueById(relatedIssueId) as TIssue | undefined;
        if (!relatedIssue) return;

        // Find the index of the related block
        const relatedIndex = timelineStore.blockIds!.indexOf(relatedIssueId);
        if (relatedIndex === -1) return;

        // Calculate connection points based on relation type
        let x1: number, y1: number, x2: number, y2: number;

        if (relationType === "starts_before" || relationType === "starts_after") {
          // Start-to-Start: connect from left edges
          x1 = block.position.marginLeft;
          x2 = relatedBlock.position.marginLeft;
        } else if (relationType === "finishes_before" || relationType === "finishes_after") {
          // Finish-to-Finish: connect from right edges
          x1 = block.position.marginLeft + block.position.width;
          x2 = relatedBlock.position.marginLeft + relatedBlock.position.width;
        } else {
          // Finish-to-Start (blocking): from right to left
          x1 = block.position.marginLeft + block.position.width;
          x2 = relatedBlock.position.marginLeft;
        }

        y1 = index * BLOCK_VERTICAL_SPACING;
        y2 = relatedIndex * BLOCK_VERTICAL_SPACING;

        // Check if dependency is violated
        const violated = isDependencyViolated(relationType, issue, relatedIssue);

        dependencyLines.push({
          id: `${blockId}-${relatedIssueId}-${relationType}`,
          x1,
          y1,
          x2,
          y2,
          isViolated: violated,
          sourceId: blockId,
          targetId: relatedIssueId,
          relationType,
        });
      });
    });
  });

  if (dependencyLines.length === 0) return null;

  return (
    <>
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      >
        {dependencyLines.map((line) => (
          <g key={line.id}>
            <path
              d={calculatePath(line.x1, line.y1, line.x2, line.y2, line.relationType)}
              stroke={line.isViolated ? "#ef4444" : "#6b7280"}
              strokeWidth="2"
              fill="none"
              className="pointer-events-auto cursor-pointer hover:stroke-custom-primary-100 transition-colors"
              onClick={() => handlePathClick(line.sourceId, line.targetId, line.relationType)}
              style={{ pointerEvents: "auto" }}
            />
            {/* Arrow head */}
            <circle cx={line.x2} cy={line.y2 + BLOCK_HEIGHT / 2} r="4" fill={line.isViolated ? "#ef4444" : "#6b7280"} />
          </g>
        ))}
      </svg>
      {selectedDependency && (
        <DependencyDialog
          sourceId={selectedDependency.sourceId}
          targetId={selectedDependency.targetId}
          relationType={selectedDependency.relationType}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
});
