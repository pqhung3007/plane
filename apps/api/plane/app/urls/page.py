from django.urls import path


from plane.app.views import (
    PageViewSet,
    PageFavoriteViewSet,
    PagesDescriptionViewSet,
    PageVersionEndpoint,
    PageDuplicateEndpoint,
    WorkspacePageTemplateViewSet,
    ProjectPageTemplateViewSet,
    PageTemplateContentUpdateAPIView,
    UsePageTemplateAPIView,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages-summary/",
        PageViewSet.as_view({"get": "summary"}),
        name="project-pages-summary",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/",
        PageViewSet.as_view({"get": "list", "post": "create"}),
        name="project-pages",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/",
        PageViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="project-pages",
    ),
    # favorite pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/favorite-pages/<uuid:page_id>/",
        PageFavoriteViewSet.as_view({"post": "create", "delete": "destroy"}),
        name="user-favorite-pages",
    ),
    # archived pages
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/archive/",
        PageViewSet.as_view({"post": "archive", "delete": "unarchive"}),
        name="project-page-archive-unarchive",
    ),
    # lock and unlock
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/lock/",
        PageViewSet.as_view({"post": "lock", "delete": "unlock"}),
        name="project-pages-lock-unlock",
    ),
    # private and public page
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/access/",
        PageViewSet.as_view({"post": "access"}),
        name="project-pages-access",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/description/",
        PagesDescriptionViewSet.as_view({"get": "retrieve", "patch": "partial_update"}),
        name="page-description",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/",
        PageVersionEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/versions/<uuid:pk>/",
        PageVersionEndpoint.as_view(),
        name="page-versions",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:page_id>/duplicate/",
        PageDuplicateEndpoint.as_view(),
        name="page-duplicate",
    ),
    # Workspace-level page templates
    path(
        "workspaces/<str:slug>/page-templates/",
        WorkspacePageTemplateViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-page-templates",
    ),
    path(
        "workspaces/<str:slug>/page-templates/<uuid:pk>/",
        WorkspacePageTemplateViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="workspace-page-template-detail",
    ),
    # Project-level page templates
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/page-templates/",
        ProjectPageTemplateViewSet.as_view({"get": "list", "post": "create"}),
        name="project-page-templates",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/page-templates/<uuid:pk>/",
        ProjectPageTemplateViewSet.as_view(
            {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
        ),
        name="project-page-template-detail",
    ),
    # Template content update
    path(
        "workspaces/<str:slug>/page-templates/<uuid:pk>/content/",
        PageTemplateContentUpdateAPIView.as_view(),
        name="page-template-content-update",
    ),
    # Use template to create page
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/page-templates/<uuid:template_id>/use/",
        UsePageTemplateAPIView.as_view(),
        name="use-page-template",
    ),
]
