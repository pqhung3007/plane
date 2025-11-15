import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { ProjectIcon } from "@plane/propel/icons";
// plane package imports
import type { AnalyticsTableDataMap, ProjectInsightColumns } from "@plane/types";
// plane web components
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

const ProjectsInsightTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { selectedDuration, selectedProjects, isPeekView } = useAnalytics();

  const { data: projectsData, isLoading } = useSWR(
    `insights-table-projects-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<ProjectInsightColumns[]>(
        workspaceSlug,
        "projects",
        {
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
        },
        isPeekView
      )
  );

  // derived values
  const columnsLabels: Record<keyof Omit<ProjectInsightColumns, "project_id">, string> = useMemo(
    () => ({
      project_name: t("common.project"),
      completion_percentage: t("workspace_analytics.completion"),
      members_count: t("common.members"),
      epics_count: t("common.epics"),
      work_items_count: t("common.work_items"),
      cycles_count: t("common.cycles"),
      modules_count: t("common.modules"),
      pages_count: t("common.pages"),
      views_count: t("common.views"),
      intake_count: t("sidebar.intake"),
    }),
    [t]
  );

  const columns: ColumnDef<AnalyticsTableDataMap["projects"]>[] = useMemo(
    () => [
      {
        accessorKey: "project_name",
        header: () => <div className="text-left">{columnsLabels["project_name"]}</div>,
        cell: ({ row }) => {
          const project = getProjectById(row.original.project_id);
          const completionPercentage = Math.round(row.original.completion_percentage);
          return (
            <div className="flex items-center gap-2">
              {project?.logo_props ? <Logo logo={project.logo_props} size={18} /> : <ProjectIcon className="h-4 w-4" />}
              <span>{row.original.project_name}</span>
              <span className="text-xs text-custom-text-300">({completionPercentage}%)</span>
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
        accessorKey: "members_count",
        header: () => <div className="text-right">{columnsLabels["members_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.members_count}</div>,
        meta: {
          export: {
            key: columnsLabels["members_count"],
            value: (row) => row.original.members_count.toString(),
          },
        },
      },
      {
        accessorKey: "epics_count",
        header: () => <div className="text-right">{columnsLabels["epics_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.epics_count}</div>,
        meta: {
          export: {
            key: columnsLabels["epics_count"],
            value: (row) => row.original.epics_count.toString(),
          },
        },
      },
      {
        accessorKey: "work_items_count",
        header: () => <div className="text-right">{columnsLabels["work_items_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.work_items_count}</div>,
        meta: {
          export: {
            key: columnsLabels["work_items_count"],
            value: (row) => row.original.work_items_count.toString(),
          },
        },
      },
      {
        accessorKey: "cycles_count",
        header: () => <div className="text-right">{columnsLabels["cycles_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.cycles_count}</div>,
        meta: {
          export: {
            key: columnsLabels["cycles_count"],
            value: (row) => row.original.cycles_count.toString(),
          },
        },
      },
      {
        accessorKey: "modules_count",
        header: () => <div className="text-right">{columnsLabels["modules_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.modules_count}</div>,
        meta: {
          export: {
            key: columnsLabels["modules_count"],
            value: (row) => row.original.modules_count.toString(),
          },
        },
      },
      {
        accessorKey: "pages_count",
        header: () => <div className="text-right">{columnsLabels["pages_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.pages_count}</div>,
        meta: {
          export: {
            key: columnsLabels["pages_count"],
            value: (row) => row.original.pages_count.toString(),
          },
        },
      },
      {
        accessorKey: "views_count",
        header: () => <div className="text-right">{columnsLabels["views_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.views_count}</div>,
        meta: {
          export: {
            key: columnsLabels["views_count"],
            value: (row) => row.original.views_count.toString(),
          },
        },
      },
      {
        accessorKey: "intake_count",
        header: () => <div className="text-right">{columnsLabels["intake_count"]}</div>,
        cell: ({ row }) => <div className="text-right">{row.original.intake_count}</div>,
        meta: {
          export: {
            key: columnsLabels["intake_count"],
            value: (row) => row.original.intake_count.toString(),
          },
        },
      },
    ],
    [columnsLabels, getProjectById]
  );

  const handleExport = (rows: Row<AnalyticsTableDataMap["projects"]>[]) => {
    exportCSV(rows, columns, workspaceSlug, t("workspace_analytics.projects_analytics"));
  };

  return (
    <InsightTable
      data={projectsData ?? []}
      columns={columns}
      isLoading={isLoading}
      i18nTitle="workspace_analytics.projects_details"
      i18nSubtitle="workspace_analytics.projects_details_subtitle"
      i18nEmptyState="workspace_analytics.no_projects_data"
      handleExport={handleExport}
    />
  );
});

export default ProjectsInsightTable;
