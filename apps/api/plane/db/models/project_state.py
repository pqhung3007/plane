# Django imports
from django.db import models
from django.template.defaultfilters import slugify
from django.db.models import Q

# Module imports
from .workspace import WorkspaceBaseModel


class ProjectState(WorkspaceBaseModel):
    """
    Model to represent project states at workspace level
    """
    name = models.CharField(max_length=255, verbose_name="Project State Name")
    description = models.TextField(verbose_name="Project State Description", blank=True)
    color = models.CharField(max_length=255, verbose_name="Project State Color", default="#3f76ff")
    slug = models.SlugField(max_length=100, blank=True)
    sequence = models.FloatField(default=65535)
    group = models.CharField(
        choices=(
            ("draft", "Draft"),
            ("planning", "Planning"),
            ("execution", "Execution"),
            ("monitoring", "Monitoring"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ),
        default="draft",
        max_length=20,
    )
    is_default = models.BooleanField(default=False)

    def __str__(self):
        """Return name of the project state"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="project_state_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Project State"
        verbose_name_plural = "Project States"
        db_table = "project_states"
        ordering = ("sequence",)

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        if self._state.adding:
            # Get the maximum sequence value from the database
            last_id = ProjectState.objects.filter(workspace=self.workspace).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            # if last_id is not None
            if last_id is not None:
                self.sequence = last_id + 15000

        return super().save(*args, **kwargs)
