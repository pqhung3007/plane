# Page Templates Feature - Implementation Guide

## Overview

This document provides a comprehensive guide for the Page Templates feature implementation in Plane. The feature allows users to create, manage, and use reusable page templates at both workspace and project levels.

## ✅ Completed Implementation

### Backend (Django)

#### 1. Database Model
**File:** `/home/user/plane/apps/api/plane/db/models/page.py`

Created `PageTemplate` model with:
- **Fields:**
  - `workspace` - ForeignKey to Workspace (required)
  - `project` - ForeignKey to Project (optional, for project-level templates)
  - `name` - Template name (CharField)
  - `description` - Template description (TextField)
  - `scope` - "workspace" or "project" (CharField with choices)
  - `content` - JSON content (JSONField)
  - `content_binary` - Binary content for editor (BinaryField)
  - `content_html` - HTML content (TextField)
  - `logo_props` - Logo/icon properties (JSONField)
  - `created_by` - ForeignKey to User
  - `updated_by` - ForeignKey to User (optional)

- **Indexes:**
  - `workspace` + `scope` for efficient querying
  - `project` for project-level templates

**File:** `/home/user/plane/apps/api/plane/db/models/__init__.py`
- Exported `PageTemplate` model

#### 2. Database Migration
**File:** `/home/user/plane/apps/api/plane/db/migrations/0108_pagetemplate.py`

Created migration file to:
- Create the `page_templates` table
- Add necessary indexes
- Set up foreign key relationships

**To run:** `python manage.py migrate`

#### 3. Serializers
**File:** `/home/user/plane/apps/api/plane/app/serializers/page.py`

Created three serializers:
1. **PageTemplateSerializer** - Basic template info (list view)
   - Includes created_by_detail and updated_by_detail

2. **PageTemplateDetailSerializer** - Full template with content
   - Extends PageTemplateSerializer
   - Includes content, content_html, content_binary

3. **PageTemplateBinaryUpdateSerializer** - For content updates
   - Validates binary data (base64)
   - Validates HTML content
   - Sanitizes input

**File:** `/home/user/plane/apps/api/plane/app/serializers/__init__.py`
- Exported all template serializers

#### 4. API Views
**File:** `/home/user/plane/apps/api/plane/app/views/page/template.py`

Created four view classes:

1. **WorkspacePageTemplateViewSet**
   - `list()` - GET all workspace templates
   - `create()` - POST new workspace template
   - `retrieve()` - GET single template with content
   - `partial_update()` - PATCH template
   - `destroy()` - DELETE template
   - Permissions: ADMIN, MEMBER

2. **ProjectPageTemplateViewSet**
   - Same methods as workspace, but for project-level templates
   - Filters by project_id
   - Permissions: ADMIN, MEMBER

3. **PageTemplateContentUpdateAPIView**
   - PATCH endpoint for updating template content
   - Handles binary, HTML, and JSON content
   - Works for both workspace and project templates

4. **UsePageTemplateAPIView**
   - POST endpoint to create a page from a template
   - Copies template content to new page
   - Creates ProjectPage relationship

**File:** `/home/user/plane/apps/api/plane/app/views/__init__.py`
- Exported all template views

#### 5. URL Routes
**File:** `/home/user/plane/apps/api/plane/app/urls/page.py`

Added routes:
```
# Workspace-level templates
GET/POST    /api/workspaces/{slug}/page-templates/
GET/PATCH/DELETE /api/workspaces/{slug}/page-templates/{pk}/

# Project-level templates
GET/POST    /api/workspaces/{slug}/projects/{project_id}/page-templates/
GET/PATCH/DELETE /api/workspaces/{slug}/projects/{project_id}/page-templates/{pk}/

# Content update
PATCH       /api/workspaces/{slug}/page-templates/{pk}/content/

# Use template
POST        /api/workspaces/{slug}/projects/{project_id}/page-templates/{template_id}/use/
```

### Frontend (React/TypeScript)

#### 1. TypeScript Types
**File:** `/home/user/plane/packages/types/src/page/core.ts`

