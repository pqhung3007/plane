# Django imports
from django.db import models
from django.conf import settings

# Module imports
from .project import ProjectBaseModel


class WorkItemTemplate(ProjectBaseModel):
    """
    Reusable template for creating work items with predefined properties.
    Templates can be used to streamline work item creation and ensure consistency.
    """

    name = models.CharField(max_length=255, verbose_name="Template Name")
    description = models.TextField(verbose_name="Template Description", blank=True)

    # Reference to issue type if type-specific templates are needed
    type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.SET_NULL,
        related_name="work_item_templates",
        null=True,
        blank=True,
    )

    # Template properties stored as JSON for flexibility
    # Contains default values for: name, description_html, state_id, priority,
    # label_ids, assignee_ids, module_ids, estimate_point, start_date, target_date, etc.
    properties = models.JSONField(default=dict, verbose_name="Template Properties")

    # Metadata
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_work_item_templates",
        null=True,
        blank=True,
    )

    # Usage tracking
    usage_count = models.IntegerField(default=0, verbose_name="Usage Count")
    last_used_at = models.DateTimeField(null=True, blank=True, verbose_name="Last Used At")

    # Ordering
    sort_order = models.FloatField(default=65535, verbose_name="Sort Order")

    # External integrations
    external_source = models.CharField(max_length=255, null=True, blank=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        """Return name of the template"""
        return f"{self.name} <{self.project.name}>"

    class Meta:
        verbose_name = "Work Item Template"
        verbose_name_plural = "Work Item Templates"
        db_table = "work_item_templates"
        ordering = ("sort_order", "name")
        indexes = [
            models.Index(fields=["project", "deleted_at"]),
            models.Index(fields=["workspace", "deleted_at"]),
            models.Index(fields=["type", "deleted_at"]),
        ]

    def save(self, *args, **kwargs):
        # Set owner to created_by if not already set
        if self._state.adding and not self.owner:
            self.owner = self.created_by

        # Calculate sort order if not set
        if self._state.adding and self.sort_order == 65535:
            last_template = WorkItemTemplate.objects.filter(
                project=self.project
            ).aggregate(largest=models.Max("sort_order"))["largest"]

            if last_template is not None:
                self.sort_order = last_template + 10000

        return super().save(*args, **kwargs)

    def increment_usage(self):
        """Increment usage count and update last used timestamp"""
        from django.utils import timezone

        self.usage_count += 1
        self.last_used_at = timezone.now()
        self.save(update_fields=["usage_count", "last_used_at", "updated_at"])
