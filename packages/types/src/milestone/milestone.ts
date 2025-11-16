import type { TIssue } from "../issues/issue";

export type TMilestoneStatus = "upcoming" | "active" | "completed" | "missed";

export type TMilestoneProgress = {
  total_issues: number;
  completed_issues: number;
  backlog_issues: number;
  started_issues: number;
  unstarted_issues: number;
  cancelled_issues: number;
  total_estimate_points?: number;
  completed_estimate_points?: number;
};

export interface IMilestone extends TMilestoneProgress {
  id: string;
  name: string;
  description: string;
  description_text?: string;
  description_html?: string;
  workspace_id: string;
  project_id: string;
  target_date: string | null;
  is_favorite?: boolean;
  sort_order: number;
  status?: TMilestoneStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Linked work items
  issue_ids?: string[];
}

export interface MilestoneIssueResponse {
  created_at: Date;
  created_by: string;
  id: string;
  issue: string;
  issue_detail: TIssue;
  milestone: string;
  milestone_detail: IMilestone;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
}

export type TMilestone = IMilestone;

export interface IMilestoneMap {
  [milestone_id: string]: IMilestone;
}

export interface IMilestoneIssuesMap {
  [milestone_id: string]: string[];
}