Added types:
```typescript
type TPageTemplate = {
  id: string;
  workspace: string;
  project?: string | null;
  name: string;
  description: string;
  scope: "workspace" | "project";
  logo_props: TLogoProps;
  created_by: string;
  created_by_detail?: {...};
  updated_by?: string | null;
  updated_by_detail?: {...} | null;
  created_at: string;
  updated_at: string;
};

type TPageTemplateDetail = TPageTemplate & {
  content: object;
  content_html: string;
  content_binary?: string | null;
};
```

#### 2. API Service
**File:** `/home/user/plane/apps/web/core/services/page/page-template.service.ts`

Created `PageTemplateService` class extending `APIService` with methods:

**Workspace-level:**
- `fetchWorkspaceTemplates()`
- `fetchWorkspaceTemplateById()`
- `createWorkspaceTemplate()`
- `updateWorkspaceTemplate()`
- `deleteWorkspaceTemplate()`

**Project-level:**
- `fetchProjectTemplates()`
- `fetchProjectTemplateById()`
- `createProjectTemplate()`
- `updateProjectTemplate()`
- `deleteProjectTemplate()`

**Shared:**
- `updateTemplateContent()` - Update template content
- `useTemplate()` - Create page from template

#### 3. Workspace Settings Integration
**File:** `/home/user/plane/packages/constants/src/workspace.ts`

- Added `templates` to `WORKSPACE_SETTINGS`
- Added to `WORKSPACE_SETTINGS_LINKS` array
- Route: `/settings/templates`
- Access: ADMIN, MEMBER

#### 4. Templates Management Page
**File:** `/home/user/plane/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx`

Created initial workspace templates page with:
- Header with "Create template" button
- Empty state component
- Template list view (basic)
- Delete functionality
- Error handling with toasts

---

## 🚧 Remaining Implementation Tasks

### High Priority

#### 1. Template Creation/Edit Modal
**Create file:** `/home/user/plane/apps/web/core/components/page-templates/create-edit-modal.tsx`

Should include:
- Template name input (required)
- Template description textarea
- Logo/icon picker (using existing page logo picker component)
- Rich text editor for template content (use TipTap editor from pages)
- Save/Cancel buttons
- Form validation

**Reference files:**
- `/home/user/plane/apps/web/core/components/pages/modals/create-page-modal.tsx`
- `/home/user/plane/apps/web/core/components/pages/modals/page-form.tsx`
- `/home/user/plane/apps/web/core/components/pages/editor/editor-body.tsx`

**Integration points:**
- Import and use in templates page
- Wire up to create/update API calls
- Handle loading states and errors

#### 2. Template Picker in Page Creation
**Modify file:** `/home/user/plane/apps/web/core/components/pages/modals/create-page-modal.tsx`

Add template selection:
1. Add a "Use template" option/dropdown
2. Fetch available templates (workspace + project)
3. Display template list with preview
4. On selection, use `pageTemplateService.useTemplate()` to create page
5. Redirect to the newly created page

**Alternative approach:**
Create a separate template picker modal that can be triggered before page creation.

#### 3. MobX Store (Optional but Recommended)
**Create file:** `/home/user/plane/apps/web/core/store/page-template.store.ts`

Implement store for:
- Template caching
- CRUD operations
- Filtering and sorting
- State management

**Reference:** `/home/user/plane/apps/web/core/store/pages/project-page.store.ts`

**Export from:** `/home/user/plane/apps/web/core/store/index.ts`

#### 4. Project Settings Integration
**Files to modify:**
- `/home/user/plane/apps/web/ce/constants/project/settings/tabs.ts` - Add templates tab
- Create: `/home/user/plane/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/templates/page.tsx`

Similar to workspace templates page but:
- Filter by project_id
- Use `fetchProjectTemplates()` instead
- Scope templates to current project

#### 5. Enhance Templates List View
**Improve:** `/home/user/plane/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx`

Add features:
- Search functionality
- Sort options (name, created date, updated date)
- Template preview on hover/click
- Duplicate template action
- Better loading skeleton
- Pagination (if needed)
- Bulk actions (optional)

