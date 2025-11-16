import { useContext, useRef, useState, useCallback } from "react";
import type { RefObject } from "react";
import type { IGanttBlock } from "@plane/types";
// lib
import { StoreContext } from "@/lib/store-context";

type LeftDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

export const LeftDependencyDraggable = (props: LeftDependencyDraggableProps) => {
  const { block, ganttContainerRef } = props;
  const context = useContext(StoreContext);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!ganttContainerRef.current || !context) return;

      const rect = ganttContainerRef.current.getBoundingClientRect();
      const startX = e.clientX - rect.left + ganttContainerRef.current.scrollLeft;
      const startY = e.clientY - rect.top + ganttContainerRef.current.scrollTop;

      dragStartPos.current = { x: startX, y: startY };
      setIsDragging(true);

      // Dispatch custom event to notify DraggablePath component
      const event = new CustomEvent("dependency-drag-start", {
        detail: {
          blockId: block.id,
          handle: "left",
          x: startX,
          y: startY,
        },
      });
      window.dispatchEvent(event);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!ganttContainerRef.current) return;

        const rect = ganttContainerRef.current.getBoundingClientRect();
        const currentX = moveEvent.clientX - rect.left + ganttContainerRef.current.scrollLeft;
        const currentY = moveEvent.clientY - rect.top + ganttContainerRef.current.scrollTop;

        const dragEvent = new CustomEvent("dependency-drag-move", {
          detail: {
            blockId: block.id,
            x: currentX,
            y: currentY,
          },
        });
        window.dispatchEvent(dragEvent);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!ganttContainerRef.current) return;

        const rect = ganttContainerRef.current.getBoundingClientRect();
        const endX = upEvent.clientX - rect.left + ganttContainerRef.current.scrollLeft;
        const endY = upEvent.clientY - rect.top + ganttContainerRef.current.scrollTop;

        const endEvent = new CustomEvent("dependency-drag-end", {
          detail: {
            blockId: block.id,
            handle: "left",
            x: endX,
            y: endY,
          },
        });
        window.dispatchEvent(endEvent);

        setIsDragging(false);
        dragStartPos.current = null;

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [block.id, ganttContainerRef, context]
  );

  if (!block.position) return null;

  return (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"
      style={{
        width: "12px",
        height: "12px",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`w-full h-full rounded-full border-2 transition-colors ${
          isDragging
            ? "bg-custom-primary-100 border-custom-primary-100"
            : "bg-custom-background-100 border-custom-border-300 hover:border-custom-primary-100"
        }`}
      />
    </div>
  );
};
