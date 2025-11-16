import { TLogoProps } from "../common";
import { TUserPermissions } from "../enums";
import { TStateGroups } from "../state";
import type { IUser, IUserLite } from "../users";
import type { IWorkspace } from "../workspace";

export enum EUserProjectRoles {
  ADMIN = 20,
  MEMBER = 15,
  GUEST = 5,
}

export interface IPartialProject {
  id: string;
  name: string;
  identifier: string;
  sort_order: number | null;
  logo_props: TLogoProps;
  member_role?: TUserPermissions | EUserProjectRoles | null;
  archived_at: string | null;
  workspace: IWorkspace | string;
  cycle_view: boolean;
  issue_views_view: boolean;
  module_view: boolean;
  page_view: boolean;
  inbox_view: boolean;
  guest_view_all_features?: boolean;
  project_lead?: IUserLite | string | null;
  network?: number;
  // Timestamps
  created_at?: Date;
  updated_at?: Date;
  // actor
  created_by?: string;
  updated_by?: string;
}

export interface IProject extends IPartialProject {
  archive_in?: number;
  close_in?: number;
  // only for uploading the cover image
  cover_image_asset?: null;
  cover_image?: string;
  // only for rendering the cover image
  readonly cover_image_url?: string;
  default_assignee?: IUser | string | null;
  default_state?: string | null;
  description?: string;
  estimate?: string | null;
  anchor?: string | null;
  is_favorite?: boolean;
  members?: string[];
  timezone?: string;
}

export type TProjectAnalyticsCountParams = {
  project_ids?: string;
  fields?: string;
};

export type TProjectAnalyticsCount = Pick<IProject, "id"> & {
  total_issues?: number;
  completed_issues?: number;
  total_cycles?: number;
  total_members?: number;
  total_modules?: number;
};

export interface IProjectLite {
  id: string;
  name: string;
  identifier: string;
  logo_props: TLogoProps;
}

export type ProjectPreferences = {
  pages: {
    block_display: boolean;
  };
};

export interface IProjectMap {
  [id: string]: IProject;
}

export interface IProjectMemberLite {
  id: string;
  member__avatar_url: string;
  member__display_name: string;
  member_id: string;
}

export type TProjectMembership = {
  member: string;
  role: TUserPermissions | EUserProjectRoles;
} & (
  | {
      id: string;
      original_role: EUserProjectRoles;
      created_at: string;
    }
  | {
      id: null;
      original_role: null;
      created_at: null;
    }
);

export interface IProjectBulkAddFormData {
  members: { role: TUserPermissions | EUserProjectRoles; member_id: string }[];
}

export interface IGithubRepository {
  id: string;
  full_name: string;
  html_url: string;
  url: string;
}

export interface GithubRepositoriesResponse {
  repositories: IGithubRepository[];
  total_count: number;
}

export type TProjectIssuesSearchParams = {
  search: string;
  parent?: boolean;
  issue_relation?: boolean;
  cycle?: boolean;
  module?: string;
  sub_issue?: boolean;
  issue_id?: string;
  workspace_search: boolean;
  target_date?: string;
  epic?: boolean;
};

export interface ISearchIssueResponse {
  id: string;
  name: string;
  project_id: string;
  project__identifier: string;
  project__name: string;
  sequence_id: number;
  start_date: string | null;
  state__color: string;
  state__group: TStateGroups;
  state__name: string;
  workspace__slug: string;
  type_id: string;
}

export type TPartialProject = IPartialProject;

export type TProject = TPartialProject & IProject;

// Project Template Types

export interface IProjectTemplateStateConfig {
  name: string;
  color: string;
  sequence: number;
  group: string;
  default?: boolean;
}

export interface IProjectTemplateLabelConfig {
  name: string;
  color: string;
  description?: string;
}

export interface IProjectTemplateIssueTypeConfig {
  name: string;
  description?: string;
  icon?: string;
}

export interface IProjectTemplateWorkItemConfig {
  name: string;
  description?: string;
  priority?: string;
  state_group?: string;
  labels?: string[];
}

export interface IProjectTemplate {
  id: string;
  name: string;
  description?: string;
  description_text?: any;
  description_html?: any;
  cover_image?: string;
  cover_image_url?: string;
  cover_image_asset?: string | null;
  workspace: IWorkspace | string;

  // Project Properties
  network: number;
  project_lead?: IUserLite | string | null;
  default_assignee?: IUserLite | string | null;

  // Optional Features
  module_view: boolean;
  cycle_view: boolean;
  issue_views_view: boolean;
  page_view: boolean;
  intake_view: boolean;
  is_issue_type_enabled: boolean;
  is_time_tracking_enabled: boolean;

  // Template Content Configuration
  include_states: boolean;
  states_config: IProjectTemplateStateConfig[];
  include_labels: boolean;
  labels_config: IProjectTemplateLabelConfig[];
  include_issue_types: boolean;
  issue_types_config: IProjectTemplateIssueTypeConfig[];
  include_work_items: boolean;
  work_items_config: IProjectTemplateWorkItemConfig[];

  // Metadata
  emoji?: string | null;
  icon_prop?: any;
  logo_props: TLogoProps;

  // Usage tracking
  usage_count: number;
  last_used_at?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
}

export interface IProjectTemplateLite {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  cover_image_url?: string;
  icon_prop?: any;
  emoji?: string | null;
  logo_props: TLogoProps;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface IProjectTemplateMap {
  [id: string]: IProjectTemplate;
}

export type TProjectTemplate = IProjectTemplate;

export type TProjectTemplateLite = IProjectTemplateLite;
