# Python imports

# Django imports
from django.db import models

# Module imports
from plane.db.models.project import ProjectBaseModel
from plane.db.models import BaseModel


class GithubRepository(ProjectBaseModel):
    name = models.CharField(max_length=500)
    url = models.URLField(null=True)
    config = models.JSONField(default=dict)
    repository_id = models.BigIntegerField()
    owner = models.CharField(max_length=500)

    def __str__(self):
        """Return the repo name"""
        return f"{self.name}"

    class Meta:
        verbose_name = "Repository"
        verbose_name_plural = "Repositories"
        db_table = "github_repositories"
        ordering = ("-created_at",)


class GithubRepositorySync(ProjectBaseModel):
    SYNC_DIRECTION_CHOICES = (
        ("unidirectional", "Unidirectional (GitHub -> Plane)"),
        ("bidirectional", "Bidirectional"),
    )

    repository = models.OneToOneField("db.GithubRepository", on_delete=models.CASCADE, related_name="syncs")
    credentials = models.JSONField(default=dict)
    # Bot user
    actor = models.ForeignKey("db.User", related_name="user_syncs", on_delete=models.CASCADE)
    workspace_integration = models.ForeignKey(
        "db.WorkspaceIntegration", related_name="github_syncs", on_delete=models.CASCADE
    )
    label = models.ForeignKey("db.Label", on_delete=models.SET_NULL, null=True, related_name="repo_syncs")

    # Sync direction: unidirectional (GitHub -> Plane) or bidirectional
    sync_direction = models.CharField(
        max_length=20,
        choices=SYNC_DIRECTION_CHOICES,
        default="unidirectional"
    )

    # State mappings for issue sync
    # Map GitHub "open" state to Plane state
    github_open_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        related_name="github_open_syncs",
        help_text="Plane state to map when GitHub issue is opened"
    )
    # Map GitHub "closed" state to Plane state
    github_closed_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        related_name="github_closed_syncs",
        help_text="Plane state to map when GitHub issue is closed"
    )

    def __str__(self):
        """Return the repo sync"""
        return f"{self.repository.name} <{self.project.name}>"

    class Meta:
        unique_together = ["project", "repository"]
        verbose_name = "Github Repository Sync"
        verbose_name_plural = "Github Repository Syncs"
        db_table = "github_repository_syncs"
        ordering = ("-created_at",)


class GithubIssueSync(ProjectBaseModel):
    repo_issue_id = models.BigIntegerField()
    github_issue_id = models.BigIntegerField()
    issue_url = models.URLField(blank=False)
    issue = models.ForeignKey("db.Issue", related_name="github_syncs", on_delete=models.CASCADE)
    repository_sync = models.ForeignKey("db.GithubRepositorySync", related_name="issue_syncs", on_delete=models.CASCADE)

    def __str__(self):
        """Return the github issue sync"""
        return f"{self.repository.name}-{self.project.name}-{self.issue.name}"

    class Meta:
        unique_together = ["repository_sync", "issue"]
        verbose_name = "Github Issue Sync"
        verbose_name_plural = "Github Issue Syncs"
        db_table = "github_issue_syncs"
        ordering = ("-created_at",)


class GithubCommentSync(ProjectBaseModel):
    repo_comment_id = models.BigIntegerField()
    comment = models.ForeignKey("db.IssueComment", related_name="comment_syncs", on_delete=models.CASCADE)
    issue_sync = models.ForeignKey("db.GithubIssueSync", related_name="comment_syncs", on_delete=models.CASCADE)

    def __str__(self):
        """Return the github issue sync"""
        return f"{self.comment.id}"

    class Meta:
        unique_together = ["issue_sync", "comment"]
        verbose_name = "Github Comment Sync"
        verbose_name_plural = "Github Comment Syncs"
        db_table = "github_comment_syncs"
        ordering = ("-created_at",)


