from django.urls import path

from plane.api.views import (
    ProjectTemplateListCreateAPIEndpoint,
    ProjectTemplateDetailAPIEndpoint,
    ProjectTemplateUseAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/project-templates/",
        ProjectTemplateListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-template-list-create",
    ),
    path(
        "workspaces/<str:slug>/project-templates/<uuid:pk>/",
        ProjectTemplateDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-template-detail",
    ),
    path(
        "workspaces/<str:slug>/project-templates/<uuid:pk>/use/",
        ProjectTemplateUseAPIEndpoint.as_view(http_method_names=["post"]),
        name="project-template-use",
    ),
]
