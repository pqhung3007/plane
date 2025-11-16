from django.urls import path

from plane.app.views import (
    GithubIntegrationViewSet,
    GithubRepositorySyncViewSet,
    GithubPRStateMappingViewSet,
    GithubUserConnectionViewSet,
    GithubWebhookEndpoint,
    GithubOAuthCallbackEndpoint,
)

urlpatterns = [
    # GitHub Integration - Workspace Level
    path(
        "workspaces/<str:slug>/integrations/github/",
        GithubIntegrationViewSet.as_view({"get": "list", "post": "create"}),
        name="github-integration",
    ),
    path(
        "workspaces/<str:slug>/integrations/github/<uuid:pk>/",
        GithubIntegrationViewSet.as_view({"delete": "destroy"}),
        name="github-integration-detail",
    ),

    # GitHub User Connection - Personal Account
    path(
        "workspaces/<str:slug>/integrations/github/user-connections/",
        GithubUserConnectionViewSet.as_view({"get": "list"}),
        name="github-user-connections",
    ),
    path(
        "workspaces/<str:slug>/integrations/github/user-connections/<uuid:pk>/",
        GithubUserConnectionViewSet.as_view({"delete": "destroy"}),
        name="github-user-connection-detail",
    ),

    # GitHub OAuth Callback
    path(
        "integrations/github/callback/",
        GithubOAuthCallbackEndpoint.as_view(),
        name="github-oauth-callback",
    ),

    # GitHub Repository Sync - Project Level
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/integrations/github/repository-syncs/",
        GithubRepositorySyncViewSet.as_view({"get": "list", "post": "create"}),
        name="github-repository-syncs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/integrations/github/repository-syncs/<uuid:pk>/",
        GithubRepositorySyncViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="github-repository-sync-detail",
    ),

    # GitHub PR State Mapping - Project Level
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/integrations/github/pr-state-mappings/",
        GithubPRStateMappingViewSet.as_view({"get": "list", "post": "create"}),
        name="github-pr-state-mappings",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/integrations/github/pr-state-mappings/<uuid:pk>/",
        GithubPRStateMappingViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="github-pr-state-mapping-detail",
    ),

    # GitHub Webhook Endpoint
    path(
        "integrations/github/webhook/",
        GithubWebhookEndpoint.as_view(),
        name="github-webhook",
    ),
]