#### 6. Template Preview/View Mode
**Create file:** `/home/user/plane/apps/web/core/components/page-templates/template-preview.tsx`

Display:
- Template name and description
- Created by info
- Content preview (read-only editor)
- Actions: Edit, Delete, Use Template

Can be a modal or side panel.

### Medium Priority

#### 7. Empty States
**Create custom empty state images** or use placeholders:
- No templates yet
- No search results
- Failed to load templates

**File:** Update `/home/user/plane/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx`

#### 8. Permissions and Feature Gating
Since this is a **Pro feature**, add feature gating:

**Check:** `/home/user/plane/apps/web/core/constants/plans.tsx` (line 880-889)

Add checks in:
- Template creation (show upgrade prompt if not Pro)
- Template list (show limited access message)
- Settings tab visibility

**Reference:** Check how other Pro features are gated in the codebase.

#### 9. Internationalization (i18n)
Add translations for:
- `workspace_settings.settings.templates.title` - "Templates"
- Template-related UI strings

**Files:** Check `/home/user/plane/apps/web/locales/` directory structure

#### 10. Testing
Create tests for:
- Backend API endpoints
- Serializers
- Frontend components
- Service methods

### Low Priority / Enhancements

#### 11. Template Categories/Tags
Add ability to categorize templates:
- Add `category` or `tags` field to model
- Update serializers and views
- Add category filter in UI

#### 12. Template Sharing
Allow sharing templates across workspaces (enterprise feature):
- Add `is_shared` field
- Create template marketplace concept
- Permissions for shared templates

#### 13. Template Analytics
Track template usage:
- Create `PageTemplateUsage` model
- Record when templates are used
- Display usage statistics

#### 14. Template Versioning
Similar to page versioning:
- Create `PageTemplateVersion` model
- Save history of template changes
- Allow reverting to previous versions

#### 15. Bulk Import/Export
Allow importing/exporting templates:
- Export templates as JSON
- Import templates from file
- Template sharing via export/import

---

## 📝 Migration Steps

### Running the Backend Migration

```bash
# Navigate to API directory
cd apps/api

# Run migration
python manage.py migrate

# Verify migration
python manage.py showmigrations | grep page_template
```

### Testing Backend APIs

```bash
# Create workspace template
curl -X POST http://localhost:8000/api/workspaces/{slug}/page-templates/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace": "{workspace_id}",
    "name": "Meeting Notes",
    "description": "Template for meeting notes",
    "scope": "workspace",
    "content_html": "<h1>Meeting Notes</h1><p>Date:</p><p>Attendees:</p>",
    "logo_props": {}
  }'

# List workspace templates
curl -X GET http://localhost:8000/api/workspaces/{slug}/page-templates/ \
  -H "Authorization: Bearer {token}"

# Use template to create page
curl -X POST http://localhost:8000/api/workspaces/{slug}/projects/{project_id}/page-templates/{template_id}/use/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Team Meeting - Jan 15",
    "access": 0
  }'
```

---

## 🎨 UI/UX Guidelines

### Consistency with Existing Pages Feature

1. **Icons:** Use the same icon patterns as pages (document icons, etc.)
2. **Colors:** Match page access colors (public/private)
3. **Layouts:** Follow existing settings page layouts
4. **Components:** Reuse components from pages:
   - Logo picker
   - Access control toggle
   - Empty states
   - Action buttons (Edit, Delete, etc.)

### Template List Item Design
```
┌─────────────────────────────────────────────────────────────┐
│ [Icon] Template Name                      [Edit] [Delete]    │
│        Brief description text                                │
│        Created by John Doe • 2 days ago                      │
└─────────────────────────────────────────────────────────────┘
```

