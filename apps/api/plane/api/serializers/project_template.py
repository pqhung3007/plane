# Third party imports
import random
from rest_framework import serializers

# Module imports
from plane.db.models import (
    ProjectTemplate,
    WorkspaceMember,
)
from plane.utils.content_validator import (
    validate_html_content,
)
from .base import BaseSerializer


class ProjectTemplateCreateSerializer(BaseSerializer):
    """
    Serializer for creating project templates with workspace validation.

    Handles template creation including member verification and workspace
    association for new template initialization.
    """

    TEMPLATE_ICON_DEFAULT_COLORS = [
        "#95999f",
        "#6d7b8a",
        "#5e6ad2",
        "#02b5ed",
        "#02b55c",
        "#f2be02",
        "#e57a00",
        "#f38e82",
    ]
    TEMPLATE_ICON_DEFAULT_ICONS = [
        "home",
        "apps",
        "settings",
        "star",
        "favorite",
        "done",
        "check_circle",
        "add_task",
        "create_new_folder",
        "dataset",
        "terminal",
        "key",
        "rocket",
        "public",
        "quiz",
        "mood",
        "gavel",
        "eco",
        "diamond",
        "forest",
        "bolt",
        "sync",
        "cached",
        "library_add",
        "view_timeline",
        "view_kanban",
        "empty_dashboard",
        "cycle",
    ]

    class Meta:
        model = ProjectTemplate
        fields = [
            "name",
            "description",
            "description_text",
            "description_html",
            "cover_image",
            "network",
            "project_lead",
            "default_assignee",
            "module_view",
            "cycle_view",
            "issue_views_view",
            "page_view",
            "intake_view",
            "is_issue_type_enabled",
            "is_time_tracking_enabled",
            "include_states",
            "states_config",
            "include_labels",
            "labels_config",
            "include_issue_types",
            "issue_types_config",
            "include_work_items",
            "work_items_config",
            "emoji",
            "icon_prop",
        ]

        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "logo_props",
            "usage_count",
            "last_used_at",
        ]

    def validate(self, data):
        """Validate template data"""
        # Validate project lead
        if data.get("project_lead", None) is not None:
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists():
                raise serializers.ValidationError(
                    "Project lead should be a user in the workspace"
                )

        # Validate default assignee
        if data.get("default_assignee", None) is not None:
            if not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists():
                raise serializers.ValidationError(
                    "Default assignee should be a user in the workspace"
                )

        # Validate description content for security
        if "description_html" in data and data["description_html"]:
            if isinstance(data["description_html"], dict):
                is_valid, error_msg, sanitized_html = validate_html_content(
                    str(data["description_html"])
                )
                # Update the data with sanitized HTML if available
                if sanitized_html is not None:
                    data["description_html"] = sanitized_html
            if not is_valid:
                raise serializers.ValidationError(
                    {"error": "html content is not valid"}
                )

        return data

    def create(self, validated_data):
        """Create a new project template"""
        # Generate default logo props if not provided
        if validated_data.get("logo_props", None) is None:
            validated_data["logo_props"] = {
                "in_use": "icon",
                "icon": {
                    "name": random.choice(self.TEMPLATE_ICON_DEFAULT_ICONS),
                    "color": random.choice(self.TEMPLATE_ICON_DEFAULT_COLORS),
                },
            }

        template = ProjectTemplate.objects.create(
            **validated_data, workspace_id=self.context["workspace_id"]
        )
        return template


class ProjectTemplateUpdateSerializer(ProjectTemplateCreateSerializer):
    """
    Serializer for updating project templates.

    Extends template creation with update-specific validations.
    """

    class Meta(ProjectTemplateCreateSerializer.Meta):
        model = ProjectTemplate
        fields = ProjectTemplateCreateSerializer.Meta.fields
        read_only_fields = ProjectTemplateCreateSerializer.Meta.read_only_fields

    def update(self, instance, validated_data):
        """Update a project template"""
        return super().update(instance, validated_data)


class ProjectTemplateSerializer(BaseSerializer):
    """
    Comprehensive project template serializer with all fields.

    Provides complete template data including usage statistics
    and cover image URL for template management.
    """

    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = ProjectTemplate
        fields = "__all__"
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
            "cover_image_url",
            "usage_count",
            "last_used_at",
        ]

    def validate(self, data):
        """Validate template data"""
        # Validate project lead
        if (
            data.get("project_lead", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("project_lead"),
            ).exists()
        ):
            raise serializers.ValidationError(
                "Project lead should be a user in the workspace"
            )

        # Validate default assignee
        if (
            data.get("default_assignee", None) is not None
            and not WorkspaceMember.objects.filter(
                workspace_id=self.context["workspace_id"],
                member_id=data.get("default_assignee"),
            ).exists()
        ):
            raise serializers.ValidationError(
                "Default assignee should be a user in the workspace"
            )

        # Validate description content for security
        if "description_html" in data and data["description_html"]:
            if isinstance(data["description_html"], dict):
                is_valid, error_msg, sanitized_html = validate_html_content(
                    str(data["description_html"])
                )
                # Update the data with sanitized HTML if available
                if sanitized_html is not None:
                    data["description_html"] = sanitized_html
            if not is_valid:
                raise serializers.ValidationError(
                    {"error": "html content is not valid"}
                )

        return data


class ProjectTemplateLiteSerializer(BaseSerializer):
    """
    Lightweight project template serializer for minimal data transfer.

    Provides essential template information including identifiers,
    visual properties, and basic metadata optimized for list views.
    """

    cover_image_url = serializers.CharField(read_only=True)

    class Meta:
        model = ProjectTemplate
        fields = [
            "id",
            "name",
            "description",
            "cover_image",
            "cover_image_url",
            "icon_prop",
            "emoji",
            "logo_props",
            "usage_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
