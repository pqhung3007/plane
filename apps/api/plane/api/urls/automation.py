from django.urls import path

from plane.api.views import (
    ProjectAutomationEndpoint,
    ProjectAutomationDetailEndpoint,
    AutomationLogEndpoint,
    AutomationActivityEndpoint,
)

urlpatterns = [
    # Project automations
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/",
        ProjectAutomationEndpoint.as_view(http_method_names=["get", "post"]),
        name="project-automations",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/",
        ProjectAutomationDetailEndpoint.as_view(http_method_names=["get", "patch", "delete"]),
        name="project-automation-detail",
    ),
    # Automation logs
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automation-logs/",
        AutomationLogEndpoint.as_view(http_method_names=["get"]),
        name="automation-logs",
    ),
    # Automation activity/statistics
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/automations/<uuid:automation_id>/activity/",
        AutomationActivityEndpoint.as_view(http_method_names=["get"]),
        name="automation-activity",
    ),
]
