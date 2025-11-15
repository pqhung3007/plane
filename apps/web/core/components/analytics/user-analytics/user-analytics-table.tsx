import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { UserRound } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane package imports
import type { AnalyticsTableDataMap, UserAnalyticsColumns } from "@plane/types";
// plane web components
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import { exportCSV } from "../export";
import { InsightTable } from "../insight-table";

const analyticsService = new AnalyticsService();

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    export: {
      key: string;
      value: (row: Row<TData>) => string | number;
      label?: string;
    };
  }
}

const UserAnalyticsTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  // store hooks
  const { selectedProjects, selectedCycle, selectedModule, isPeekView } = useAnalytics();
  const { data: userAnalyticsData, isLoading } = useSWR(
    `insights-table-user-analytics-${workspaceSlug}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<UserAnalyticsColumns[]>(
        workspaceSlug,
        "user-analytics",
        {
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );

  // derived values
  const columnsLabels: Record<keyof Omit<UserAnalyticsColumns, "user_id" | "user_avatar" | "user_email" | "user_role" | "total_work_items" | "pending_work_items" | "backlog_work_items">, string> =
    useMemo(
      () => ({
        user_name: "Member",
        started_work_items: "Started",
        unstarted_work_items: "Unstarted",
        completed_work_items: "Completed",
      }),
      []
    );

  const columns: ColumnDef<AnalyticsTableDataMap["user-analytics"]>[] = useMemo(
    () => [
      {
        accessorKey: "user_name",
        header: () => <div className="text-left">{columnsLabels["user_name"]}</div>,
        cell: ({ row }: { row: Row<UserAnalyticsColumns> }) => (
          <div className="text-left">
            <div className="flex items-center gap-2">
              {row.original.user_avatar && row.original.user_avatar !== "" ? (
                <Avatar
                  name={row.original.user_name}
                  src={getFileURL(row.original.user_avatar)}
                  size={24}
                  shape="circle"
                />
              ) : (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-custom-background-80 capitalize overflow-hidden">
                  {row.original.user_name ? (
                    row.original.user_name?.[0]
                  ) : (
                    <UserRound className="text-custom-text-200" size={14} />
                  )}
                </div>
              )}
              <span className="break-words text-custom-text-200">
                {row.original.user_name}
              </span>
            </div>
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["user_name"],
            value: (row) => row.original.user_name?.toString() ?? "",
          },
        },
      },
      {
        accessorKey: "started_work_items",
        header: () => <div className="text-right">{columnsLabels["started_work_items"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.started_work_items}</div>,
        meta: {
          export: {
            key: columnsLabels["started_work_items"],
            value: (row) => row.original.started_work_items.toString(),
          },
        },
      },
      {
        accessorKey: "unstarted_work_items",
        header: () => <div className="text-right">{columnsLabels["unstarted_work_items"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.unstarted_work_items}</div>,
        meta: {
          export: {
            key: columnsLabels["unstarted_work_items"],
            value: (row) => row.original.unstarted_work_items.toString(),
          },
        },
      },
      {
        accessorKey: "completed_work_items",
        header: () => <div className="text-right">{columnsLabels["completed_work_items"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.completed_work_items}</div>,
        meta: {
          export: {
            key: columnsLabels["completed_work_items"],
            value: (row) => row.original.completed_work_items.toString(),
          },
        },
      },
    ],
    [columnsLabels]
  );

  return (
    <InsightTable<"user-analytics">
      analyticsType="user-analytics"
      data={userAnalyticsData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText="Members"
      onExport={(rows) => userAnalyticsData && exportCSV(rows, columns, workspaceSlug)}
    />
  );
});

export default UserAnalyticsTable;
