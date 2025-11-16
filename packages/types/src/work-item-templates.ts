import { TIssuePriorities } from "./issues";

/**
 * Sub-work item template definition
 * Represents child work items that will be created with the parent
 */
export type TSubWorkItemTemplate = {
  name: string;
  description_html?: string;
  state_id?: string | null;
  priority?: TIssuePriorities | null;
  label_ids?: string[];
  assignee_ids?: string[];
  estimate_point?: string | null;
  start_date?: string | null;
  target_date?: string | null;
};

/**
 * Work item template properties
 * Default field values to be applied when using the template
 */
export type TWorkItemTemplateProperties = {
  name?: string;
  description_html?: string;
  state_id?: string | null;
  priority?: TIssuePriorities | null;
  label_ids?: string[];
  assignee_ids?: string[];
  module_ids?: string[];
  estimate_point?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  sub_work_items?: TSubWorkItemTemplate[];
};

/**
 * Work item template
 * Reusable template for creating work items with predefined structure
 */
export type TWorkItemTemplate = {
  id: string;
  name: string;
  description: string;
  type_id: string | null;
  project_id: string;
  workspace_id: string;
  properties: TWorkItemTemplateProperties;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

/**
 * Payload for creating a work item template
 */
export type TWorkItemTemplateCreatePayload = Omit<
  TWorkItemTemplate,
  "id" | "created_at" | "updated_at" | "created_by" | "updated_by" | "workspace_id"
>;

/**
 * Payload for updating a work item template
 */
export type TWorkItemTemplateUpdatePayload = Partial<TWorkItemTemplateCreatePayload>;

/**
 * Work item template map for efficient lookups
 */
export type TWorkItemTemplateMap = {
  [template_id: string]: TWorkItemTemplate;
};

/**
 * Work item template list response
 */
export type TWorkItemTemplateListResponse = TWorkItemTemplate[];
