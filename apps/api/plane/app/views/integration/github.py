# Python imports
import os
import json
import hmac
import hashlib
import requests
from datetime import datetime, timedelta

# Django imports
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.views import View
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.views import BaseAPIView, BaseViewSet
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import (
    IntegrationSerializer,
    WorkspaceIntegrationSerializer,
    GithubRepositorySerializer,
    GithubRepositorySyncSerializer,
    GithubPRStateMappingSerializer,
    GithubUserConnectionSerializer,
)
from plane.db.models import (
    Integration,
    WorkspaceIntegration,
    GithubRepository,
    GithubRepositorySync,
    GithubIssueSync,
    GithubCommentSync,
    GithubUserConnection,
    GithubPRStateMapping,
    GithubPRSync,
    Workspace,
    Project,
    Issue,
    IssueComment,
    State,
    Label,
    User,
)
from plane.license.utils.instance_value import get_configuration_value
from plane.utils.exception_logger import log_exception


class GithubIntegrationViewSet(BaseViewSet):
    """
    ViewSet for managing GitHub integration at workspace level
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        """
        Install GitHub App and create workspace integration
        Expected data:
        {
            "installation_id": "github_app_installation_id",
            "repositories": ["repo1", "repo2"] or "all"
        }
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            installation_id = request.data.get("installation_id")

            if not installation_id:
                return Response(
                    {"error": "Installation ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create GitHub integration
            integration, _ = Integration.objects.get_or_create(
                provider="github",
                defaults={
                    "title": "GitHub",
                    "description": {"info": "Connect GitHub repositories to Plane"},
                    "author": "Plane",
                    "verified": True,
                }
            )

            # Check if workspace already has GitHub integration
            if WorkspaceIntegration.objects.filter(
                workspace=workspace,
                integration=integration
            ).exists():
                return Response(
                    {"error": "GitHub integration already exists for this workspace"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create API token for the integration bot
            from plane.db.models import APIToken
            api_token = APIToken.objects.create(
                user=request.user,
                label=f"GitHub Integration - {workspace.name}",
                workspace=workspace,
            )

            # Create workspace integration
            workspace_integration = WorkspaceIntegration.objects.create(
                workspace=workspace,
                integration=integration,
                actor=request.user,
                api_token=api_token,
                metadata={
                    "installation_id": installation_id,
                },
                config=request.data.get("config", {})
            )

            serializer = WorkspaceIntegrationSerializer(workspace_integration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to create GitHub integration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def list(self, request, slug):
        """List all integrations for a workspace"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            integrations = WorkspaceIntegration.objects.filter(
                workspace=workspace,
                integration__provider="github"
            ).select_related("integration", "actor")

            serializer = WorkspaceIntegrationSerializer(integrations, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to fetch integrations"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        """Remove GitHub integration"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            workspace_integration = WorkspaceIntegration.objects.get(
                pk=pk,
                workspace=workspace,
                integration__provider="github"
            )

            # Delete the integration
            workspace_integration.delete()

            return Response(
                {"message": "Integration deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except (Workspace.DoesNotExist, WorkspaceIntegration.DoesNotExist):
            return Response(
                {"error": "Integration not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to delete integration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GithubRepositorySyncViewSet(BaseViewSet):
    """
    ViewSet for managing GitHub repository sync with Plane projects
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug, project_id):
        """
        Create a new repository sync for a project
        Expected data:
        {
            "repository": {
                "name": "repo-name",
                "owner": "owner-name",
                "repository_id": 12345,
                "url": "https://github.com/owner/repo"
            },
            "sync_direction": "unidirectional" or "bidirectional",
            "github_open_state": "state_id",
            "github_closed_state": "state_id"
        }
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            # Get workspace integration
            workspace_integration = WorkspaceIntegration.objects.filter(
                workspace=workspace,
                integration__provider="github"
            ).first()

            if not workspace_integration:
                return Response(
                    {"error": "GitHub integration not found for this workspace"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create or get repository
            repo_data = request.data.get("repository", {})
            repository, _ = GithubRepository.objects.get_or_create(
                repository_id=repo_data.get("repository_id"),
                project=project,
                workspace=workspace,
                defaults={
                    "name": repo_data.get("name"),
                    "owner": repo_data.get("owner"),
                    "url": repo_data.get("url"),
                    "created_by": request.user,
                    "updated_by": request.user,
                }
            )

            # Create repository sync
            github_open_state_id = request.data.get("github_open_state")
            github_closed_state_id = request.data.get("github_closed_state")

            repo_sync = GithubRepositorySync.objects.create(
                repository=repository,
                project=project,
                workspace=workspace,
                actor=request.user,
                workspace_integration=workspace_integration,
                sync_direction=request.data.get("sync_direction", "unidirectional"),
                github_open_state_id=github_open_state_id if github_open_state_id else None,
                github_closed_state_id=github_closed_state_id if github_closed_state_id else None,
                created_by=request.user,
                updated_by=request.user,
            )

            serializer = GithubRepositorySyncSerializer(repo_sync)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except (Workspace.DoesNotExist, Project.DoesNotExist):
            return Response(
                {"error": "Workspace or Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, project_id):
        """List all repository syncs for a project"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            syncs = GithubRepositorySync.objects.filter(
                project=project
            ).select_related("repository", "workspace_integration", "github_open_state", "github_closed_state")

            serializer = GithubRepositorySyncSerializer(syncs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except (Workspace.DoesNotExist, Project.DoesNotExist):
            return Response(
                {"error": "Workspace or Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to fetch repository syncs"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, project_id, pk):
        """Update repository sync configuration"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            repo_sync = GithubRepositorySync.objects.get(
                pk=pk,
                project=project
            )

            # Update allowed fields
            if "sync_direction" in request.data:
                repo_sync.sync_direction = request.data["sync_direction"]
            if "github_open_state" in request.data:
                repo_sync.github_open_state_id = request.data["github_open_state"]
            if "github_closed_state" in request.data:
                repo_sync.github_closed_state_id = request.data["github_closed_state"]

            repo_sync.updated_by = request.user
            repo_sync.save()

            serializer = GithubRepositorySyncSerializer(repo_sync)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except (Workspace.DoesNotExist, Project.DoesNotExist, GithubRepositorySync.DoesNotExist):
            return Response(
                {"error": "Repository sync not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to update repository sync"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, project_id, pk):
        """Delete repository sync"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            repo_sync = GithubRepositorySync.objects.get(
                pk=pk,
                project=project
            )

            repo_sync.delete()

            return Response(
                {"message": "Repository sync deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except (Workspace.DoesNotExist, Project.DoesNotExist, GithubRepositorySync.DoesNotExist):
            return Response(
                {"error": "Repository sync not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to delete repository sync"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GithubPRStateMappingViewSet(BaseViewSet):
    """
    ViewSet for managing GitHub PR state mappings
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug, project_id):
        """
        Create PR state mapping for a project
        Expected data:
        {
            "repository_id": "repo_id",
            "pr_draft_state": "state_id",
            "pr_opened_state": "state_id",
            "pr_review_requested_state": "state_id",
            "pr_approved_state": "state_id",
            "pr_merged_state": "state_id",
            "pr_closed_state": "state_id"
        }
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            workspace_integration = WorkspaceIntegration.objects.filter(
                workspace=workspace,
                integration__provider="github"
            ).first()

            if not workspace_integration:
                return Response(
                    {"error": "GitHub integration not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            repository = GithubRepository.objects.get(
                pk=request.data.get("repository_id"),
                project=project
            )

            # Create PR state mapping
            pr_mapping = GithubPRStateMapping.objects.create(
                project=project,
                workspace=workspace,
                workspace_integration=workspace_integration,
                repository=repository,
                pr_draft_state_id=request.data.get("pr_draft_state"),
                pr_opened_state_id=request.data.get("pr_opened_state"),
                pr_review_requested_state_id=request.data.get("pr_review_requested_state"),
                pr_approved_state_id=request.data.get("pr_approved_state"),
                pr_merged_state_id=request.data.get("pr_merged_state"),
                pr_closed_state_id=request.data.get("pr_closed_state"),
                created_by=request.user,
                updated_by=request.user,
            )

            serializer = GithubPRStateMappingSerializer(pr_mapping)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except (Workspace.DoesNotExist, Project.DoesNotExist, GithubRepository.DoesNotExist):
            return Response(
                {"error": "Workspace, Project, or Repository not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, project_id):
        """List all PR state mappings for a project"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            mappings = GithubPRStateMapping.objects.filter(
                project=project
            ).select_related("repository")

            serializer = GithubPRStateMappingSerializer(mappings, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except (Workspace.DoesNotExist, Project.DoesNotExist):
            return Response(
                {"error": "Workspace or Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to fetch PR state mappings"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, project_id, pk):
        """Update PR state mapping"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            pr_mapping = GithubPRStateMapping.objects.get(
                pk=pk,
                project=project
            )

            # Update state mappings
            for field in [
                "pr_draft_state",
                "pr_opened_state",
                "pr_review_requested_state",
                "pr_approved_state",
                "pr_merged_state",
                "pr_closed_state"
            ]:
                if field in request.data:
                    setattr(pr_mapping, f"{field}_id", request.data[field])

            pr_mapping.updated_by = request.user
            pr_mapping.save()

            serializer = GithubPRStateMappingSerializer(pr_mapping)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except (Workspace.DoesNotExist, Project.DoesNotExist, GithubPRStateMapping.DoesNotExist):
            return Response(
                {"error": "PR state mapping not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to update PR state mapping"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, project_id, pk):
        """Delete PR state mapping"""
        try:
            workspace = Workspace.objects.get(slug=slug)
            project = Project.objects.get(pk=project_id, workspace=workspace)

            pr_mapping = GithubPRStateMapping.objects.get(
                pk=pk,
                project=project
            )

            pr_mapping.delete()

            return Response(
                {"message": "PR state mapping deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except (Workspace.DoesNotExist, Project.DoesNotExist, GithubPRStateMapping.DoesNotExist):
            return Response(
                {"error": "PR state mapping not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to delete PR state mapping"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GithubUserConnectionViewSet(BaseViewSet):
    """
    ViewSet for managing personal GitHub account connections
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        """List user's GitHub connections for a workspace"""
        try:
            workspace = Workspace.objects.get(slug=slug)

            connections = GithubUserConnection.objects.filter(
                workspace=workspace,
                user=request.user
            ).select_related("workspace_integration")

            serializer = GithubUserConnectionSerializer(connections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to fetch GitHub connections"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        """Remove user's GitHub connection"""
        try:
            workspace = Workspace.objects.get(slug=slug)

            connection = GithubUserConnection.objects.get(
                pk=pk,
                workspace=workspace,
                user=request.user
            )

            connection.delete()

            return Response(
                {"message": "GitHub connection removed successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except (Workspace.DoesNotExist, GithubUserConnection.DoesNotExist):
            return Response(
                {"error": "GitHub connection not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to remove GitHub connection"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GithubOAuthCallbackEndpoint(BaseAPIView):
    """
    Handle GitHub OAuth callback for personal account connection
    """
    permission_classes = []

    def get(self, request):
        """
        Handle OAuth callback from GitHub
        Query params: code, state
        """
        try:
            code = request.GET.get("code")
            state = request.GET.get("state")

            if not code or not state:
                return Response(
                    {"error": "Missing code or state parameter"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decode state to get workspace and user info
            # State format: "workspace_id:user_id:redirect_url"
            state_parts = state.split(":")
            if len(state_parts) < 2:
                return Response(
                    {"error": "Invalid state parameter"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            workspace_id = state_parts[0]
            user_id = state_parts[1]
            redirect_url = ":".join(state_parts[2:]) if len(state_parts) > 2 else "/"

            # Exchange code for access token
            GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET = get_configuration_value([
                {"key": "GITHUB_CLIENT_ID", "default": os.environ.get("GITHUB_CLIENT_ID")},
                {"key": "GITHUB_CLIENT_SECRET", "default": os.environ.get("GITHUB_CLIENT_SECRET")},
            ])

            token_response = requests.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                }
            )

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                return Response(
                    {"error": "Failed to get access token from GitHub"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get user info from GitHub
            user_response = requests.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )

            github_user = user_response.json()

            # Get workspace integration
            workspace = Workspace.objects.get(pk=workspace_id)
            workspace_integration = WorkspaceIntegration.objects.filter(
                workspace=workspace,
                integration__provider="github"
            ).first()

            if not workspace_integration:
                return Response(
                    {"error": "GitHub integration not found for this workspace"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create or update user connection
            user = User.objects.get(pk=user_id)
            connection, created = GithubUserConnection.objects.update_or_create(
                user=user,
                workspace=workspace,
                defaults={
                    "workspace_integration": workspace_integration,
                    "github_user_id": github_user.get("id"),
                    "github_username": github_user.get("login"),
                    "github_email": github_user.get("email"),
                    "github_avatar_url": github_user.get("avatar_url"),
                    "access_token": access_token,
                    "scopes": token_data.get("scope", ""),
                    "created_by": user,
                    "updated_by": user,
                }
            )

            # Redirect back to frontend
            return HttpResponseRedirect(redirect_url)

        except Exception as e:
            log_exception(e)
            return Response(
                {"error": "Failed to connect GitHub account"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GithubWebhookEndpoint(View):
    """
    Handle GitHub webhook events for syncing issues and PRs
    """

    def post(self, request):
        """
        Handle incoming GitHub webhook events
        """
        try:
            # Verify webhook signature
            signature = request.headers.get("X-Hub-Signature-256")
            if not self.verify_signature(request.body, signature):
                return HttpResponse("Unauthorized", status=401)

            # Get event type
            event_type = request.headers.get("X-GitHub-Event")

            # Parse payload
            payload = json.loads(request.body)

            # Route to appropriate handler
            if event_type == "issues":
                self.handle_issue_event(payload)
            elif event_type == "issue_comment":
                self.handle_comment_event(payload)
            elif event_type == "pull_request":
                self.handle_pr_event(payload)
            elif event_type == "pull_request_review":
                self.handle_pr_review_event(payload)

            return HttpResponse("OK", status=200)

        except Exception as e:
            log_exception(e)
            return HttpResponse("Internal Server Error", status=500)

    def verify_signature(self, payload_body, signature_header):
        """Verify GitHub webhook signature"""
        if not signature_header:
            return False

        # Get webhook secret from configuration
        GITHUB_WEBHOOK_SECRET = get_configuration_value([
            {"key": "GITHUB_WEBHOOK_SECRET", "default": os.environ.get("GITHUB_WEBHOOK_SECRET")},
        ])[0]

        if not GITHUB_WEBHOOK_SECRET:
            return False

        hash_object = hmac.new(
            GITHUB_WEBHOOK_SECRET.encode('utf-8'),
            msg=payload_body,
            digestmod=hashlib.sha256
        )
        expected_signature = "sha256=" + hash_object.hexdigest()

        return hmac.compare_digest(expected_signature, signature_header)

    def handle_issue_event(self, payload):
        """Handle GitHub issue events (opened, closed, edited, labeled, etc.)"""
        # Implementation for handling issue sync
        # This would be implemented in a separate service module
        pass

    def handle_comment_event(self, payload):
        """Handle GitHub issue comment events"""
        # Implementation for handling comment sync
        pass

    def handle_pr_event(self, payload):
        """Handle GitHub pull request events"""
        # Implementation for handling PR state automation
        pass

    def handle_pr_review_event(self, payload):
        """Handle GitHub pull request review events"""
        # Implementation for handling PR review state changes
        pass
