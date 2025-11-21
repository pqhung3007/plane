import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { UserRound } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { ProjectIcon } from "@plane/propel/icons";
// plane package imports
import type { AnalyticsTableDataMap, CycleInsightColumns } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// plane web components
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { Logo } from "@/components/common/logo";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useProject } from "@/hooks/store/use-project";
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

const CyclesInsightTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { selectedDuration, selectedProjects, isPeekView } = useAnalytics();
  const { data: cyclesData, isLoading } = useSWR(
    `insights-table-cycles-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<CycleInsightColumns[]>(workspaceSlug, "cycles", {
        ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
      })
  );

  // derived values
  const columnsLabels: Record<
    keyof Omit<CycleInsightColumns, "cycle_id" | "project_id" | "lead_id" | "lead_avatar" | "status">,
    string
  > = useMemo(
    () => ({
      cycle_name: "Cycle",
      lead_name: "Lead",
      project_name: "Project",
      start_date: "Start Date",
      end_date: "End Date",
      completion_percentage: "Completion %",
      total_work_items: "Total",
      completed_work_items: "Completed",
      started_work_items: "Started",
      unstarted_work_items: "Unstarted",
      backlog_work_items: "Backlog",
      cancelled_work_items: "Cancelled",
    }),
    []
  );

  const columns: ColumnDef<AnalyticsTableDataMap["cycles"]>[] = useMemo(
    () => [
      {
        accessorKey: "cycle_name",
        header: () => <div className="text-left">{columnsLabels["cycle_name"]}</div>,
        cell: ({ row }) => <div className="text-left font-medium">{row.original.cycle_name}</div>,
        meta: {
          export: {
            key: columnsLabels["cycle_name"],
            value: (row) => row.original.cycle_name?.toString() ?? "",
          },
        },
      },
      {
        accessorKey: "lead_name",
        header: () => <div className="text-left">{columnsLabels["lead_name"]}</div>,
        cell: ({ row }: { row: Row<CycleInsightColumns> }) => (
          <div className="text-left">
            <div className="flex items-center gap-2">
              {row.original.lead_avatar && row.original.lead_avatar !== "" ? (
                <Avatar
                  name={row.original.lead_name}
                  src={getFileURL(row.original.lead_avatar)}
                  size={24}
                  shape="circle"
                />
              ) : (
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-custom-background-80  capitalize overflow-hidden">
                  {row.original.lead_name ? (
                    row.original.lead_name?.[0]
                  ) : (
                    <UserRound className="text-custom-text-200 " size={12} />
                  )}
                </div>
              )}
              <span className="break-words text-custom-text-200">{row.original.lead_name ?? "No lead"}</span>
            </div>
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["lead_name"],
            value: (row) => row.original.lead_name?.toString() ?? "",
          },
        },
      },
      {
        accessorKey: "project_name",
        header: () => <div className="text-left">{columnsLabels["project_name"]}</div>,
        cell: ({ row }) => {
          const project = getProjectById(row.original.project_id);
          return (
            <div className="flex items-center gap-2">
              {project?.logo_props ? <Logo logo={project.logo_props} size={18} /> : <ProjectIcon className="h-4 w-4" />}
              {row.original.project_name}
            </div>
          );
        },
        meta: {
          export: {
            key: columnsLabels["project_name"],
            value: (row) => row.original.project_name?.toString() ?? "",
          },
        },
      },
      {
        accessorKey: "start_date",
        header: () => <div className="text-left">{columnsLabels["start_date"]}</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.original.start_date ? renderFormattedDate(row.original.start_date) : "-"}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["start_date"],
            value: (row) => (row.original.start_date ? renderFormattedDate(row.original.start_date) : "-"),
          },
        },
      },
      {
        accessorKey: "end_date",
        header: () => <div className="text-left">{columnsLabels["end_date"]}</div>,
        cell: ({ row }) => (
          <div className="text-left">{row.original.end_date ? renderFormattedDate(row.original.end_date) : "-"}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["end_date"],
            value: (row) => (row.original.end_date ? renderFormattedDate(row.original.end_date) : "-"),
          },
        },
      },
      {
        accessorKey: "completion_percentage",
        header: () => <div className="text-right">{columnsLabels["completion_percentage"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.completion_percentage.toFixed(1)}%</div>,
        meta: {
          export: {
            key: columnsLabels["completion_percentage"],
            value: (row) => row.original.completion_percentage.toFixed(1),
          },
        },
      },
    ],
    [columnsLabels, getProjectById]
  );

  return (
    <InsightTable<"cycles">
      analyticsType="cycles"
      data={cyclesData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText="Cycles"
      onExport={(rows) => cyclesData && exportCSV(rows, columns, workspaceSlug)}
    />
  );
});

export default CyclesInsightTable;
