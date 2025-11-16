# Generated manually on 2025-11-16

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0107_migrate_filters_to_rich_filters"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectTemplate",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, verbose_name="Last Modified At"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("name", models.CharField(max_length=255, verbose_name="Template Name")),
                ("description", models.TextField(verbose_name="Template Description", blank=True)),
                (
                    "description_text",
                    models.JSONField(
                        verbose_name="Template Description RT", blank=True, null=True
                    ),
                ),
                (
                    "description_html",
                    models.JSONField(
                        verbose_name="Template Description HTML", blank=True, null=True
                    ),
                ),
                ("cover_image", models.TextField(blank=True, null=True)),
                (
                    "network",
                    models.PositiveSmallIntegerField(
                        default=2,
                        choices=[(0, "Secret"), (2, "Public")],
                        verbose_name="Default Visibility",
                    ),
                ),
                ("module_view", models.BooleanField(default=False, verbose_name="Enable Modules")),
                ("cycle_view", models.BooleanField(default=False, verbose_name="Enable Cycles")),
                ("issue_views_view", models.BooleanField(default=False, verbose_name="Enable Issue Views")),
                ("page_view", models.BooleanField(default=True, verbose_name="Enable Pages")),
                ("intake_view", models.BooleanField(default=False, verbose_name="Enable Intake")),
                ("is_issue_type_enabled", models.BooleanField(default=False, verbose_name="Enable Issue Types")),
                ("is_time_tracking_enabled", models.BooleanField(default=False, verbose_name="Enable Time Tracking")),
                ("include_states", models.BooleanField(default=False, verbose_name="Include Custom States")),
                (
                    "states_config",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="States Configuration",
                        help_text="List of states to create in projects from this template",
                    ),
                ),
                ("include_labels", models.BooleanField(default=False, verbose_name="Include Labels")),
                (
                    "labels_config",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="Labels Configuration",
                        help_text="List of labels to create in projects from this template",
                    ),
                ),
                ("include_issue_types", models.BooleanField(default=False, verbose_name="Include Issue Types")),
                (
                    "issue_types_config",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="Issue Types Configuration",
                        help_text="List of issue types to create in projects from this template",
                    ),
                ),
                ("include_work_items", models.BooleanField(default=False, verbose_name="Include Initial Work Items")),
                (
                    "work_items_config",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="Initial Work Items Configuration",
                        help_text="List of initial issues/tasks to create in projects from this template",
                    ),
                ),
                ("emoji", models.CharField(max_length=255, null=True, blank=True)),
                ("icon_prop", models.JSONField(null=True)),
                ("logo_props", models.JSONField(default=dict)),
                (
                    "usage_count",
                    models.IntegerField(
                        default=0,
                        verbose_name="Usage Count",
                        help_text="Number of times this template has been used",
                    ),
                ),
                ("last_used_at", models.DateTimeField(null=True, blank=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_templates",
                        to="db.workspace",
                    ),
                ),
                (
                    "project_lead",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="template_project_lead",
                        null=True,
                        blank=True,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "default_assignee",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="template_default_assignee",
                        null=True,
                        blank=True,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "cover_image_asset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.SET_NULL,
                        null=True,
                        blank=True,
                        related_name="template_cover_image",
                        to="db.fileasset",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Template",
                "verbose_name_plural": "Project Templates",
                "db_table": "project_templates",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="projecttemplate",
            constraint=models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="project_template_unique_name_workspace_when_deleted_at_null",
            ),
        ),
    ]
