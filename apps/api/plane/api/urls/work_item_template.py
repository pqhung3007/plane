from django.urls import path

from plane.api.views import (
    WorkItemTemplateListCreateAPIEndpoint,
    WorkItemTemplateDetailAPIEndpoint,
    WorkItemTemplateApplyAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-templates/",
        WorkItemTemplateListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="work-item-templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-templates/<uuid:template_id>/",
        WorkItemTemplateDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="work-item-template-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/work-item-templates/<uuid:template_id>/apply/",
        WorkItemTemplateApplyAPIEndpoint.as_view(http_method_names=["post"]),
        name="work-item-template-apply",
    ),
]
