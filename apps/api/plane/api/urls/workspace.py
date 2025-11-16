from django.urls import path

from plane.api.views import (
    WorkspaceTimeLogListAPIEndpoint,
    WorkspaceTimeLogStatsAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/time-logs/",
        WorkspaceTimeLogListAPIEndpoint.as_view(http_method_names=["get"]),
        name="workspace-time-log-list",
    ),
    path(
        "workspaces/<str:slug>/time-logs/stats/",
        WorkspaceTimeLogStatsAPIEndpoint.as_view(http_method_names=["get"]),
        name="workspace-time-log-stats",
    ),
]
