# Module imports
from rest_framework import serializers
from .base import BaseSerializer
from plane.db.models import WorkItemTemplate


class WorkItemTemplateSerializer(BaseSerializer):
    """
    Serializer for work item templates.

    Handles template creation and updates including properties validation
    and automatic owner assignment.
    """

    # Read-only fields for display
    owner_detail = serializers.SerializerMethodField()
    type_detail = serializers.SerializerMethodField()

    def get_owner_detail(self, obj):
        """Return owner user details"""
        if obj.owner:
            return {
                "id": str(obj.owner.id),
                "email": obj.owner.email,
                "display_name": obj.owner.display_name,
                "avatar": obj.owner.avatar,
            }
        return None

    def get_type_detail(self, obj):
        """Return issue type details"""
        if obj.type:
            return {
                "id": str(obj.type.id),
                "name": obj.type.name,
                "description": obj.type.description,
            }
        return None

    def validate_properties(self, value):
        """Validate template properties structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Properties must be a valid JSON object")

        # Ensure basic structure exists
        allowed_keys = {
            "name",
            "description_html",
            "state_id",
            "priority",
            "label_ids",
            "assignee_ids",
            "module_ids",
            "estimate_point",
            "start_date",
            "target_date",
            "sub_work_items",
        }

        # Filter out any unexpected keys (soft validation)
        # This allows for forward compatibility
        for key in list(value.keys()):
            if key not in allowed_keys:
                # Remove unexpected keys but don't fail
                value.pop(key)

        return value

    def validate_name(self, value):
        """Validate template name is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Template name cannot be empty")
        return value.strip()

    def create(self, validated_data):
        """Create a new work item template with owner set to current user"""
        # Set owner to the current user if not explicitly provided
        if "owner" not in validated_data:
            validated_data["owner"] = self.context.get("request").user
        return super().create(validated_data)

    class Meta:
        model = WorkItemTemplate
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "workspace",
            "deleted_at",
            "usage_count",
            "last_used_at",
            "owner_detail",
            "type_detail",
        ]


class WorkItemTemplateLiteSerializer(BaseSerializer):
    """
    Lightweight work item template serializer for minimal data transfer.

    Provides essential template information optimized for dropdowns
    and list views.
    """

    class Meta:
        model = WorkItemTemplate
        fields = [
            "id",
            "name",
            "description",
            "type",
            "properties",
            "usage_count",
            "sort_order",
        ]
        read_only_fields = fields
