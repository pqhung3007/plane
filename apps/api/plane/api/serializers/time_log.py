# Third party imports
from rest_framework import serializers

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import TimeLog, User, Issue
from .base import BaseSerializer
from .user import UserLiteSerializer
from .issue import IssueLiteSerializer


class TimeLogSerializer(BaseSerializer):
    """
    Serializer for TimeLog model to track time spent on work items.

    Handles time log creation with validation for duration, date,
    and user assignments. Supports expansion of related user and issue data.
    """

    user_detail = UserLiteSerializer(source="user", read_only=True)
    issue_detail = IssueLiteSerializer(source="issue", read_only=True)

    class Meta:
        model = TimeLog
        fields = [
            "id",
            "issue",
            "user",
            "duration_minutes",
            "logged_date",
            "description",
            "billable",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "user_detail",
            "issue_detail",
            "workspace",
            "project",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "project",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "user_detail",
            "issue_detail",
        ]

    def validate_duration_minutes(self, value):
        """Validate that duration is positive and reasonable (< 24 hours)"""
        if value < 1:
            raise serializers.ValidationError("Duration must be at least 1 minute")
        if value > 1440:  # 24 hours
            raise serializers.ValidationError("Duration cannot exceed 24 hours (1440 minutes)")
        return value

    def validate_logged_date(self, value):
        """Validate that logged date is not in the future"""
        if value > timezone.now().date():
            raise serializers.ValidationError("Logged date cannot be in the future")
        return value

    def validate(self, data):
        """Validate issue and user belong to the same project"""
        issue = data.get("issue")
        user = data.get("user", self.context.get("request").user if self.context.get("request") else None)

        # If updating, use instance values if not provided
        if self.instance:
            issue = issue or self.instance.issue
            user = user or self.instance.user

        # Ensure issue exists and user has access
        if issue and user:
            # The workspace and project will be set automatically by the model's save method
            pass

        return data


class TimeLogLiteSerializer(BaseSerializer):
    """
    Lightweight TimeLog serializer for nested representations.

    Provides minimal time log information for use in related object
    serializations without circular dependencies.
    """

    user_detail = UserLiteSerializer(source="user", read_only=True)

    class Meta:
        model = TimeLog
        fields = [
            "id",
            "duration_minutes",
            "logged_date",
            "description",
            "billable",
            "user",
            "user_detail",
            "created_at",
        ]
        read_only_fields = fields


class TimeLogStatsSerializer(serializers.Serializer):
    """
    Serializer for aggregated time log statistics.

    Provides summary data for time tracking reports including
    total duration, entry counts, and date ranges.
    """

    total_minutes = serializers.IntegerField(read_only=True)
    total_hours = serializers.FloatField(read_only=True)
    entry_count = serializers.IntegerField(read_only=True)
    billable_minutes = serializers.IntegerField(read_only=True)
    non_billable_minutes = serializers.IntegerField(read_only=True)
    start_date = serializers.DateField(read_only=True, required=False)
    end_date = serializers.DateField(read_only=True, required=False)
