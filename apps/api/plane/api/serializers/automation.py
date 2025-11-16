# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import ProjectAutomation, AutomationLog, Issue


class ProjectAutomationSerializer(BaseSerializer):
    """
    Serializer for project workflow automations.

    Handles the full automation workflow including triggers, conditions, and actions.
    Provides comprehensive automation data for display and execution.
    """

    class Meta:
        model = ProjectAutomation
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "trigger_type",
            "trigger_config",
            "conditions",
            "actions",
            "execution_count",
            "last_executed_at",
            "sort_order",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "project",
            "workspace",
        ]
        read_only_fields = [
            "id",
            "execution_count",
            "last_executed_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "workspace",
            "deleted_at",
        ]

    def validate_trigger_type(self, value):
        """Validate that trigger_type is a valid choice"""
        valid_triggers = [
            "issue_created",
            "issue_updated",
            "state_changed",
            "assignee_changed",
            "comment_created",
        ]
        if value not in valid_triggers:
            raise serializers.ValidationError(
                f"Invalid trigger type. Must be one of: {', '.join(valid_triggers)}"
            )
        return value

    def validate_conditions(self, value):
        """Validate that conditions is a list of condition objects"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Conditions must be a list")

        valid_fields = ["state", "priority", "label", "assignee", "created_by", "issue_type"]
        valid_operators = ["is", "is_not", "contains", "not_contains", "is_empty", "is_not_empty"]

        for condition in value:
            if not isinstance(condition, dict):
                raise serializers.ValidationError("Each condition must be an object")

            if "field" not in condition:
                raise serializers.ValidationError("Each condition must have a 'field' property")

            if condition["field"] not in valid_fields:
                raise serializers.ValidationError(
                    f"Invalid condition field. Must be one of: {', '.join(valid_fields)}"
                )

            if "operator" not in condition:
                raise serializers.ValidationError("Each condition must have an 'operator' property")

            if condition["operator"] not in valid_operators:
                raise serializers.ValidationError(
                    f"Invalid condition operator. Must be one of: {', '.join(valid_operators)}"
                )

            # For operators other than is_empty and is_not_empty, value is required
            if condition["operator"] not in ["is_empty", "is_not_empty"]:
                if "value" not in condition:
                    raise serializers.ValidationError(
                        f"Condition with operator '{condition['operator']}' must have a 'value' property"
                    )

        return value

    def validate_actions(self, value):
        """Validate that actions is a list of action objects"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Actions must be a list")

        if len(value) == 0:
            raise serializers.ValidationError("At least one action is required")

        valid_action_types = [
            "add_comment",
            "change_state",
            "change_priority",
            "add_assignee",
            "remove_assignee",
            "add_label",
            "remove_label",
            "set_start_date",
            "set_due_date",
        ]

        for action in value:
            if not isinstance(action, dict):
                raise serializers.ValidationError("Each action must be an object")

            if "type" not in action:
                raise serializers.ValidationError("Each action must have a 'type' property")

            if action["type"] not in valid_action_types:
                raise serializers.ValidationError(
                    f"Invalid action type. Must be one of: {', '.join(valid_action_types)}"
                )

            if "config" not in action:
                raise serializers.ValidationError("Each action must have a 'config' property")

            # Validate config based on action type
            config = action["config"]
            action_type = action["type"]

            if action_type == "add_comment":
                if "comment" not in config:
                    raise serializers.ValidationError("add_comment action requires 'comment' in config")

            elif action_type == "change_state":
                if "state_id" not in config:
                    raise serializers.ValidationError("change_state action requires 'state_id' in config")

            elif action_type == "change_priority":
                if "priority" not in config:
                    raise serializers.ValidationError("change_priority action requires 'priority' in config")

            elif action_type in ["add_assignee", "remove_assignee"]:
                if "assignee_ids" not in config:
                    raise serializers.ValidationError(
                        f"{action_type} action requires 'assignee_ids' in config"
                    )

            elif action_type in ["add_label", "remove_label"]:
                if "label_ids" not in config:
                    raise serializers.ValidationError(f"{action_type} action requires 'label_ids' in config")

            elif action_type == "set_start_date":
                if "start_date" not in config:
                    raise serializers.ValidationError("set_start_date action requires 'start_date' in config")

            elif action_type == "set_due_date":
                if "due_date" not in config:
                    raise serializers.ValidationError("set_due_date action requires 'due_date' in config")

        return value


class ProjectAutomationLiteSerializer(BaseSerializer):
    """
    Lightweight automation serializer for list views.

    Provides minimal automation data optimized for performance
    in list views and dropdown selections.
    """

    class Meta:
        model = ProjectAutomation
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "trigger_type",
            "execution_count",
            "last_executed_at",
            "created_at",
        ]
        read_only_fields = fields


class ProjectAutomationCreateSerializer(BaseSerializer):
    """
    Serializer for creating project automations.

    Handles initial automation creation with required fields
    and default values for execution tracking.
    """

    class Meta:
        model = ProjectAutomation
        fields = [
            "name",
            "description",
            "is_active",
            "trigger_type",
            "trigger_config",
            "conditions",
            "actions",
            "sort_order",
            "project",
        ]

    def validate_trigger_type(self, value):
        """Validate that trigger_type is a valid choice"""
        valid_triggers = [
            "issue_created",
            "issue_updated",
            "state_changed",
            "assignee_changed",
            "comment_created",
        ]
        if value not in valid_triggers:
            raise serializers.ValidationError(
                f"Invalid trigger type. Must be one of: {', '.join(valid_triggers)}"
            )
        return value


class ProjectAutomationUpdateSerializer(BaseSerializer):
    """
    Serializer for updating project automations.

    Allows modification of automation configuration while
    preserving execution metadata.
    """

    class Meta:
        model = ProjectAutomation
        fields = [
            "name",
            "description",
            "is_active",
            "trigger_type",
            "trigger_config",
            "conditions",
            "actions",
            "sort_order",
        ]


class AutomationLogSerializer(BaseSerializer):
    """
    Serializer for automation execution logs.

    Provides comprehensive logging data including execution status,
    actions performed, and error details for debugging and auditing.
    """

    issue_identifier = serializers.CharField(source="issue.sequence_id", read_only=True)
    automation_name = serializers.CharField(source="automation.name", read_only=True)

    class Meta:
        model = AutomationLog
        fields = [
            "id",
            "automation",
            "automation_name",
            "issue",
            "issue_identifier",
            "trigger_type",
            "conditions_met",
            "status",
            "actions_executed",
            "error_message",
            "error_details",
            "execution_time_ms",
            "created_at",
            "created_by",
        ]
        read_only_fields = fields


class AutomationLogLiteSerializer(BaseSerializer):
    """
    Lightweight log serializer for activity feeds.

    Provides minimal log data optimized for performance
    in activity timelines and recent execution lists.
    """

    issue_identifier = serializers.CharField(source="issue.sequence_id", read_only=True)
    automation_name = serializers.CharField(source="automation.name", read_only=True)

    class Meta:
        model = AutomationLog
        fields = [
            "id",
            "automation_name",
            "issue_identifier",
            "status",
            "created_at",
        ]
        read_only_fields = fields
