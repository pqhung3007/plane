# Python imports
import json
from datetime import datetime, timedelta

# Django imports
from django.db.models import Sum, Count, Q, Exists
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import TimeLog, Issue, ProjectMember
from plane.api.serializers import TimeLogSerializer, TimeLogLiteSerializer
from plane.api.permissions import ProjectLitePermission, WorkspaceViewerPermission
from .base import BaseAPIView


class IssueTimeLogListCreateAPIEndpoint(BaseAPIView):
    """
    API endpoint for listing and creating time logs for a specific issue.

    GET: Retrieve all time logs for an issue with pagination
    POST: Create a new time log entry for an issue
    """

    serializer_class = TimeLogSerializer
    model = TimeLog
    permission_classes = [ProjectLitePermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            TimeLog.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("workspace", "project", "issue", "user", "created_by", "updated_by")
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"),
                        project_id=self.kwargs.get("project_id"),
                        member_id=self.request.user.id,
                        is_active=True,
                    )
                )
            )
            .order_by("-logged_date", "-created_at")
            .distinct()
        )

    def get(self, request, slug, project_id, issue_id):
        """
        List time logs for a specific issue.

        Supports pagination and filtering by date range.
        """
        queryset = self.get_queryset()

        # Optional date range filtering
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            queryset = queryset.filter(logged_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(logged_date__lte=end_date)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda time_logs: TimeLogSerializer(
                time_logs, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    def post(self, request, slug, project_id, issue_id):
        """
        Create a new time log entry for an issue.

        Automatically sets the user to the current request user if not specified.
        """
        # Validate that the issue exists and user has access
        issue = Issue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            pk=issue_id,
        ).first()

        if not issue:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if time tracking is enabled for the project
        if not issue.project.is_time_tracking_enabled:
            return Response(
                {"error": "Time tracking is not enabled for this project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set user to current user if not provided
        data = request.data.copy()
        if "user" not in data:
            data["user"] = str(request.user.id)

        serializer = TimeLogSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueTimeLogDetailAPIEndpoint(BaseAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific time log.

    GET: Retrieve a specific time log
    PATCH: Update a time log entry
    DELETE: Remove a time log entry
    """

    serializer_class = TimeLogSerializer
    model = TimeLog
    permission_classes = [ProjectLitePermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            TimeLog.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("workspace", "project", "issue", "user")
            .distinct()
        )

    def get(self, request, slug, project_id, issue_id, time_log_id):
        """Retrieve a specific time log entry."""
        time_log = self.get_queryset().filter(pk=time_log_id).first()
        if not time_log:
            return Response(
                {"error": "Time log not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = TimeLogSerializer(time_log, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, issue_id, time_log_id):
        """Update a specific time log entry."""
        time_log = self.get_queryset().filter(pk=time_log_id).first()
        if not time_log:
            return Response(
                {"error": "Time log not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TimeLogSerializer(
            time_log,
            data=request.data,
            partial=True,
            context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, issue_id, time_log_id):
        """Delete a specific time log entry."""
        time_log = self.get_queryset().filter(pk=time_log_id).first()
        if not time_log:
            return Response(
                {"error": "Time log not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        time_log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceTimeLogListAPIEndpoint(BaseAPIView):
    """
    API endpoint for retrieving workspace-level time logs with filtering.

    Used for the workspace settings worklogs page.
    Supports filtering by users, projects, and date ranges.
    """

    serializer_class = TimeLogSerializer
    model = TimeLog
    permission_classes = [WorkspaceViewerPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            TimeLog.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                workspace__workspace_workspacemember__member=self.request.user,
                workspace__workspace_workspacemember__is_active=True,
            )
            .select_related("workspace", "project", "issue", "user", "created_by")
            .order_by("-logged_date", "-created_at")
        )

    def get(self, request, slug):
        """
        List all time logs in the workspace with advanced filtering.

        Query Parameters:
        - user_ids: Comma-separated list of user IDs
        - project_ids: Comma-separated list of project IDs
        - start_date: Filter logs on or after this date (YYYY-MM-DD)
        - end_date: Filter logs on or before this date (YYYY-MM-DD)
        - billable: Filter by billable status (true/false)
        """
        queryset = self.get_queryset()

        # Filter by users
        user_ids = request.query_params.get("user_ids")
        if user_ids:
            user_ids = user_ids.split(",")
            queryset = queryset.filter(user_id__in=user_ids)

        # Filter by projects
        project_ids = request.query_params.get("project_ids")
        if project_ids:
            project_ids = project_ids.split(",")
            queryset = queryset.filter(project_id__in=project_ids)

        # Filter by date range
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            try:
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
                queryset = queryset.filter(logged_date__gte=start_date)
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if end_date:
            try:
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
                queryset = queryset.filter(logged_date__lte=end_date)
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Filter by billable status
        billable = request.query_params.get("billable")
        if billable is not None:
            billable_bool = billable.lower() == "true"
            queryset = queryset.filter(billable=billable_bool)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda time_logs: TimeLogSerializer(
                time_logs, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class WorkspaceTimeLogStatsAPIEndpoint(BaseAPIView):
    """
    API endpoint for retrieving aggregated time log statistics for the workspace.

    Returns total hours, entry counts, and breakdowns by billable status.
    """

    permission_classes = [WorkspaceViewerPermission]
    use_read_replica = True

    def get(self, request, slug):
        """
        Get aggregated time log statistics for the workspace.

        Supports same filters as WorkspaceTimeLogListAPIEndpoint.
        """
        queryset = (
            TimeLog.objects.filter(workspace__slug=slug)
            .filter(
                workspace__workspace_workspacemember__member=request.user,
                workspace__workspace_workspacemember__is_active=True,
            )
        )

        # Apply same filters as list endpoint
        user_ids = request.query_params.get("user_ids")
        if user_ids:
            queryset = queryset.filter(user_id__in=user_ids.split(","))

        project_ids = request.query_params.get("project_ids")
        if project_ids:
            queryset = queryset.filter(project_id__in=project_ids.split(","))

        start_date = request.query_params.get("start_date")
        if start_date:
            queryset = queryset.filter(logged_date__gte=start_date)

        end_date = request.query_params.get("end_date")
        if end_date:
            queryset = queryset.filter(logged_date__lte=end_date)

        # Calculate statistics
        stats = queryset.aggregate(
            total_minutes=Sum("duration_minutes"),
            entry_count=Count("id"),
            billable_minutes=Sum("duration_minutes", filter=Q(billable=True)),
        )

        # Handle None values
        total_minutes = stats["total_minutes"] or 0
        billable_minutes = stats["billable_minutes"] or 0

        response_data = {
            "total_minutes": total_minutes,
            "total_hours": round(total_minutes / 60.0, 2),
            "entry_count": stats["entry_count"] or 0,
            "billable_minutes": billable_minutes,
            "billable_hours": round(billable_minutes / 60.0, 2),
            "non_billable_minutes": total_minutes - billable_minutes,
            "non_billable_hours": round((total_minutes - billable_minutes) / 60.0, 2),
        }

        return Response(response_data, status=status.HTTP_200_OK)