### Template Picker Design
```
┌─────────────────────────────────────────────────────────────┐
│ Create Page                                              [X] │
├─────────────────────────────────────────────────────────────┤
│ ○ Blank page                                                │
│ ○ Use template                                              │
│   └─ [Dropdown: Select template]                           │
│                                                             │
│   Template preview (if selected)                           │
│                                                             │
│ [Cancel]                                 [Create Page]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Key Files Reference

### Backend
| Component | File Path |
|-----------|-----------|
| Model | `/home/user/plane/apps/api/plane/db/models/page.py` |
| Model Export | `/home/user/plane/apps/api/plane/db/models/__init__.py` |
| Migration | `/home/user/plane/apps/api/plane/db/migrations/0108_pagetemplate.py` |
| Serializers | `/home/user/plane/apps/api/plane/app/serializers/page.py` |
| Serializer Export | `/home/user/plane/apps/api/plane/app/serializers/__init__.py` |
| Views | `/home/user/plane/apps/api/plane/app/views/page/template.py` |
| View Export | `/home/user/plane/apps/api/plane/app/views/__init__.py` |
| URLs | `/home/user/plane/apps/api/plane/app/urls/page.py` |

### Frontend
| Component | File Path |
|-----------|-----------|
| Types | `/home/user/plane/packages/types/src/page/core.ts` |
| Service | `/home/user/plane/apps/web/core/services/page/page-template.service.ts` |
| Constants | `/home/user/plane/packages/constants/src/workspace.ts` |
| Templates Page | `/home/user/plane/apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx` |

### Reference Files (for patterns)
| Purpose | File Path |
|---------|-----------|
| Page Modal | `/home/user/plane/apps/web/core/components/pages/modals/create-page-modal.tsx` |
| Page Form | `/home/user/plane/apps/web/core/components/pages/modals/page-form.tsx` |
| Page Editor | `/home/user/plane/apps/web/core/components/pages/editor/editor-body.tsx` |
| Page Store | `/home/user/plane/apps/web/core/store/pages/project-page.store.ts` |
| Empty State | `/home/user/plane/apps/web/core/components/common/new-empty-state.tsx` |

---

## 🐛 Known Issues / Todos

1. **i18n Label Missing:** Need to add actual translations for `workspace_settings.settings.templates.title`
2. **Empty State Image:** Using placeholder path `/empty-states/templates.svg` - need actual image
3. **Template Modal:** Not yet implemented - shows toast instead
4. **Project Templates:** Tab not added to project settings yet
5. **Feature Gating:** Pro feature checks not implemented
6. **Store:** MobX store not created (using direct API calls)
7. **Template Picker:** Not integrated in page creation flow

---

## 💡 Implementation Tips

### 1. Start with Template Creation Modal
This is the most critical piece. Users need to be able to create templates before they can use them.

### 2. Use Existing Components
Don't reinvent the wheel:
- Logo picker from pages
- Rich text editor from pages
- Form validation patterns
- Toast notifications
- Modal patterns

### 3. Test Incrementally
Test each piece as you build:
1. Create template (API + UI)
2. List templates (API + UI)
3. Edit template
4. Delete template
5. Use template
6. Project-level templates

### 4. Error Handling
Add proper error handling for:
- Network failures
- Validation errors
- Permission errors
- Not found errors

### 5. Loading States
Show loading indicators for:
- Fetching templates
- Creating templates
- Deleting templates
- Using templates

---

## 📞 Support

For questions or issues:
1. Check existing page implementation for patterns
2. Review Django REST Framework docs for API patterns
3. Check Plane's existing features for UI/UX consistency
4. Refer to TipTap editor documentation for content editing

---

## ✅ Checklist

- [x] Backend model created
- [x] Database migration created
- [x] Serializers implemented
- [x] API views implemented
- [x] URL routes configured
- [x] TypeScript types added
- [x] Frontend service created
- [x] Workspace settings tab added
- [x] Basic templates page created
- [ ] Template creation modal
- [ ] Template edit functionality
- [ ] Template picker in page creation
- [ ] Project-level templates
- [ ] MobX store (optional)
- [ ] Feature gating (Pro)
- [ ] Internationalization
- [ ] Testing
- [ ] Documentation

---

**Last Updated:** 2025-11-16
**Implementation Status:** ~60% Complete (Backend + Basic Frontend)
**Estimated Remaining Work:** 4-6 hours for core features
