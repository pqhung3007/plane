# GitHub Integration for Plane

This document describes the GitHub integration feature for Plane, enabling seamless synchronization between GitHub repositories and Plane projects.

## Overview

The GitHub integration allows you to:

- **Sync Issues Bidirectionally**: Automatically sync issues between GitHub and Plane
- **Automate PR State Changes**: Update Plane issue states based on pull request lifecycle
- **Personal Account Connection**: Post comments using your personal GitHub identity
- **Flexible State Mapping**: Configure how GitHub states map to Plane states
- **Support for GitHub Cloud and Enterprise**: Works with both cloud and self-hosted GitHub instances

## Architecture

### Database Models

The integration introduces the following new models:

1. **GithubRepository**: Stores GitHub repository information
2. **GithubRepositorySync**: Manages sync configuration between a GitHub repo and Plane project
   - Sync direction (unidirectional or bidirectional)
   - State mappings (open/closed states)
3. **GithubIssueSync**: Tracks synced issues between GitHub and Plane
4. **GithubCommentSync**: Tracks synced comments
5. **GithubUserConnection**: Stores personal GitHub account connections
6. **GithubPRStateMapping**: Configures PR state automation
7. **GithubPRSync**: Tracks synced pull requests

### API Endpoints

#### Workspace Level

```
GET    /api/workspaces/{slug}/integrations/github/
POST   /api/workspaces/{slug}/integrations/github/
DELETE /api/workspaces/{slug}/integrations/github/{id}/

GET    /api/workspaces/{slug}/integrations/github/user-connections/
DELETE /api/workspaces/{slug}/integrations/github/user-connections/{id}/
```

#### Project Level

```
GET    /api/workspaces/{slug}/projects/{project_id}/integrations/github/repository-syncs/
POST   /api/workspaces/{slug}/projects/{project_id}/integrations/github/repository-syncs/
PATCH  /api/workspaces/{slug}/projects/{project_id}/integrations/github/repository-syncs/{id}/
DELETE /api/workspaces/{slug}/projects/{project_id}/integrations/github/repository-syncs/{id}/

GET    /api/workspaces/{slug}/projects/{project_id}/integrations/github/pr-state-mappings/
POST   /api/workspaces/{slug}/projects/{project_id}/integrations/github/pr-state-mappings/
PATCH  /api/workspaces/{slug}/projects/{project_id}/integrations/github/pr-state-mappings/{id}/
DELETE /api/workspaces/{slug}/projects/{project_id}/integrations/github/pr-state-mappings/{id}/
```

#### Webhooks & OAuth

```
GET  /api/integrations/github/callback/        # OAuth callback
POST /api/integrations/github/webhook/         # GitHub webhook endpoint
```

## Setup Instructions

### 1. Create a GitHub App

For self-hosted Plane instances, you need to create a GitHub App:

1. Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
2. Configure the app with the following settings:
   - **Homepage URL**: Your Plane instance URL
   - **Callback URL**: `https://your-plane-instance.com/api/integrations/github/callback/`
   - **Webhook URL**: `https://your-plane-instance.com/api/integrations/github/webhook/`
   - **Webhook secret**: Generate a secure secret

3. **Permissions** required:
   - Repository permissions:
     - Issues: Read & Write
     - Pull requests: Read & Write
     - Metadata: Read-only
   - Organization permissions:
     - Members: Read-only (optional)

4. **Subscribe to events**:
   - Issues
   - Issue comments
   - Pull requests
   - Pull request reviews

5. After creating the app, note down:
   - App ID
   - Client ID
   - Client Secret
   - Webhook Secret
   - Private Key (download the .pem file)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitHub Webhook Secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Optional: Restrict to specific GitHub organization
GITHUB_ORGANIZATION_ID=your_org_id
```

### 3. Run Database Migrations

```bash
cd apps/api
python manage.py migrate
```

### 4. Install GitHub App

1. Navigate to your GitHub App settings
2. Click "Install App"
3. Select the organization and repositories you want to integrate
4. Note down the **Installation ID** from the URL after installation

## Usage Guide

### Connecting GitHub to Workspace

#### As a Workspace Admin:

1. Navigate to Workspace Settings → Integrations
2. Click "Configure" on the GitHub integration card
3. Click "Connect" in the Connect Organization section
4. Authorize the GitHub App for your organization
5. Select repositories to sync (all or specific ones)
6. Click "Install"

The integration is now connected to your workspace.

### Connecting Personal GitHub Account

#### From Workspace Settings (Admin only):

1. Go to Workspace Settings → Integrations
2. Under "Connect personal account", click "Connect"
3. Authorize GitHub to access your account
4. Your personal account is now connected

#### From Profile Settings (All members):

1. Go to Profile Settings → Connections
2. Select your workspace
3. Click "Connect" in the GitHub section
4. Authorize GitHub
5. Your personal account is now connected

**Note**: When you connect your personal account, comments posted from Plane to GitHub will appear under your GitHub username instead of the Plane app.

### Setting Up Project Issue Sync

1. Navigate to Project Settings → Integrations
2. Click the "+" button in the "Project Issue Sync" section
3. Configure the following:
   - **Plane project**: Select the project to sync
   - **GitHub repository**: Select the repository
   - **Issue Open State**: Select which Plane state to use when GitHub issue is opened
   - **Issue Closed State**: Select which Plane state to use when GitHub issue is closed
   - **Sync Direction**:
     - **Unidirectional**: GitHub → Plane only (Plane changes won't sync back)
     - **Bidirectional**: Both directions (changes sync both ways)
4. Click "Start Sync"

### Syncing Issues

#### GitHub → Plane

1. In your GitHub repository, add the "Plane" label to any issue
2. The issue will automatically be created in the linked Plane project
3. Plane will post a comment on the GitHub issue with a link to the Plane work item

#### Plane → GitHub

1. In your Plane project, add the "GitHub" label to any work item
2. A new issue will automatically be created in the linked GitHub repository
3. The GitHub issue will have a backlink to the Plane work item

### Setting Up PR State Automation

1. Navigate to Project Settings → Integrations
2. Click the "+" button in the "Pull Request State Mapping" section
3. Configure state mappings for different PR lifecycle events:
   - **Draft PR Created**: State when PR is created as draft
   - **PR Opened**: State when PR is opened (or draft becomes ready)
   - **Review Requested**: State when review is requested
   - **PR Approved**: State when PR is approved
   - **PR Merged**: State when PR is merged
   - **PR Closed**: State when PR is closed without merging
4. Click "Save"

### Referencing Work Items in PRs

#### With State Automation (Brackets):

```
PR Title: [WEB-344] Add user authentication feature
```

or in the PR description:

```
This PR implements the authentication feature.

