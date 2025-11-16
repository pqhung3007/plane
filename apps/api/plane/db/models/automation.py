# Python imports
from enum import Enum

# Django imports
from django.db import models
from django.contrib.postgres.fields import ArrayField

# Module imports
from .base import BaseModel
from .project import ProjectBaseModel


class AutomationTriggerType(Enum):
    """Enum for automation trigger types"""
    ISSUE_CREATED = "issue_created"
    ISSUE_UPDATED = "issue_updated"
    STATE_CHANGED = "state_changed"
    ASSIGNEE_CHANGED = "assignee_changed"
    COMMENT_CREATED = "comment_created"

    @classmethod
    def choices(cls):
        return [(trigger.value, trigger.name.replace("_", " ").title()) for trigger in cls]


class AutomationConditionField(Enum):
    """Enum for automation condition fields"""
    STATE = "state"
    PRIORITY = "priority"
    LABEL = "label"
    ASSIGNEE = "assignee"
    CREATED_BY = "created_by"
    ISSUE_TYPE = "issue_type"

    @classmethod
    def choices(cls):
        return [(field.value, field.name.replace("_", " ").title()) for field in cls]


class AutomationConditionOperator(Enum):
    """Enum for automation condition operators"""
    IS = "is"
    IS_NOT = "is_not"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"

    @classmethod
    def choices(cls):
        return [(op.value, op.name.replace("_", " ").title()) for op in cls]


class AutomationActionType(Enum):
    """Enum for automation action types"""
    ADD_COMMENT = "add_comment"
    CHANGE_STATE = "change_state"
    CHANGE_PRIORITY = "change_priority"
    ADD_ASSIGNEE = "add_assignee"
    REMOVE_ASSIGNEE = "remove_assignee"
    ADD_LABEL = "add_label"
    REMOVE_LABEL = "remove_label"
    SET_START_DATE = "set_start_date"
    SET_DUE_DATE = "set_due_date"

    @classmethod
    def choices(cls):
        return [(action.value, action.name.replace("_", " ").title()) for action in cls]


class ProjectAutomation(ProjectBaseModel):
    """
    Workflow automation rules for projects.

    Automations follow the pattern: When [trigger] happens, if [conditions] are met, then perform [actions].
    """

    # Basic info
    name = models.CharField(max_length=255, verbose_name="Automation Name")
    description = models.TextField(blank=True, verbose_name="Automation Description")
    is_active = models.BooleanField(default=True, verbose_name="Is Active")

    # Trigger configuration
    trigger_type = models.CharField(
        max_length=50,
        choices=AutomationTriggerType.choices(),
        verbose_name="Trigger Type"
    )
    trigger_config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Trigger Configuration",
        help_text="Additional trigger configuration (e.g., specific state transitions)"
    )

    # Conditions (filters that must be met)
    conditions = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Conditions",
        help_text="Array of condition objects: [{field, operator, value}]"
    )

    # Actions (what to do when triggered)
    actions = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Actions",
        help_text="Array of action objects: [{type, config}]"
    )

    # Execution metadata
    execution_count = models.IntegerField(
        default=0,
        verbose_name="Execution Count",
        help_text="Number of times this automation has been executed"
    )
    last_executed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Executed At"
    )

    # Ordering
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Project Automation"
        verbose_name_plural = "Project Automations"
        db_table = "project_automations"
        ordering = ("sort_order", "-created_at")
        indexes = [
            models.Index(fields=["project", "is_active"]),
            models.Index(fields=["trigger_type", "is_active"]),
        ]

    def __str__(self):
        return f"{self.project.name} - {self.name}"


class AutomationLog(ProjectBaseModel):
    """
    Log of automation executions for auditing and debugging.
    """

    # Related models
    automation = models.ForeignKey(
        ProjectAutomation,
        on_delete=models.CASCADE,
        related_name="logs",
        verbose_name="Automation"
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="automation_logs",
        verbose_name="Issue"
    )

    # Execution details
    trigger_type = models.CharField(
        max_length=50,
        verbose_name="Trigger Type",
        help_text="Snapshot of trigger type at execution time"
    )
    conditions_met = models.BooleanField(
        default=False,
        verbose_name="Conditions Met",
        help_text="Whether the conditions were met for this execution"
    )

    # Status and results
    STATUS_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
        ("skipped", "Skipped"),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="success",
        verbose_name="Status"
    )

    # Actions executed
    actions_executed = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Actions Executed",
        help_text="List of actions that were executed"
    )

    # Error tracking
    error_message = models.TextField(
        blank=True,
        verbose_name="Error Message",
        help_text="Error message if execution failed"
    )
    error_details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Error Details"
    )

    # Execution metadata
    execution_time_ms = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Execution Time (ms)",
        help_text="Time taken to execute the automation in milliseconds"
    )

    class Meta:
        verbose_name = "Automation Log"
        verbose_name_plural = "Automation Logs"
        db_table = "automation_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["automation", "-created_at"]),
            models.Index(fields=["issue", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.automation.name} - {self.issue.sequence_id} - {self.status}"
