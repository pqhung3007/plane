export type TProjectStateGroups = "draft" | "planning" | "execution" | "monitoring" | "completed" | "cancelled";

export interface IProjectState {
  id: string;
  name: string;
  description: string;
  color: string;
  slug: string;
  sequence: number;
  group: TProjectStateGroups;
  is_default: boolean;
  workspace: string;
  project: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}

export interface IProjectStateLite {
  id: string;
  name: string;
  color: string;
  group: TProjectStateGroups;
  description: string;
}

export type TProjectState = IProjectState;