Fixes [WEB-344] [WEB-345]
```

Work items referenced with brackets will have their states automatically updated based on your PR state mappings.

#### Link Only (Without Brackets):

```
PR Title: Add authentication (relates to WEB-344)

PR Description:
This implements the feature from WEB-344 and WEB-345
```

Work items referenced without brackets will be linked to the PR but won't have automatic state updates.

### What Gets Synced?

| Property | Sync Direction | Notes |
|----------|---------------|-------|
| Title | Both ways | Updates in either platform reflect in the other |
| Description | Both ways | Content remains consistent |
| Assignees | Both ways | Users must be mapped between platforms |
| Labels | Both ways | Labels are created if they don't exist |
| States | GitHub → Plane | Plane state changes don't update GitHub (except via issue close) |
| Comments | Both ways | Comments sync with source attribution |
| Mentions | Both ways | User mentions sync if mapped |
| Issue Links | GitHub → Plane | GitHub issue references become Plane links |

## Webhook Events

The integration handles the following GitHub webhook events:

- `issues` - Issue opened, closed, edited, labeled, unlabeled
- `issue_comment` - Comment created, edited, deleted
- `pull_request` - PR opened, closed, merged, draft status changed
- `pull_request_review` - PR review submitted, edited

## Security Considerations

1. **Webhook Signature Verification**: All webhook requests are verified using HMAC-SHA256
2. **OAuth Token Storage**: Personal access tokens are stored encrypted in the database
3. **Permissions**: Workspace admins control integration settings
4. **API Token**: Each integration creates a dedicated API token for GitHub operations

## Troubleshooting

### Integration not appearing

- Verify GitHub App is installed for your organization
- Check that GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set
- Ensure you have admin permissions on the workspace

### Issues not syncing

- Verify the repository sync is configured for the project
- Check that the correct labels are applied (Plane/GitHub)
- Review webhook deliveries in GitHub App settings
- Check application logs for sync errors

### PR automation not working

- Ensure PR state mapping is configured for the repository
- Verify work item references use correct format with brackets
- Check that referenced work items exist in the project

### Comments not posting as personal account

- Verify your personal GitHub account is connected
- Check token permissions and expiration
- Ensure you're a member of the GitHub organization

## Technical Implementation

### Service Layer

The `GitHubSyncService` handles all synchronization logic:

```python
from plane.app.services.github_sync import GitHubSyncService

# Initialize service
service = GitHubSyncService(repository_sync)

# Sync GitHub issue to Plane
plane_issue = service.sync_github_issue_to_plane(github_issue_data)

# Sync Plane issue to GitHub
github_issue = service.sync_plane_issue_to_github(plane_issue)
```

The `GitHubPRService` handles PR automation:

```python
from plane.app.services.github_sync import GitHubPRService

# Initialize service
pr_service = GitHubPRService(pr_state_mapping)

# Handle PR state change
pr_service.handle_pr_state_change(pr_data, action)
```

### Webhook Processing

Webhooks are processed in the `GithubWebhookEndpoint` view:

1. Signature verification
2. Event type routing
3. Payload processing
4. Service layer invocation
5. Error handling and logging

## Future Enhancements

Potential future improvements:

- Real-time sync via GitHub GraphQL subscriptions
- Advanced conflict resolution for bidirectional sync
- Custom field mapping between GitHub and Plane
- Sync milestones and projects
- Support for GitHub Discussions
- Bulk import/export functionality
- Sync analytics and reporting

## Support

For issues and questions:

- GitHub Issues: https://github.com/plane/plane/issues
- Documentation: https://docs.plane.so/integrations/github
- Community: https://discord.gg/plane

## License

This integration is part of the Plane project and follows the same license terms.
