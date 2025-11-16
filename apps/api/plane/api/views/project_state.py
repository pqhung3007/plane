# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import ProjectStateSerializer
from plane.app.permissions import WorkspaceEntityPermission
from plane.db.models import Project, ProjectState
from .base import BaseAPIView


class ProjectStateListCreateAPIEndpoint(BaseAPIView):
    """Project State List and Create Endpoint"""

    serializer_class = ProjectStateSerializer
    model = ProjectState
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            ProjectState.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                workspace__workspace_member__member=self.request.user,
                workspace__workspace_member__is_active=True,
            )
            .select_related("workspace")
            .distinct()
        )

    def post(self, request, slug):
        """Create project state

        Create a new project state for a workspace with specified name, color, and group.
        """
        try:
            serializer = ProjectStateSerializer(
                data=request.data, context={"workspace_id": request.data.get("workspace")}
            )
            if serializer.is_valid():
                serializer.save(workspace_id=request.data.get("workspace"))
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            project_state = ProjectState.objects.filter(
                workspace__slug=slug,
                name=request.data.get("name"),
            ).first()
            return Response(
                {
                    "error": "Project state with the same name already exists in the workspace",
                    "id": str(project_state.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

    def get(self, request, slug):
        """List project states

        Retrieve all project states for a workspace.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda project_states: ProjectStateSerializer(
                project_states, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class ProjectStateDetailAPIEndpoint(BaseAPIView):
    """Project State Detail Endpoint"""

    serializer_class = ProjectStateSerializer
    model = ProjectState
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            ProjectState.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                workspace__workspace_member__member=self.request.user,
                workspace__workspace_member__is_active=True,
            )
            .select_related("workspace")
            .distinct()
        )

    def get(self, request, slug, project_state_id):
        """Retrieve project state

        Retrieve details of a specific project state.
        """
        serializer = ProjectStateSerializer(
            self.get_queryset().get(pk=project_state_id),
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_state_id):
        """Delete project state

        Permanently remove a project state from a workspace.
        Default states and states with existing projects cannot be deleted.
        """
        project_state = ProjectState.objects.get(pk=project_state_id, workspace__slug=slug)

        if project_state.is_default:
            return Response(
                {"error": "Default project state cannot be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check for any projects using this state
        project_exist = Project.objects.filter(state=project_state_id).exists()

        if project_exist:
            return Response(
                {"error": "The project state is in use, only unused states can be deleted"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project_state.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, project_state_id):
        """Update project state

        Partially update an existing project state's properties like name, color, or group.
        """
        project_state = ProjectState.objects.get(workspace__slug=slug, pk=project_state_id)
        serializer = ProjectStateSerializer(
            project_state,
            data=request.data,
            partial=True,
            context={"workspace_id": project_state.workspace_id},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
