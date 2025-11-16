import { API_BASE_URL } from "@plane/constants";
import type { IGithubRepoInfo, IGithubServiceImportFormData } from "@plane/types";
import { APIService } from "@/services/api.service";
// helpers
// types

const integrationServiceType: string = "github";

export interface IGithubIntegration {
  id: string;
  installation_id: string;
  workspace: string;
  integration: string;
  metadata: any;
  config: any;
  created_at: string;
  updated_at: string;
}

export interface IGithubRepository {
  id: string;
  name: string;
  owner: string;
  repository_id: number;
  url: string;
  project: string;
}

export interface IGithubRepositorySync {
  id: string;
  repository: IGithubRepository;
  sync_direction: "unidirectional" | "bidirectional";
  github_open_state: string | null;
  github_closed_state: string | null;
  github_open_state_detail?: { id: string; name: string; color: string } | null;
  github_closed_state_detail?: { id: string; name: string; color: string } | null;
  project: string;
  workspace: string;
  created_at: string;
  updated_at: string;
}

export interface IGithubPRStateMapping {
  id: string;
  repository: string;
  repository_detail?: IGithubRepository;
  pr_draft_state: string | null;
  pr_opened_state: string | null;
  pr_review_requested_state: string | null;
  pr_approved_state: string | null;
  pr_merged_state: string | null;
  pr_closed_state: string | null;
  pr_draft_state_detail?: { id: string; name: string; color: string } | null;
  pr_opened_state_detail?: { id: string; name: string; color: string } | null;
  pr_review_requested_state_detail?: { id: string; name: string; color: string } | null;
  pr_approved_state_detail?: { id: string; name: string; color: string } | null;
  pr_merged_state_detail?: { id: string; name: string; color: string } | null;
  pr_closed_state_detail?: { id: string; name: string; color: string } | null;
  project: string;
  workspace: string;
}

export interface IGithubUserConnection {
  id: string;
  user: string;
  workspace: string;
  github_user_id: number;
  github_username: string;
  github_email: string | null;
  github_avatar_url: string | null;
  scopes: string;
  created_at: string;
  updated_at: string;
}

export class GithubIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // ===== IMPORT/LEGACY ENDPOINTS =====
  async listAllRepositories(workspaceSlug: string, integrationSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-integrations/${integrationSlug}/github-repositories`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGithubRepoInfo(workspaceSlug: string, params: { owner: string; repo: string }): Promise<IGithubRepoInfo> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/${integrationServiceType}/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createGithubServiceImport(workspaceSlug: string, data: IGithubServiceImportFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/importers/${integrationServiceType}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== WORKSPACE INTEGRATION ENDPOINTS =====
  async createGithubIntegration(
    workspaceSlug: string,
    data: { installation_id: string; config?: any }
  ): Promise<IGithubIntegration> {
    return this.post(`/api/workspaces/${workspaceSlug}/integrations/github/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGithubIntegrations(workspaceSlug: string): Promise<IGithubIntegration[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/integrations/github/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteGithubIntegration(workspaceSlug: string, integrationId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/integrations/github/${integrationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== USER CONNECTION ENDPOINTS =====
  async getGithubUserConnections(workspaceSlug: string): Promise<IGithubUserConnection[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/integrations/github/user-connections/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteGithubUserConnection(workspaceSlug: string, connectionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/integrations/github/user-connections/${connectionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async initiateGithubUserConnection(workspaceSlug: string): string {
    // This returns the GitHub OAuth URL
    const redirectUrl = `${window.location.origin}/settings/integrations`;
    const state = `${workspaceSlug}:${redirectUrl}`;
    return `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${API_BASE_URL}/integrations/github/callback/&scope=read:user user:email&state=${state}`;
  }

  // ===== REPOSITORY SYNC ENDPOINTS =====
  async createRepositorySync(
    workspaceSlug: string,
    projectId: string,
    data: {
      repository: {
        name: string;
        owner: string;
        repository_id: number;
        url: string;
      };
      sync_direction: "unidirectional" | "bidirectional";
      github_open_state?: string;
      github_closed_state?: string;
    }
  ): Promise<IGithubRepositorySync> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/repository-syncs/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getRepositorySyncs(workspaceSlug: string, projectId: string): Promise<IGithubRepositorySync[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/repository-syncs/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRepositorySync(
    workspaceSlug: string,
    projectId: string,
    syncId: string,
    data: Partial<{
      sync_direction: "unidirectional" | "bidirectional";
      github_open_state: string;
      github_closed_state: string;
    }>
  ): Promise<IGithubRepositorySync> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/repository-syncs/${syncId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteRepositorySync(workspaceSlug: string, projectId: string, syncId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/repository-syncs/${syncId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // ===== PR STATE MAPPING ENDPOINTS =====
  async createPRStateMapping(
    workspaceSlug: string,
    projectId: string,
    data: {
      repository_id: string;
      pr_draft_state?: string;
      pr_opened_state?: string;
      pr_review_requested_state?: string;
      pr_approved_state?: string;
      pr_merged_state?: string;
      pr_closed_state?: string;
    }
  ): Promise<IGithubPRStateMapping> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/pr-state-mappings/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPRStateMappings(workspaceSlug: string, projectId: string): Promise<IGithubPRStateMapping[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/pr-state-mappings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePRStateMapping(
    workspaceSlug: string,
    projectId: string,
    mappingId: string,
    data: Partial<{
      pr_draft_state: string;
      pr_opened_state: string;
      pr_review_requested_state: string;
      pr_approved_state: string;
      pr_merged_state: string;
      pr_closed_state: string;
    }>
  ): Promise<IGithubPRStateMapping> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/pr-state-mappings/${mappingId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePRStateMapping(workspaceSlug: string, projectId: string, mappingId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/integrations/github/pr-state-mappings/${mappingId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
