import { TIssue } from "../issues/base";

export type TAutomationTriggerType =
  | "issue_created"
  | "issue_updated"
  | "state_changed"
  | "assignee_changed"
  | "comment_created";

export type TAutomationConditionField =
  | "state"
  | "priority"
  | "label"
  | "assignee"
  | "created_by"
  | "issue_type";

export type TAutomationConditionOperator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty";

export type TAutomationActionType =
  | "add_comment"
  | "change_state"
  | "change_priority"
  | "add_assignee"
  | "remove_assignee"
  | "add_label"
  | "remove_label"
  | "set_start_date"
  | "set_due_date";

export type TAutomationTriggerConfig = {
  from_state_id?: string;
  to_state_id?: string;
  field?: string;
  schedule?: string;
};

// Simple condition (backward compatible)
export type TAutomationCondition = {
  field: TAutomationConditionField;
  operator: TAutomationConditionOperator;
  value?: string | string[] | number | boolean;
};

// Condition group operator
export type TConditionGroupOperator = "AND" | "OR";

// Condition group for complex nested conditions
export type TAutomationConditionGroup = {
  operator: TConditionGroupOperator;
  conditions: (TAutomationCondition | TAutomationConditionGroup)[];
};

// Unified type that supports both simple and complex conditions
export type TAutomationConditions =
  | TAutomationCondition[]  // Simple array (backward compatible)
  | TAutomationConditionGroup;  // Complex nested structure

export type TAutomationActionConfig = {
  // Comment action
  comment?: string;

  // State action
  state_id?: string;

  // Priority action
  priority?: TIssue["priority"];

  // Assignee actions
  assignee_ids?: string[];

  // Label actions
  label_ids?: string[];

  // Date actions
  start_date?: string;
  due_date?: string;
};

export type TAutomationAction = {
  type: TAutomationActionType;
  config: TAutomationActionConfig;
};

export type TProjectAutomation = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: TAutomationTriggerType;
  trigger_config: TAutomationTriggerConfig;
  conditions: TAutomationCondition[] | TAutomationConditionGroup;  // Support both simple and complex
  actions: TAutomationAction[];
  execution_count: number;
  last_executed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  project: string;
  workspace: string;
};

export type TProjectAutomationLite = Pick<
  TProjectAutomation,
  | "id"
  | "name"
  | "description"
  | "is_active"
  | "trigger_type"
  | "execution_count"
  | "last_executed_at"
  | "created_at"
>;

export type TAutomationLogStatus = "success" | "failed" | "skipped";

export type TAutomationLog = {
  id: string;
  automation: string;
  automation_name: string;
  issue: string;
  issue_identifier: string;
  trigger_type: TAutomationTriggerType;
  conditions_met: boolean;
  status: TAutomationLogStatus;
  actions_executed: {
    type: TAutomationActionType;
    config: TAutomationActionConfig;
    success: boolean;
    timestamp: string;
  }[];
  error_message: string;
  error_details: Record<string, any>;
  execution_time_ms: number | null;
  created_at: string;
  created_by: string;
};

export type TAutomationLogLite = Pick<
  TAutomationLog,
  "id" | "automation_name" | "issue_identifier" | "status" | "created_at"
>;

export type TAutomationActivity = {
  automation: {
    id: string;
    name: string;
    is_active: boolean;
  };
  statistics: {
    total_executions: number;
    success_count: number;
    failed_count: number;
    skipped_count: number;
    average_execution_time_ms: number | null;
    last_executed_at: string | null;
  };
  recent_logs: TAutomationLogLite[];
};

// Form types for creating/updating automations
export type TProjectAutomationCreate = Pick<
  TProjectAutomation,
  | "name"
  | "description"
  | "is_active"
  | "trigger_type"
  | "trigger_config"
  | "conditions"
  | "actions"
  | "sort_order"
  | "project"
>;

export type TProjectAutomationUpdate = Partial<
  Omit<
    TProjectAutomation,
    | "id"
    | "execution_count"
    | "last_executed_at"
    | "created_at"
    | "updated_at"
    | "created_by"
    | "updated_by"
    | "workspace"
  >
>;

// Filter types
export type TAutomationFilters = {
  is_active?: boolean;
  trigger_type?: TAutomationTriggerType;
};

export type TAutomationLogFilters = {
  automation_id?: string;
  issue_id?: string;
  status?: TAutomationLogStatus;
  start_date?: string;
  end_date?: string;
  limit?: number;
};
