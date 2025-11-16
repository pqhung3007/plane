# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import WorkItemTemplateSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import WorkItemTemplate
from .base import BaseAPIView


class WorkItemTemplateListCreateAPIEndpoint(BaseAPIView):
    """Work Item Template List and Create Endpoint"""

    serializer_class = WorkItemTemplateSerializer
    model = WorkItemTemplate
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            WorkItemTemplate.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .select_related("owner")
            .select_related("type")
            .distinct()
        )

    def post(self, request, slug, project_id):
        """Create work item template

        Create a new work item template for a project with specified properties.
        Supports external ID tracking for integration purposes.
        """
        try:
            serializer = WorkItemTemplateSerializer(
                data=request.data,
                context={"request": request, "project_id": project_id}
            )

            if serializer.is_valid():
                # Check for duplicate external_id if provided
                if (
                    request.data.get("external_id")
                    and request.data.get("external_source")
                    and WorkItemTemplate.objects.filter(
                        project_id=project_id,
                        workspace__slug=slug,
                        external_source=request.data.get("external_source"),
                        external_id=request.data.get("external_id"),
                    ).exists()
                ):
                    template = WorkItemTemplate.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        external_id=request.data.get("external_id"),
                        external_source=request.data.get("external_source"),
                    ).first()
                    return Response(
                        {
                            "error": "Template with the same external id and external source already exists",
                            "id": str(template.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                serializer.save(project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            return Response(
                {"error": "A template with similar properties already exists"},
                status=status.HTTP_409_CONFLICT,
            )

    def get(self, request, slug, project_id):
        """List work item templates

        Retrieve all work item templates for a project.
        Returns paginated results when listing all templates.
        Supports filtering by type_id via query parameters.
        """
        # Get base queryset
        queryset = self.get_queryset()

        # Filter by type if provided
        type_id = request.query_params.get("type")
        if type_id:
            queryset = queryset.filter(type_id=type_id)

        # Order by sort_order and name
        queryset = queryset.order_by("sort_order", "name")

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda templates: WorkItemTemplateSerializer(
                templates,
                many=True,
                fields=self.fields,
                expand=self.expand
            ).data,
        )


class WorkItemTemplateDetailAPIEndpoint(BaseAPIView):
    """Work Item Template Detail Endpoint"""

    serializer_class = WorkItemTemplateSerializer
    model = WorkItemTemplate
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            WorkItemTemplate.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .select_related("owner")
            .select_related("type")
            .distinct()
        )

    def get(self, request, slug, project_id, template_id):
        """Retrieve work item template

        Retrieve details of a specific work item template.
        """
        serializer = WorkItemTemplateSerializer(
            self.get_queryset().get(pk=template_id),
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, slug, project_id, template_id):
        """Delete work item template

        Permanently remove a work item template from a project.
        Soft delete is used to maintain referential integrity.
        """
        template = WorkItemTemplate.objects.get(
            pk=template_id,
            project_id=project_id,
            workspace__slug=slug
        )
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug, project_id, template_id):
        """Update work item template

        Partially update an existing work item template's properties.
        Validates external ID uniqueness if provided.
        """
        template = WorkItemTemplate.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            pk=template_id
        )

        serializer = WorkItemTemplateSerializer(
            template,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            # Check for duplicate external_id if being updated
            if (
                request.data.get("external_id")
                and (template.external_id != str(request.data.get("external_id")))
                and WorkItemTemplate.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source", template.external_source),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Template with the same external id and external source already exists",
                        "id": str(template.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkItemTemplateApplyAPIEndpoint(BaseAPIView):
    """Work Item Template Apply Endpoint"""

    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def post(self, request, slug, project_id, template_id):
        """Apply work item template

        Increments the usage count and updates last used timestamp.
        Returns the template properties to be applied to a work item.
        """
        template = WorkItemTemplate.objects.get(
            pk=template_id,
            project_id=project_id,
            workspace__slug=slug,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
        )

        # Increment usage statistics
        template.increment_usage()

        # Return the template with updated statistics
        serializer = WorkItemTemplateSerializer(template)
        return Response(serializer.data, status=status.HTTP_200_OK)
