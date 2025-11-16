# Module imports
from .base import BaseSerializer
from plane.db.models import ProjectState


class ProjectStateSerializer(BaseSerializer):
    """
    Serializer for project states with default state management.

    Handles project state creation and updates at workspace level
    for tracking overall project progress.
    """

    def validate(self, data):
        # If the default is being provided then make all other states default False
        if data.get("is_default", False):
            ProjectState.objects.filter(workspace_id=self.context.get("workspace_id")).update(is_default=False)
        return data

    class Meta:
        model = ProjectState
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "project",
            "deleted_at",
            "slug",
        ]


class ProjectStateLiteSerializer(BaseSerializer):
    """
    Lightweight project state serializer for minimal data transfer.

    Provides essential project state information including visual properties
    and grouping data optimized for UI display and filtering.
    """

    class Meta:
        model = ProjectState
        fields = ["id", "name", "color", "group", "description"]
        read_only_fields = fields
