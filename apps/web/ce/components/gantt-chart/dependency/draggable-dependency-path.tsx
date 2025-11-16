import { useContext, useEffect, useState, useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useToast } from "@plane/ui";
// lib
import { StoreContext } from "@/lib/store-context";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// plane-web
import type { TIssueRelationTypes } from "@/plane-web/types";

type DragState = {
  sourceBlockId: string;
  sourceHandle: "left" | "right";
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

const BLOCK_HEIGHT = 32;
const BLOCK_VERTICAL_SPACING = 40;

export const TimelineDraggablePath = observer(() => {
  const context = useContext(StoreContext);
  const timelineStore = useTimeLineChartStore();
  const { setToastAlert } = useToast();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const ganttContainerRef = useRef<HTMLDivElement | null>(null);

  // Get gantt container reference
  useEffect(() => {
    ganttContainerRef.current = document.getElementById("gantt-container") as HTMLDivElement;
  }, []);

  const handleDragStart = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const { blockId, handle, x, y } = customEvent.detail;

    setDragState({
      sourceBlockId: blockId,
      sourceHandle: handle,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  }, []);

  const handleDragMove = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const { x, y } = customEvent.detail;

    setDragState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentX: x,
        currentY: y,
      };
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: Event) => {
      if (!context || !dragState || !timelineStore.blockIds) {
        setDragState(null);
        return;
      }

      const customEvent = event as CustomEvent;
      const { x: endX, y: endY } = customEvent.detail;

      // Find which block the drag ended on
      let targetBlockId: string | null = null;
      let targetHandle: "left" | "right" | null = null;

      for (let i = 0; i < timelineStore.blockIds.length; i++) {
        const blockId = timelineStore.blockIds[i];
        const block = timelineStore.getBlockById(blockId);

        if (!block || !block.position || blockId === dragState.sourceBlockId) continue;

        const blockY = i * BLOCK_VERTICAL_SPACING;
        const blockLeft = block.position.marginLeft;
        const blockRight = blockLeft + block.position.width;

        // Check if cursor is near this block vertically
        if (endY >= blockY && endY <= blockY + BLOCK_HEIGHT) {
          // Check if near left or right edge
          const leftEdgeDist = Math.abs(endX - blockLeft);
          const rightEdgeDist = Math.abs(endX - blockRight);

          if (leftEdgeDist < 20) {
            targetBlockId = blockId;
            targetHandle = "left";
            break;
          } else if (rightEdgeDist < 20) {
            targetBlockId = blockId;
            targetHandle = "right";
            break;
          }
        }
      }

      // If we found a valid target, create the relation
      if (targetBlockId && targetHandle) {
        try {
          // Determine the relation type based on handles
          let relationType: TIssueRelationTypes;

          if (dragState.sourceHandle === "right" && targetHandle === "left") {
            // Finish-to-Start: blocking
            relationType = "blocking";
          } else if (dragState.sourceHandle === "left" && targetHandle === "left") {
            // Start-to-Start
            relationType = "starts_before";
          } else if (dragState.sourceHandle === "right" && targetHandle === "right") {
            // Finish-to-Finish
            relationType = "finishes_before";
          } else {
            setToastAlert({
              type: "warning",
              title: "Invalid dependency",
              message: "Please connect finish-to-start, start-to-start, or finish-to-finish.",
            });
            setDragState(null);
            return;
          }

          // Get the source issue to determine workspace and project
          const sourceIssue = context.issue.issues.getIssueById(dragState.sourceBlockId);
          if (!sourceIssue) {
            throw new Error("Source issue not found");
          }

          const workspaceSlug = context.workspaceRoot.workspaceSlug;
          const projectId = sourceIssue.project_id;

          if (!workspaceSlug || !projectId) {
            throw new Error("Workspace or project not found");
          }

          // Create the relation
          await context.issueDetail.relation.createRelation(
            workspaceSlug,
            projectId,
            dragState.sourceBlockId,
            relationType,
            [targetBlockId]
          );

          setToastAlert({
            type: "success",
            title: "Dependency created",
            message: "Task dependency has been successfully created.",
          });
        } catch (error) {
          console.error("Error creating dependency:", error);
          setToastAlert({
            type: "error",
            title: "Error",
            message: "Failed to create dependency. Please try again.",
          });
        }
      }

      setDragState(null);
    },
    [context, dragState, timelineStore, setToastAlert]
  );

  useEffect(() => {
    window.addEventListener("dependency-drag-start", handleDragStart);
    window.addEventListener("dependency-drag-move", handleDragMove);
    window.addEventListener("dependency-drag-end", handleDragEnd);

    return () => {
      window.removeEventListener("dependency-drag-start", handleDragStart);
      window.removeEventListener("dependency-drag-move", handleDragMove);
      window.removeEventListener("dependency-drag-end", handleDragEnd);
    };
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  if (!dragState || !timelineStore.isDependencyEnabled) return null;

  // Calculate the path for the preview line
  const cy1 = dragState.startY + BLOCK_HEIGHT / 2;
  const cy2 = dragState.currentY;
  const midX = (dragState.startX + dragState.currentX) / 2;
  const path = `M ${dragState.startX} ${cy1} C ${midX} ${cy1}, ${midX} ${cy2}, ${dragState.currentX} ${cy2}`;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        zIndex: 100,
      }}
    >
      <path d={path} stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,5" />
      <circle cx={dragState.currentX} cy={cy2} r="4" fill="#3b82f6" />
    </svg>
  );
});
