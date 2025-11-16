# Python imports
import time
from datetime import datetime

# Django imports
from django.db.models import Prefetch, Q, Exists, OuterRef
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import ProjectAutomation, AutomationLog, Project, ProjectMember
from .base import BaseAPIView
from plane.api.serializers import (
    ProjectAutomationSerializer,
    ProjectAutomationLiteSerializer,
    ProjectAutomationCreateSerializer,
    ProjectAutomationUpdateSerializer,
    AutomationLogSerializer,
    AutomationLogLiteSerializer,
)
from plane.app.permissions import ProjectBasePermission


class ProjectAutomationEndpoint(BaseAPIView):
    """
    Endpoint for listing and creating project automations.

    Provides CRUD operations for workflow automations including
    filtering by trigger type and active status.
    """

    serializer_class = ProjectAutomationSerializer
    model = ProjectAutomation
    permission_classes = [ProjectBasePermission]

    def get_queryset(self):
        return (
            ProjectAutomation.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .select_related("project", "workspace", "created_by", "updated_by")
            .order_by("sort_order", "-created_at")
        )

    def get(self, request, slug, project_id):
        """
        List all automations for a project.

        Supports filtering by:
        - is_active: Filter by active/inactive status
        - trigger_type: Filter by trigger type

        Returns automations ordered by sort_order and creation date.
        """
        queryset = self.get_queryset()

        # Filter by active status if provided
        is_active = request.GET.get("is_active")
        if is_active is not None:
            is_active_bool = is_active.lower() == "true"
            queryset = queryset.filter(is_active=is_active_bool)

        # Filter by trigger type if provided
        trigger_type = request.GET.get("trigger_type")
        if trigger_type:
            queryset = queryset.filter(trigger_type=trigger_type)

        # Use lite serializer for list view if requested
        use_lite = request.GET.get("lite", "false").lower() == "true"
        serializer_class = ProjectAutomationLiteSerializer if use_lite else ProjectAutomationSerializer

        serializer = serializer_class(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id):
        """
        Create a new automation for a project.

        Creates a workflow automation with the specified trigger,
        conditions, and actions. Validates all configuration before creation.
        """
        try:
            # Verify project exists and user has access
            project = Project.objects.get(
                workspace__slug=slug,
                pk=project_id,
            )

            serializer = ProjectAutomationCreateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(project=project)

                # Return full automation details
                automation = self.get_queryset().filter(pk=serializer.instance.id).first()
                response_serializer = ProjectAutomationSerializer(automation)

                return Response(response_serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Project.DoesNotExist:
            return Response(
                {"error": "Project does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )


class ProjectAutomationDetailEndpoint(BaseAPIView):
    """
    Endpoint for retrieving, updating, and deleting individual project automations.

    Provides detailed automation management including activation/deactivation
    and configuration updates.
    """

    serializer_class = ProjectAutomationSerializer
    model = ProjectAutomation
    permission_classes = [ProjectBasePermission]

    def get_queryset(self):
        return (
            ProjectAutomation.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .select_related("project", "workspace", "created_by", "updated_by")
        )

    def get(self, request, slug, project_id, automation_id):
        """
        Retrieve a specific automation by ID.

        Returns full automation details including trigger configuration,
        conditions, actions, and execution statistics.
        """
        try:
            automation = self.get_queryset().get(pk=automation_id)
            serializer = ProjectAutomationSerializer(automation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ProjectAutomation.DoesNotExist:
            return Response(
                {"error": "Automation does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, slug, project_id, automation_id):
        """
        Update an automation.

        Allows partial updates to automation configuration including
        name, description, trigger, conditions, actions, and active status.
        """
        try:
            automation = self.get_queryset().get(pk=automation_id)
            serializer = ProjectAutomationUpdateSerializer(
                automation,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():
                serializer.save()

                # Return updated automation
                updated_automation = self.get_queryset().get(pk=automation_id)
                response_serializer = ProjectAutomationSerializer(updated_automation)

                return Response(response_serializer.data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except ProjectAutomation.DoesNotExist:
            return Response(
                {"error": "Automation does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, slug, project_id, automation_id):
        """
        Delete an automation.

        Soft deletes the automation by setting deleted_at timestamp.
        Associated logs are preserved for audit purposes.
        """
        try:
            automation = self.get_queryset().get(pk=automation_id)
            automation.deleted_at = timezone.now()
            automation.save()

            return Response(
                {"message": "Automation deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except ProjectAutomation.DoesNotExist:
            return Response(
                {"error": "Automation does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )


class AutomationLogEndpoint(BaseAPIView):
    """
    Endpoint for retrieving automation execution logs.

    Provides audit trail and debugging information for automation runs
    with filtering by automation, issue, status, and date range.
    """

    serializer_class = AutomationLogSerializer
    model = AutomationLog
    permission_classes = [ProjectBasePermission]

    def get_queryset(self):
        return (
            AutomationLog.objects.filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .select_related("automation", "issue", "created_by")
            .order_by("-created_at")
        )

    def get(self, request, slug, project_id):
        """
        List automation execution logs.

        Supports filtering by:
        - automation_id: Filter logs for a specific automation
        - issue_id: Filter logs for a specific issue
        - status: Filter by execution status (success, failed, skipped)
        - start_date: Filter logs after this date
        - end_date: Filter logs before this date

        Returns logs ordered by creation date (newest first).
        """
        queryset = self.get_queryset()

        # Filter by automation if provided
        automation_id = request.GET.get("automation_id")
        if automation_id:
            queryset = queryset.filter(automation_id=automation_id)

        # Filter by issue if provided
        issue_id = request.GET.get("issue_id")
        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)

        # Filter by status if provided
        log_status = request.GET.get("status")
        if log_status:
            queryset = queryset.filter(status=log_status)

        # Filter by date range
        start_date = request.GET.get("start_date")
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)

        end_date = request.GET.get("end_date")
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        # Limit results
        limit = request.GET.get("limit")
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except (ValueError, TypeError):
                pass

        # Use lite serializer for list view if requested
        use_lite = request.GET.get("lite", "false").lower() == "true"
        serializer_class = AutomationLogLiteSerializer if use_lite else AutomationLogSerializer

        serializer = serializer_class(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AutomationActivityEndpoint(BaseAPIView):
    """
    Endpoint for retrieving automation activity summary.

    Provides statistics and recent activity for automation monitoring
    including execution counts, success rates, and recent logs.
    """

    permission_classes = [ProjectBasePermission]

    def get(self, request, slug, project_id, automation_id):
        """
        Get activity summary for a specific automation.

        Returns:
        - Total execution count
        - Success/failure/skip counts
        - Recent execution logs (last 10)
        - Average execution time
        """
        try:
            automation = ProjectAutomation.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                pk=automation_id,
            )

            # Get log statistics
            logs = AutomationLog.objects.filter(
                automation_id=automation_id,
                project_id=project_id,
            )

            success_count = logs.filter(status="success").count()
            failed_count = logs.filter(status="failed").count()
            skipped_count = logs.filter(status="skipped").count()

            # Get average execution time
            successful_logs = logs.filter(
                status="success",
                execution_time_ms__isnull=False
            )
            avg_execution_time = None
            if successful_logs.exists():
                from django.db.models import Avg
                avg_execution_time = successful_logs.aggregate(
                    avg_time=Avg("execution_time_ms")
                )["avg_time"]

            # Get recent logs
            recent_logs = logs.order_by("-created_at")[:10]
            recent_logs_serializer = AutomationLogLiteSerializer(recent_logs, many=True)

            return Response({
                "automation": {
                    "id": str(automation.id),
                    "name": automation.name,
                    "is_active": automation.is_active,
                },
                "statistics": {
                    "total_executions": automation.execution_count,
                    "success_count": success_count,
                    "failed_count": failed_count,
                    "skipped_count": skipped_count,
                    "average_execution_time_ms": avg_execution_time,
                    "last_executed_at": automation.last_executed_at,
                },
                "recent_logs": recent_logs_serializer.data,
            }, status=status.HTTP_200_OK)

        except ProjectAutomation.DoesNotExist:
            return Response(
                {"error": "Automation does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
