import { EDurationFilters } from "./enums";
import { IIssueActivity, TIssuePriorities } from "./issues";
import { TIssue } from "./issues/issue";
import { TIssueRelationTypes } from "./issues/issue_relation";
import { TStateGroups } from "./state";

export type TWidgetKeys =
  | "overview_stats"
  | "assigned_issues"
  | "created_issues"
  | "issues_by_state_groups"
  | "issues_by_priority"
  | "recent_activity"
  | "recent_projects"
  | "recent_collaborators";

export type TIssuesListTypes = "pending" | "upcoming" | "overdue" | "completed";

// widget filters
export type TAssignedIssuesWidgetFilters = {
  custom_dates?: string[];
  duration?: EDurationFilters;
  tab?: TIssuesListTypes;
};

export type TCreatedIssuesWidgetFilters = {
  custom_dates?: string[];
  duration?: EDurationFilters;
  tab?: TIssuesListTypes;
};

export type TIssuesByStateGroupsWidgetFilters = {
  duration?: EDurationFilters;
  custom_dates?: string[];
};

export type TIssuesByPriorityWidgetFilters = {
  custom_dates?: string[];
  duration?: EDurationFilters;
};

export type TWidgetFiltersFormData =
  | {
      widgetKey: "assigned_issues";
      filters: Partial<TAssignedIssuesWidgetFilters>;
    }
  | {
      widgetKey: "created_issues";
      filters: Partial<TCreatedIssuesWidgetFilters>;
    }
  | {
      widgetKey: "issues_by_state_groups";
      filters: Partial<TIssuesByStateGroupsWidgetFilters>;
    }
  | {
      widgetKey: "issues_by_priority";
      filters: Partial<TIssuesByPriorityWidgetFilters>;
    };

export type TWidget = {
  id: string;
  is_visible: boolean;
  key: TWidgetKeys;
  readonly widget_filters: // only for read
  TAssignedIssuesWidgetFilters &
    TCreatedIssuesWidgetFilters &
    TIssuesByStateGroupsWidgetFilters &
    TIssuesByPriorityWidgetFilters;
  filters: // only for write
  TAssignedIssuesWidgetFilters &
    TCreatedIssuesWidgetFilters &
    TIssuesByStateGroupsWidgetFilters &
    TIssuesByPriorityWidgetFilters;
};

export type TWidgetStatsRequestParams =
  | {
      widget_key: TWidgetKeys;
    }
  | {
      target_date: string;
      issue_type: TIssuesListTypes;
      widget_key: "assigned_issues";
      expand?: "issue_relation";
    }
  | {
      target_date: string;
      issue_type: TIssuesListTypes;
      widget_key: "created_issues";
    }
  | {
      target_date: string;
      widget_key: "issues_by_state_groups";
    }
  | {
      target_date: string;
      widget_key: "issues_by_priority";
    }
  | {
      cursor: string;
      per_page: number;
      search?: string;
      widget_key: "recent_collaborators";
    };

export type TWidgetIssue = TIssue & {
  issue_relation: {
    id: string;
    project_id: string;
    relation_type: TIssueRelationTypes;
    sequence_id: number;
    type_id: string | null;
  }[];
};

// widget stats responses
export type TOverviewStatsWidgetResponse = {
  assigned_issues_count: number;
  completed_issues_count: number;
  created_issues_count: number;
  pending_issues_count: number;
};

export type TAssignedIssuesWidgetResponse = {
  issues: TWidgetIssue[];
  count: number;
};

export type TCreatedIssuesWidgetResponse = {
  issues: TWidgetIssue[];
  count: number;
};

export type TIssuesByStateGroupsWidgetResponse = {
  count: number;
  state: TStateGroups;
};

export type TIssuesByPriorityWidgetResponse = {
  count: number;
  priority: TIssuePriorities;
};

export type TRecentActivityWidgetResponse = IIssueActivity;

export type TRecentProjectsWidgetResponse = string[];

export type TRecentCollaboratorsWidgetResponse = {
  active_issue_count: number;
  user_id: string;
};

