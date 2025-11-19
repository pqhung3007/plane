export type TProjectUpdateStatus = "on_track" | "at_risk" | "off_track";

export interface IProjectUpdateReaction {
  id: string;
  emoji: string;
  user_id: string;
  created_at: string;
}

export interface IProjectUpdateComment {
  id: string;
  update_id: string;
  workspace_id: string;
  project_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface IProjectUpdate {
  id: string;
  workspace_id: string;
  project_id: string;
  user_id: string;
  status: TProjectUpdateStatus;
  message: string;
  reactions?: IProjectUpdateReaction[];
  comments?: IProjectUpdateComment[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface IProjectUpdateFormData {
  status: TProjectUpdateStatus;
  message: string;
}
