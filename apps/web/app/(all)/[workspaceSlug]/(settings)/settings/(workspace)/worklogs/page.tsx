"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import SettingsHeading from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { WorkspaceTimeLogService, type TTimeLog, type TTimeLogStats } from "@/services/issue/issue_time_log.service";

const workspaceTimeLogService = new WorkspaceTimeLogService();

const WorklogsPage = observer(() => {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  // state
  const [timeLogs, setTimeLogs] = useState<TTimeLog[]>([]);
  const [stats, setStats] = useState<TTimeLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
  });

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Worklogs` : undefined;

  // Fetch worklogs
  const fetchWorklogs = async () => {
    try {
      setIsLoading(true);
      const [logsResponse, statsResponse] = await Promise.all([
        workspaceTimeLogService.getWorkspaceTimeLogs(workspaceSlug, {
          ...filters,
          per_page: 100,
        }),
        workspaceTimeLogService.getWorkspaceTimeLogStats(workspaceSlug, filters),
      ]);
      setTimeLogs(logsResponse.results);
      setStats(statsResponse);
    } catch (error) {
      console.error("Error fetching worklogs:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to fetch worklogs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceSlug && canPerformWorkspaceMemberActions) {
      fetchWorklogs();
    }
  }, [workspaceSlug, canPerformWorkspaceMemberActions]);

  const handleFilterChange = () => {
    fetchWorklogs();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // if user is not authorized to view this page
  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <div
        className={cn("w-full space-y-6", {
          "opacity-60": !canPerformWorkspaceMemberActions,
        })}
      >
        <SettingsHeading
          title="Worklogs"
          description="View and manage time tracking records for all work items in this workspace"
        />

        {/* Filters */}
        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
          <h3 className="mb-4 text-sm font-medium text-custom-text-200">Filters</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-xs text-custom-text-300">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full rounded border border-custom-border-300 bg-custom-background-90 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-xs text-custom-text-300">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full rounded border border-custom-border-300 bg-custom-background-90 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button variant="primary" size="sm" onClick={handleFilterChange}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <div className="text-sm text-custom-text-300">Total Time</div>
              <div className="mt-1 text-2xl font-semibold text-custom-text-100">{stats.total_hours.toFixed(1)}h</div>
              <div className="mt-1 text-xs text-custom-text-400">{stats.entry_count} entries</div>
            </div>
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <div className="text-sm text-custom-text-300">Billable Time</div>
              <div className="mt-1 text-2xl font-semibold text-green-500">{stats.billable_hours.toFixed(1)}h</div>
              <div className="mt-1 text-xs text-custom-text-400">{formatDuration(stats.billable_minutes)}</div>
            </div>
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
              <div className="text-sm text-custom-text-300">Non-billable Time</div>
              <div className="mt-1 text-2xl font-semibold text-custom-text-100">
                {stats.non_billable_hours.toFixed(1)}h
              </div>
              <div className="mt-1 text-xs text-custom-text-400">{formatDuration(stats.non_billable_minutes)}</div>
            </div>
          </div>
        )}

        {/* Time Logs Table */}
        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-custom-border-200 bg-custom-background-90">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300">Work Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-custom-text-300">Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-custom-border-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-custom-text-400">
                      Loading...
                    </td>
                  </tr>
                ) : timeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-custom-text-400">
                      No time logs found
                    </td>
                  </tr>
                ) : (
                  timeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-custom-background-90">
                      <td className="px-4 py-3 text-sm text-custom-text-200">{formatDate(log.logged_date)}</td>
                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {log.user_detail?.display_name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-custom-text-200">
                        {log.issue_detail?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-custom-text-100">
                        {formatDuration(log.duration_minutes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-custom-text-400">{log.description || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        {log.billable ? (
                          <span className="inline-flex rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-custom-background-90 px-2 py-1 text-xs font-medium text-custom-text-400">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Placeholder */}
        <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-custom-text-200">Export Worklogs</h3>
              <p className="mt-1 text-xs text-custom-text-400">Download worklog data as CSV or Excel</p>
            </div>
            <div className="flex gap-2">
              <Button variant="neutral-primary" size="sm" disabled>
                Export as CSV
              </Button>
              <Button variant="neutral-primary" size="sm" disabled>
                Export as Excel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SettingsContentWrapper>
  );
});

export default WorklogsPage;
