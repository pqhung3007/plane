from django.urls import path

from plane.api.views import (
    ProjectStateListCreateAPIEndpoint,
    ProjectStateDetailAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/project-states/",
        ProjectStateListCreateAPIEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-states",
    ),
    path(
        "workspaces/<str:slug>/project-states/<uuid:project_state_id>/",
        ProjectStateDetailAPIEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-state-detail",
    ),
]
