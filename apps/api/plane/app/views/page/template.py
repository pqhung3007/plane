# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import (
    PageTemplateSerializer,
    PageTemplateDetailSerializer,
    PageTemplateBinaryUpdateSerializer,
)
from plane.db.models import PageTemplate, Page, ProjectPage
from plane.utils.error_codes import ERROR_CODES

# Local imports
from ..base import BaseAPIView, BaseViewSet


class WorkspacePageTemplateViewSet(BaseViewSet):
    """
    ViewSet for workspace-level page templates.
    Provides CRUD operations for templates at workspace scope.
    """

    serializer_class = PageTemplateSerializer
    model = PageTemplate
    search_fields = ["name"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                workspace__workspace_member__member=self.request.user,
                workspace__workspace_member__is_active=True,
                scope=PageTemplate.WORKSPACE_SCOPE,
            )
            .select_related("workspace", "created_by", "updated_by")
            .order_by(self.request.GET.get("order_by", "-created_at"))
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug):
        """List all workspace-level templates"""
        queryset = self.get_queryset()
        serializer = PageTemplateSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug):
        """Create a new workspace-level template"""
        try:
            serializer = PageTemplateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    workspace_id=request.data.get("workspace"),
                    created_by=request.user,
                    scope=PageTemplate.WORKSPACE_SCOPE,
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def retrieve(self, request, slug, pk):
        """Get a specific workspace template with content"""
        try:
            template = self.get_queryset().get(pk=pk)
            serializer = PageTemplateDetailSerializer(template)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PageTemplate.DoesNotExist:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, pk):
        """Update a workspace template"""
        try:
            template = self.get_queryset().get(pk=pk)
            serializer = PageTemplateSerializer(template, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PageTemplate.DoesNotExist:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, pk):
        """Delete a workspace template"""
        try:
            template = self.get_queryset().get(pk=pk)
            template.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PageTemplate.DoesNotExist:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ProjectPageTemplateViewSet(BaseViewSet):
    """
    ViewSet for project-level page templates.
    Provides CRUD operations for templates at project scope.
    """

    serializer_class = PageTemplateSerializer
    model = PageTemplate
    search_fields = ["name"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                scope=PageTemplate.PROJECT_SCOPE,
            )
            .select_related("workspace", "project", "created_by", "updated_by")
            .order_by(self.request.GET.get("order_by", "-created_at"))
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def list(self, request, slug, project_id):
        """List all project-level templates"""
        queryset = self.get_queryset()
        serializer = PageTemplateSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id):
        """Create a new project-level template"""
        try:
            serializer = PageTemplateSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    workspace_id=request.data.get("workspace"),
                    project_id=project_id,
                    created_by=request.user,
                    scope=PageTemplate.PROJECT_SCOPE,
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def retrieve(self, request, slug, project_id, pk):
        """Get a specific project template with content"""
        try:
            template = self.get_queryset().get(pk=pk)
            serializer = PageTemplateDetailSerializer(template)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PageTemplate.DoesNotExist:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def partial_update(self, request, slug, project_id, pk):
        """Update a project template"""
        try:
            template = self.get_queryset().get(pk=pk)
            serializer = PageTemplateSerializer(template, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PageTemplate.DoesNotExist:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, pk):
        """Delete a project template"""
        try:
            template = self.get_queryset().get(pk=pk)
            template.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PageTemplate.DoesNotExist:
            return Response(
                {"error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class PageTemplateContentUpdateAPIView(BaseAPIView):
    """
    API view for updating page template content (binary, HTML, JSON).
    This endpoint is used by the editor to save template content.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, pk):
        """Update template content"""
        try:
            # Get the template - check both workspace and project level
            template = PageTemplate.objects.filter(
                Q(
                    workspace__slug=slug,
                    workspace__workspace_member__member=request.user,
                    workspace__workspace_member__is_active=True,
                    scope=PageTemplate.WORKSPACE_SCOPE,
                )
                | Q(
                    workspace__slug=slug,
                    project__project_projectmember__member=request.user,
                    project__project_projectmember__is_active=True,
                    scope=PageTemplate.PROJECT_SCOPE,
                ),
                pk=pk,
            ).first()

            if not template:
                return Response(
                    {"error": "Template not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = PageTemplateBinaryUpdateSerializer(
                template, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                template.updated_by = request.user
                template.save(update_fields=["updated_by", "updated_at"])
                return Response(
                    PageTemplateDetailSerializer(template).data,
                    status=status.HTTP_200_OK,
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UsePageTemplateAPIView(BaseAPIView):
    """
    API view for creating a new page from a template.
    This endpoint takes a template and creates a new page with the template's content.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, template_id):
        """Create a new page from a template"""
        try:
            # Get the template - check both workspace and project level
            template = PageTemplate.objects.filter(
                Q(
                    workspace__slug=slug,
                    workspace__workspace_member__member=request.user,
                    workspace__workspace_member__is_active=True,
                    scope=PageTemplate.WORKSPACE_SCOPE,
                )
                | Q(
                    workspace__slug=slug,
                    project_id=project_id,
                    project__project_projectmember__member=request.user,
                    project__project_projectmember__is_active=True,
                    scope=PageTemplate.PROJECT_SCOPE,
                ),
                pk=template_id,
            ).first()

            if not template:
                return Response(
                    {"error": "Template not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Create a new page from the template
            page = Page.objects.create(
                workspace_id=template.workspace_id,
                name=request.data.get("name", template.name),
                description=template.content,
                description_binary=template.content_binary,
                description_html=template.content_html,
                logo_props=template.logo_props,
                owned_by=request.user,
                access=request.data.get("access", Page.PUBLIC_ACCESS),
                created_by=request.user,
                updated_by=request.user,
            )

            # Create the project page relationship
            ProjectPage.objects.create(
                workspace_id=page.workspace_id,
                project_id=project_id,
                page_id=page.id,
                created_by=request.user,
                updated_by=request.user,
            )

            from plane.app.serializers import PageDetailSerializer

            return Response(
                PageDetailSerializer(page).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
