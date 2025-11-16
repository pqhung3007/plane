# Python imports
import json

# Django imports
from django.db import IntegrityError
from django.db.models import F, Func, OuterRef, Prefetch, Q
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

# Module imports
from plane.db.models import (
    ProjectTemplate,
    Workspace,
    WorkspaceMember,
)
from .base import BaseAPIView
from plane.api.serializers import (
    ProjectTemplateSerializer,
    ProjectTemplateLiteSerializer,
    ProjectTemplateCreateSerializer,
    ProjectTemplateUpdateSerializer,
)
from plane.app.permissions import WorkspaceEntityPermission


class ProjectTemplateListCreateAPIEndpoint(BaseAPIView):
    """Project Template List and Create Endpoint"""

    serializer_class = ProjectTemplateSerializer
    model = ProjectTemplate
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """Get project templates for the workspace"""
        return (
            ProjectTemplate.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project_lead", "default_assignee", "created_by")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    def get(self, request, slug):
        """List project templates

        Retrieve all project templates in a workspace.
        Returns templates ordered by creation date (newest first).
        """
        templates = self.get_queryset()

        # Use lite serializer for list view to minimize data transfer
        serializer = ProjectTemplateLiteSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        """Create project template

        Create a new project template in the workspace.
        Validates that the template name is unique within the workspace.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)

            # Check workspace permission
            workspace_member = WorkspaceMember.objects.filter(
                workspace=workspace,
                member=request.user,
                is_active=True
            ).first()

            if not workspace_member:
                return Response(
                    {"error": "You are not a member of this workspace"},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = ProjectTemplateCreateSerializer(
                data={**request.data},
                context={"workspace_id": workspace.id}
            )

            if serializer.is_valid():
                serializer.save(created_by=request.user, updated_by=request.user)

                # Return full serializer with complete template data
                template = ProjectTemplateSerializer(serializer.instance).data
                return Response(template, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError as e:
            if "already exists" in str(e) or "unique" in str(e).lower():
                return Response(
                    {"name": "A template with this name already exists"},
                    status=status.HTTP_409_CONFLICT,
                )
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProjectTemplateDetailAPIEndpoint(BaseAPIView):
    """Project Template Detail Endpoint for retrieve, update, and delete operations"""

    serializer_class = ProjectTemplateSerializer
    model = ProjectTemplate
    permission_classes = [WorkspaceEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        """Get project templates for the workspace"""
        return (
            ProjectTemplate.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "project_lead", "default_assignee", "created_by")
        )

    def get(self, request, slug, pk):
        """Retrieve project template

        Get details of a specific project template.
        """
        try:
            template = self.get_queryset().get(pk=pk)
            serializer = ProjectTemplateSerializer(template)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ProjectTemplate.DoesNotExist:
            return Response(
                {"error": "Project template does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request, slug, pk):
        """Update project template

        Partially update a project template.
        """
        try:
            workspace = Workspace.objects.get(slug=slug)
            template = self.get_queryset().get(pk=pk)

            serializer = ProjectTemplateUpdateSerializer(
                template,
                data=request.data,
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                template = ProjectTemplateSerializer(serializer.instance).data
                return Response(template, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except ProjectTemplate.DoesNotExist:
            return Response(
                {"error": "Project template does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except IntegrityError as e:
            if "already exists" in str(e) or "unique" in str(e).lower():
                return Response(
                    {"name": "A template with this name already exists"},
                    status=status.HTTP_409_CONFLICT,
                )
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, slug, pk):
        """Delete project template

        Soft delete a project template by marking it as deleted.
        """
        try:
            template = self.get_queryset().get(pk=pk)
            template.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectTemplate.DoesNotExist:
            return Response(
                {"error": "Project template does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ProjectTemplateUseAPIEndpoint(BaseAPIView):
    """Endpoint to track template usage"""

    permission_classes = [WorkspaceEntityPermission]

    def post(self, request, slug, pk):
        """Record template usage

        Increment usage count and update last_used_at timestamp.
        This is called when a project is created from a template.
        """
        try:
            template = ProjectTemplate.objects.get(
                workspace__slug=slug,
                pk=pk
            )

            # Update usage statistics
            template.usage_count = F('usage_count') + 1
            template.last_used_at = timezone.now()
            template.save(update_fields=['usage_count', 'last_used_at'])

            # Refresh from database to get actual count
            template.refresh_from_db()

            serializer = ProjectTemplateSerializer(template)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ProjectTemplate.DoesNotExist:
            return Response(
                {"error": "Project template does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
