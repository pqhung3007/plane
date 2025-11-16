# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from .user import UserLiteSerializer
from .project import ProjectLiteSerializer

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
    State,
)


class IntegrationSerializer(BaseSerializer):
    class Meta:
        model = Integration
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class WorkspaceIntegrationSerializer(DynamicBaseSerializer):
    integration = IntegrationSerializer(read_only=True)

    class Meta:
        model = WorkspaceIntegration
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
        ]


class GithubRepositorySerializer(BaseSerializer):
    class Meta:
        model = GithubRepository
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
        ]


class GithubRepositorySyncSerializer(DynamicBaseSerializer):
    repository = GithubRepositorySerializer(read_only=True)
    github_open_state_detail = serializers.SerializerMethodField()
    github_closed_state_detail = serializers.SerializerMethodField()

    def get_github_open_state_detail(self, obj):
        if obj.github_open_state:
            return {
                "id": str(obj.github_open_state.id),
                "name": obj.github_open_state.name,
                "color": obj.github_open_state.color,
            }
        return None

    def get_github_closed_state_detail(self, obj):
        if obj.github_closed_state:
            return {
                "id": str(obj.github_closed_state.id),
                "name": obj.github_closed_state.name,
                "color": obj.github_closed_state.color,
            }
        return None

    class Meta:
        model = GithubRepositorySync
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
        ]


class GithubIssueSyncSerializer(BaseSerializer):
    issue_detail = serializers.SerializerMethodField()
    repository_detail = serializers.SerializerMethodField()

    def get_issue_detail(self, obj):
        return {
            "id": str(obj.issue.id),
            "sequence_id": obj.issue.sequence_id,
            "name": obj.issue.name,
        }

    def get_repository_detail(self, obj):
        return {
            "id": str(obj.repository_sync.repository.id),
            "name": obj.repository_sync.repository.name,
            "owner": obj.repository_sync.repository.owner,
        }

    class Meta:
        model = GithubIssueSync
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
        ]


class GithubCommentSyncSerializer(BaseSerializer):
    class Meta:
        model = GithubCommentSync
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
        ]


class GithubUserConnectionSerializer(BaseSerializer):
    user_detail = UserLiteSerializer(source="user", read_only=True)

    class Meta:
        model = GithubUserConnection
        fields = [
            "id",
            "user",
            "user_detail",
            "workspace",
            "workspace_integration",
            "github_user_id",
            "github_username",
            "github_email",
            "github_avatar_url",
            "scopes",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "github_user_id",
            "github_username",
            "github_email",
            "github_avatar_url",
            "scopes",
        ]
        # Exclude sensitive fields from serialization
        extra_kwargs = {
            "access_token": {"write_only": True},
            "refresh_token": {"write_only": True},
        }


class GithubPRStateMappingSerializer(DynamicBaseSerializer):
    repository_detail = GithubRepositorySerializer(source="repository", read_only=True)
    project_detail = ProjectLiteSerializer(source="project", read_only=True)

    pr_draft_state_detail = serializers.SerializerMethodField()
    pr_opened_state_detail = serializers.SerializerMethodField()
    pr_review_requested_state_detail = serializers.SerializerMethodField()
    pr_approved_state_detail = serializers.SerializerMethodField()
    pr_merged_state_detail = serializers.SerializerMethodField()
    pr_closed_state_detail = serializers.SerializerMethodField()

    def get_state_detail(self, state):
        if state:
            return {
                "id": str(state.id),
                "name": state.name,
                "color": state.color,
            }
        return None

    def get_pr_draft_state_detail(self, obj):
        return self.get_state_detail(obj.pr_draft_state)

    def get_pr_opened_state_detail(self, obj):
        return self.get_state_detail(obj.pr_opened_state)

    def get_pr_review_requested_state_detail(self, obj):
        return self.get_state_detail(obj.pr_review_requested_state)

    def get_pr_approved_state_detail(self, obj):
        return self.get_state_detail(obj.pr_approved_state)

    def get_pr_merged_state_detail(self, obj):
        return self.get_state_detail(obj.pr_merged_state)

    def get_pr_closed_state_detail(self, obj):
        return self.get_state_detail(obj.pr_closed_state)

    class Meta:
        model = GithubPRStateMapping
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
        ]


class GithubPRSyncSerializer(BaseSerializer):
    repository_detail = GithubRepositorySerializer(source="repository", read_only=True)
    linked_issues_detail = serializers.SerializerMethodField()

    def get_linked_issues_detail(self, obj):
        return [
            {
                "id": str(issue.id),
                "sequence_id": issue.sequence_id,
                "name": issue.name,
            }
            for issue in obj.linked_issues.all()
        ]

    class Meta:
        model = GithubPRSync
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "project",
            "workspace",
        ]
