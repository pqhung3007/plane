"use client";

import { FC, useState, useEffect } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// services
import { IssueTimeLogService } from "@/services/issue/issue_time_log.service";
// components
import { LogWorkModal } from "../log-work-modal";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

const issueTimeLogService = new IssueTimeLogService();

export const IssueWorklogProperty: FC<TIssueWorklogProperty> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch total logged time
  const fetchTotalTime = async () => {
    try {
      setIsLoading(true);
      const response = await issueTimeLogService.getIssueTimeLogs(
        workspaceSlug,
        projectId,
        issueId
      );

      // Calculate total from all time logs
      const total = response.results.reduce((sum, log) => sum + log.duration_minutes, 0);
      setTotalMinutes(total);
    } catch (error) {
      console.error("Error fetching time logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalTime();
  }, [workspaceSlug, projectId, issueId]);

  const handleLogWorkSuccess = () => {
    setIsModalOpen(false);
    fetchTotalTime(); // Refresh the total time
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Success!",
      message: "Work logged successfully",
    });
  };

  // Format minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <div className="flex h-8 items-center gap-2">
        <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>Tracked time</span>
        </div>
        <div className="flex w-3/5 flex-grow items-center justify-between gap-2">
          <div className="text-sm text-custom-text-200">
            {isLoading ? "Loading..." : formatDuration(totalMinutes)}
          </div>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="text-xs"
          >
            + Log work
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <LogWorkModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          onSuccess={handleLogWorkSuccess}
        />
      )}
    </>
  );
});