class GithubUserConnection(BaseModel):
    """Personal GitHub account connection for posting comments"""
    user = models.ForeignKey("db.User", related_name="github_connections", on_delete=models.CASCADE)
    workspace = models.ForeignKey("db.Workspace", related_name="github_user_connections", on_delete=models.CASCADE)
    workspace_integration = models.ForeignKey(
        "db.WorkspaceIntegration",
        related_name="user_connections",
        on_delete=models.CASCADE
    )

    # GitHub user info
    github_user_id = models.BigIntegerField()
    github_username = models.CharField(max_length=255)
    github_email = models.EmailField(null=True, blank=True)
    github_avatar_url = models.URLField(null=True, blank=True)

    # OAuth tokens for personal account
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)

    # Scopes granted
    scopes = models.TextField(default="")

    # Metadata
    metadata = models.JSONField(default=dict)

    def __str__(self):
        """Return the github user connection"""
        return f"{self.user.email} - {self.github_username}"

    class Meta:
        unique_together = ["user", "workspace"]
        verbose_name = "Github User Connection"
        verbose_name_plural = "Github User Connections"
        db_table = "github_user_connections"
        ordering = ("-created_at",)


class GithubPRStateMapping(ProjectBaseModel):
    """Pull Request state automation mapping"""
    PR_STATE_CHOICES = (
        ("draft", "Draft PR Created"),
        ("opened", "PR Opened"),
        ("review_requested", "Review Requested"),
        ("approved", "PR Approved"),
        ("merged", "PR Merged"),
        ("closed", "PR Closed"),
    )

    workspace_integration = models.ForeignKey(
        "db.WorkspaceIntegration",
        related_name="pr_state_mappings",
        on_delete=models.CASCADE
    )
    repository = models.ForeignKey(
        "db.GithubRepository",
        related_name="pr_state_mappings",
        on_delete=models.CASCADE
    )

    # PR state to Plane state mappings
    pr_draft_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_draft_mappings",
        help_text="Plane state when PR is in draft"
    )
    pr_opened_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_opened_mappings",
        help_text="Plane state when PR is opened"
    )
    pr_review_requested_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_review_requested_mappings",
        help_text="Plane state when review is requested"
    )
    pr_approved_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_approved_mappings",
        help_text="Plane state when PR is approved"
    )
    pr_merged_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_merged_mappings",
        help_text="Plane state when PR is merged"
    )
    pr_closed_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pr_closed_mappings",
        help_text="Plane state when PR is closed without merging"
    )

    def __str__(self):
        """Return the PR state mapping"""
        return f"{self.repository.name} - {self.project.name}"

    class Meta:
        unique_together = ["project", "repository"]
        verbose_name = "Github PR State Mapping"
        verbose_name_plural = "Github PR State Mappings"
        db_table = "github_pr_state_mappings"
        ordering = ("-created_at",)


class GithubPRSync(ProjectBaseModel):
    """Track synced Pull Requests"""
    pr_number = models.IntegerField()
    pr_id = models.BigIntegerField()
    pr_url = models.URLField()
    pr_title = models.TextField()
    pr_state = models.CharField(max_length=20)  # draft, open, closed, merged

    repository = models.ForeignKey(
        "db.GithubRepository",
        related_name="pr_syncs",
        on_delete=models.CASCADE
    )

    # Linked Plane issues (can be multiple)
    # Referenced issues are tracked via a separate field
    linked_issues = models.ManyToManyField(
        "db.Issue",
        related_name="github_pr_syncs",
        blank=True
    )

    # Metadata
    metadata = models.JSONField(default=dict)

    def __str__(self):
        """Return the PR sync"""
        return f"PR #{self.pr_number} - {self.repository.name}"

    class Meta:
        unique_together = ["repository", "pr_id"]
        verbose_name = "Github PR Sync"
        verbose_name_plural = "Github PR Syncs"
        db_table = "github_pr_syncs"
        ordering = ("-created_at",)
