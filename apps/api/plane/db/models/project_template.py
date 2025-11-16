# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel


class ProjectTemplate(BaseModel):
    """Model to store project templates for workspace"""

    NETWORK_CHOICES = ((0, "Secret"), (2, "Public"))

    # Basic Information
    name = models.CharField(max_length=255, verbose_name="Template Name")
    description = models.TextField(verbose_name="Template Description", blank=True)
    description_text = models.JSONField(
        verbose_name="Template Description RT", blank=True, null=True
    )
    description_html = models.JSONField(
        verbose_name="Template Description HTML", blank=True, null=True
    )

    # Workspace Relation
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="project_templates"
    )

    # Cover Image
    cover_image = models.TextField(blank=True, null=True)
    cover_image_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="template_cover_image",
    )

    # Project Properties (Default values for projects created from this template)
    network = models.PositiveSmallIntegerField(
        default=2, choices=NETWORK_CHOICES, verbose_name="Default Visibility"
    )
    project_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="template_project_lead",
        null=True,
        blank=True,
    )
    default_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="template_default_assignee",
        null=True,
        blank=True,
    )

    # Optional Features Configuration
    # These determine which features will be enabled in projects created from this template
    module_view = models.BooleanField(default=False, verbose_name="Enable Modules")
    cycle_view = models.BooleanField(default=False, verbose_name="Enable Cycles")
    issue_views_view = models.BooleanField(default=False, verbose_name="Enable Issue Views")
    page_view = models.BooleanField(default=True, verbose_name="Enable Pages")
    intake_view = models.BooleanField(default=False, verbose_name="Enable Intake")
    is_issue_type_enabled = models.BooleanField(default=False, verbose_name="Enable Issue Types")
    is_time_tracking_enabled = models.BooleanField(default=False, verbose_name="Enable Time Tracking")

    # Template Content Configuration
    # These store the actual data to be copied when creating a project from this template
    include_states = models.BooleanField(default=False, verbose_name="Include Custom States")
    states_config = models.JSONField(
        default=list,
        blank=True,
        verbose_name="States Configuration",
        help_text="List of states to create in projects from this template"
    )

    include_labels = models.BooleanField(default=False, verbose_name="Include Labels")
    labels_config = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Labels Configuration",
        help_text="List of labels to create in projects from this template"
    )

    include_issue_types = models.BooleanField(default=False, verbose_name="Include Issue Types")
    issue_types_config = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Issue Types Configuration",
        help_text="List of issue types to create in projects from this template"
    )

    # Initial Work Items
    include_work_items = models.BooleanField(default=False, verbose_name="Include Initial Work Items")
    work_items_config = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Initial Work Items Configuration",
        help_text="List of initial issues/tasks to create in projects from this template"
    )

    # Metadata
    emoji = models.CharField(max_length=255, null=True, blank=True)
    icon_prop = models.JSONField(null=True)
    logo_props = models.JSONField(default=dict)

    # Usage tracking
    usage_count = models.IntegerField(
        default=0,
        verbose_name="Usage Count",
        help_text="Number of times this template has been used"
    )
    last_used_at = models.DateTimeField(null=True, blank=True)

    @property
    def cover_image_url(self):
        """Return cover image url"""
        if self.cover_image_asset:
            return self.cover_image_asset.asset_url

        if self.cover_image:
            return self.cover_image

        return None

    def __str__(self):
        """Return name of the template"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = [
            ["name", "workspace", "deleted_at"],
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="project_template_unique_name_workspace_when_deleted_at_null",
            ),
        ]
        verbose_name = "Project Template"
        verbose_name_plural = "Project Templates"
        db_table = "project_templates"
        ordering = ("-created_at",)
