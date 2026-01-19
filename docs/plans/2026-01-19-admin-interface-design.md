# Admin Interface Design

## Overview

A simple admin interface for managing face card leaders with manual editing and AI-powered refresh with diff review.

## Features

- **Authentication**: Username/password login with JWT session
- **Leader Management**: Full CRUD (add, edit, delete leaders)
- **AI Refresh**: Fetch updated data from OpenAI with diff preview before applying
- **Single Page**: All functionality on one admin dashboard

## Authentication

### Flow

1. User visits `/admin` → redirected to `/admin/login` if not authenticated
2. Enter username/password → validated against env vars
3. On success → JWT stored in HTTP-only cookie, redirect to `/admin`
4. Session expires after 24 hours

### Environment Variables

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<secure-password>
ADMIN_SECRET=<random-string-for-jwt-signing>
```

### Security

- HTTP-only cookie (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- SameSite=Strict (CSRF protection)
- JWT signed with ADMIN_SECRET

## Admin Page Layout

### Header

- Title: "Face Cards Admin"
- Logged in indicator with username
- Logout button

### Action Bar

- "Add Leader" button → opens modal
- "Refresh from AI" button → triggers diff review flow
- Filter dropdowns: Category, Branch
- Search box: filters by name/title

### Leaders Table

| Photo | Name | Title | Category | Branch | Actions |
|-------|------|-------|----------|--------|---------|
| thumbnail | text | text | badge | badge | Edit / Delete |

- Sortable columns
- Shows all leaders (including inactive, visually distinguished)
- Edit opens modal with pre-filled form
- Delete shows confirmation dialog

## AI Diff Review

### Flow

1. Click "Refresh from AI"
2. Loading state while fetching from OpenAI
3. Modal opens showing proposed changes
4. User reviews and clicks "Apply All" or "Cancel"

### Diff Display

**Summary**: "Found X additions, Y updates, Z removals"

**Sections**:
- New Leaders (green) - leaders to be added
- Updated Leaders (yellow) - field-by-field changes
- Removed Leaders (red) - leaders to be marked inactive

### Preview Token

- `preview-refresh` returns changes + short-lived token
- Token required by `apply-refresh` to prevent stale applies
- Expires after 10 minutes

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/auth` | POST | Login |
| `/api/admin/auth` | DELETE | Logout |
| `/api/admin/leaders` | GET | List all leaders |
| `/api/admin/leaders` | POST | Create leader |
| `/api/admin/leaders/[id]` | GET | Get leader |
| `/api/admin/leaders/[id]` | PUT | Update leader |
| `/api/admin/leaders/[id]` | DELETE | Delete leader |
| `/api/admin/preview-refresh` | POST | Fetch AI diff |
| `/api/admin/apply-refresh` | POST | Apply changes |

All routes except `POST /api/admin/auth` require valid session.

## File Structure

```
app/
  admin/
    login/
      page.tsx          # Login form
    page.tsx            # Main admin dashboard
    layout.tsx          # Admin layout with header/logout

api/
  admin/
    auth/
      route.ts          # POST login, DELETE logout
    leaders/
      route.ts          # GET list, POST create
      [id]/
        route.ts        # GET, PUT, DELETE single leader
    preview-refresh/
      route.ts          # POST - fetch AI diff
    apply-refresh/
      route.ts          # POST - apply changes

components/
  admin/
    LeaderTable.tsx     # Table with sort/filter
    LeaderForm.tsx      # Add/Edit modal form
    DiffModal.tsx       # AI diff review modal
    DeleteDialog.tsx    # Confirmation dialog

lib/
  admin-auth.ts         # JWT helpers, session validation

middleware.ts           # Protect /admin routes
```

## Dependencies

- `jose` - JWT signing/verification

## Implementation Notes

### Delete Behavior

Hard delete vs soft delete decision: Use soft delete (set `isActive=false`) to preserve history. Admin table shows inactive leaders with visual distinction.

### Existing Code Reuse

- Reuse `lib/openai.ts` for AI fetching
- Reuse `lib/prisma.ts` for database access
- Reuse category/branch enums from Prisma schema

### Future Enhancements (out of scope for v1)

- Selective refresh (individual leaders)
- Cherry-pick changes in diff review
- Audit log of admin actions
- Multiple admin accounts
