# Generated manually for workflow automations feature

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
            name="ProjectAutomation",
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
                (
                    "name",
                    models.CharField(max_length=255, verbose_name="Automation Name"),
                ),
                (
                    "description",
                    models.TextField(blank=True, verbose_name="Automation Description"),
                ),
                (
                    "is_active",
                    models.BooleanField(default=True, verbose_name="Is Active"),
                ),
                (
                    "trigger_type",
                    models.CharField(
                        max_length=50,
                        choices=[
                            ("issue_created", "Issue Created"),
                            ("issue_updated", "Issue Updated"),
                            ("state_changed", "State Changed"),
                            ("assignee_changed", "Assignee Changed"),
                            ("comment_created", "Comment Created"),
                        ],
                        verbose_name="Trigger Type",
                    ),
                ),
                (
                    "trigger_config",
                    models.JSONField(
                        default=dict,
                        blank=True,
                        verbose_name="Trigger Configuration",
                        help_text="Additional trigger configuration (e.g., specific state transitions)",
                    ),
                ),
                (
                    "conditions",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="Conditions",
                        help_text="Array of condition objects: [{field, operator, value}]",
                    ),
                ),
                (
                    "actions",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="Actions",
                        help_text="Array of action objects: [{type, config}]",
                    ),
                ),
                (
                    "execution_count",
                    models.IntegerField(
                        default=0,
                        verbose_name="Execution Count",
                        help_text="Number of times this automation has been executed",
                    ),
                ),
                (
                    "last_executed_at",
                    models.DateTimeField(
                        null=True, blank=True, verbose_name="Last Executed At"
                    ),
                ),
                (
                    "sort_order",
                    models.FloatField(default=65535),
                ),
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
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Project Automation",
                "verbose_name_plural": "Project Automations",
                "db_table": "project_automations",
                "ordering": ("sort_order", "-created_at"),
            },
        ),
        migrations.CreateModel(
            name="AutomationLog",
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
                (
                    "trigger_type",
                    models.CharField(
                        max_length=50,
                        verbose_name="Trigger Type",
                        help_text="Snapshot of trigger type at execution time",
                    ),
                ),
                (
                    "conditions_met",
                    models.BooleanField(
                        default=False,
                        verbose_name="Conditions Met",
                        help_text="Whether the conditions were met for this execution",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        max_length=20,
                        choices=[
                            ("success", "Success"),
                            ("failed", "Failed"),
                            ("skipped", "Skipped"),
                        ],
                        default="success",
                        verbose_name="Status",
                    ),
                ),
                (
                    "actions_executed",
                    models.JSONField(
                        default=list,
                        blank=True,
                        verbose_name="Actions Executed",
                        help_text="List of actions that were executed",
                    ),
                ),
                (
                    "error_message",
                    models.TextField(
                        blank=True,
                        verbose_name="Error Message",
                        help_text="Error message if execution failed",
                    ),
                ),
                (
                    "error_details",
                    models.JSONField(
                        default=dict, blank=True, verbose_name="Error Details"
                    ),
                ),
                (
                    "execution_time_ms",
                    models.IntegerField(
                        null=True,
                        blank=True,
                        verbose_name="Execution Time (ms)",
                        help_text="Time taken to execute the automation in milliseconds",
                    ),
                ),
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
                    "automation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="logs",
                        to="db.projectautomation",
                        verbose_name="Automation",
                    ),
                ),
                (
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_logs",
                        to="db.issue",
                        verbose_name="Issue",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="project_%(class)s",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workspace_%(class)s",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Automation Log",
                "verbose_name_plural": "Automation Logs",
                "db_table": "automation_logs",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="projectautomation",
            index=models.Index(
                fields=["project", "is_active"],
                name="project_aut_project_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="projectautomation",
            index=models.Index(
                fields=["trigger_type", "is_active"],
                name="project_aut_trigger_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="automationlog",
            index=models.Index(
                fields=["automation", "-created_at"],
                name="automation_automation_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="automationlog",
            index=models.Index(
                fields=["issue", "-created_at"],
                name="automation_issue_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="automationlog",
            index=models.Index(
                fields=["status", "-created_at"],
                name="automation_status_idx",
            ),
        ),
    ]