export type TWidgetStatsResponse =
  | TOverviewStatsWidgetResponse
  | TIssuesByStateGroupsWidgetResponse[]
  | TIssuesByPriorityWidgetResponse[]
  | TAssignedIssuesWidgetResponse
  | TCreatedIssuesWidgetResponse
  | TRecentActivityWidgetResponse[]
  | TRecentProjectsWidgetResponse
  | TRecentCollaboratorsWidgetResponse[];

// dashboard
export type TDeprecatedDashboard = {
  created_at: string;
  created_by: string | null;
  description_html: string;
  id: string;
  identifier: string | null;
  is_default: boolean;
  name: string;
  owned_by: string;
  type: string;
  updated_at: string;
  updated_by: string | null;
};

export type THomeDashboardResponse = {
  dashboard: TDeprecatedDashboard;
  widgets: TWidget[];
};

// ===== Custom Dashboards =====

export type TDashboard = {
  id: string;
  name: string;
  description?: string;
  workspace: string;
  project_ids: string[];
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
};

export type TDashboardCreatePayload = {
  name: string;
  description?: string;
  project_ids: string[];
};

export type TDashboardUpdatePayload = Partial<TDashboardCreatePayload>;

// Widget Types
export type TWidgetType = "bar" | "line" | "area" | "donut" | "pie" | "number";

// Widget Grouping/Metric Options
export type TWidgetProperty =
  | "priority"
  | "state"
  | "assignee"
  | "label"
  | "type"
  | "cycle"
  | "module"
  | "created_date"
  | "target_date"
  | "start_date";

export type TWidgetMetric =
  | "count"
  | "estimate_sum"
  | "estimate_avg";

// Widget Data Configuration
export type TWidgetDataConfig = {
  property: TWidgetProperty; // Group by / X-axis
  metric: TWidgetMetric; // Measure / Y-axis
  filters?: {
    date_range?: {
      start?: string;
      end?: string;
    };
    priority?: string[];
    state?: string[];
    assignee?: string[];
    label?: string[];
  };
};

// Widget Appearance Configuration
export type TWidgetColorScheme =
  | "modern"
  | "horizon"
  | "sunset"
  | "ocean"
  | "forest"
  | "vibrant"
  | "monochrome";

export type TWidgetAppearanceConfig = {
  title: string;
  color_scheme: TWidgetColorScheme;
  show_legends: boolean;
  show_tooltips: boolean;
  // For donut/pie charts
  show_center_value?: boolean;
  // For area charts
  fill_opacity?: number;
  // For line charts
  smooth_curve?: boolean;
  show_markers?: boolean;
};

// Widget Layout (for grid positioning)
export type TWidgetLayout = {
  i: string; // widget id
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

// Complete Widget Entity
export type TCustomWidget = {
  id: string;
  dashboard: string;
  type: TWidgetType;
  data_config: TWidgetDataConfig;
  appearance_config: TWidgetAppearanceConfig;
  layout: TWidgetLayout;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TCustomWidgetCreatePayload = {
  type: TWidgetType;
  data_config?: Partial<TWidgetDataConfig>;
  appearance_config?: Partial<TWidgetAppearanceConfig>;
  layout?: Partial<TWidgetLayout>;
};

export type TCustomWidgetUpdatePayload = Partial<TCustomWidgetCreatePayload>;

// Widget Data Response (actual chart data)
export type TWidgetDataPoint = {
  name: string; // Category name (e.g., "High Priority", "John Doe")
  value: number; // Metric value
  color?: string; // Optional color override
  metadata?: Record<string, any>; // Additional data for tooltips
};

export type TWidgetDataResponse = {
  data: TWidgetDataPoint[];
  total?: number;
  summary?: {
    min?: number;
    max?: number;
    avg?: number;
    sum?: number;
  };
};

// Dashboard with widgets response
export type TDashboardWithWidgets = {
  dashboard: TDashboard;
  widgets: TCustomWidget[];
  layout: TWidgetLayout[];
};
