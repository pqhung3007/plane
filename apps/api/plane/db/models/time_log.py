# Django imports
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q

# Module imports
from .project import ProjectBaseModel


class TimeLog(ProjectBaseModel):
    """
    TimeLog model to track time spent on issues/work items.

    Attributes:
        issue: The issue this time log is associated with
        user: The user who logged the time
        duration_minutes: Time spent in minutes
        logged_date: Date when the work was performed
        description: Optional notes about the work done
        billable: Whether this time is billable (optional, defaults to False)
    """
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="time_logs"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="time_logs"
    )
    duration_minutes = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Time spent in minutes"
    )
    logged_date = models.DateField(
        help_text="Date when the work was performed"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes about the work done"
    )
    billable = models.BooleanField(
        default=False,
        help_text="Whether this time is billable"
    )

    class Meta:
        verbose_name = "Time Log"
        verbose_name_plural = "Time Logs"
        db_table = "time_logs"
        ordering = ("-logged_date", "-created_at")
        indexes = [
            models.Index(fields=["issue", "logged_date"]),
            models.Index(fields=["user", "logged_date"]),
            models.Index(fields=["workspace", "logged_date"]),
            models.Index(fields=["project", "logged_date"]),
        ]

    def __str__(self):
        hours = self.duration_minutes // 60
        minutes = self.duration_minutes % 60
        return f"{self.issue.name} - {hours}h {minutes}m by {self.user.email}"

    @property
    def duration_hours(self):
        """Return duration in decimal hours (e.g., 1.5 for 1 hour 30 minutes)"""
        return self.duration_minutes / 60.0
