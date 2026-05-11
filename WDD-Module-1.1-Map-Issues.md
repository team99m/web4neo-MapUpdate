# WDD — Module 1.1: Map & Issue Reporting

> Extends: `WDD-Overview.md` · Person B · Depends on: Module 0 Core

---

## 1. Module Overview

The civic issue reporting system. Citizens can drop a pin on a map, attach photos, describe a problem, and track its resolution. Staff and admins manage incoming reports through a dedicated dashboard.

Inspired by Traffy Fondue (traffy.in.th) but with improved UX, richer status tracking, and a review layer.

---

## 2. Pages & Routes

| Route | Description | Auth |
|---|---|---|
| `/map` | Full-screen map with all issue pins | Public |
| `/issues/:id` | Issue detail: status, photos, comments, timeline | Public |
| `/report` | Multi-step report form with map pin | Required |
| `/dashboard` | Staff inbox — manage assigned issues | Staff+ |
| `/admin/issues` | Admin view — all issues, all departments | Admin |
| `/profile/:username/issues` | Issues submitted by a user | Public |

---

## 3. User Flows

### 3.1 Reporting a New Issue (Citizen)

```
1. Tap "Report Issue" button (bottom nav)
2. Step 1 — Location
     Auto-detect GPS or tap map to place pin
     Confirm address (reverse geocoded via Nominatim)
3. Step 2 — Category
     Road damage · Flooding · Broken light
     Garbage · Noise · Other
4. Step 3 — Description
     Title (required)
     Description (optional, max 500 chars)
     Photo upload (up to 5 images, auto-compressed to WebP)
5. Step 4 — Review & Submit
     Preview card
     Submit → creates issue row in DB
     Redirect to /issues/:id
6. Push notification: "Your issue has been received"
```

### 3.2 Tracking Issue Status (Citizen)

```
/issues/:id shows:
  - Status badge (open | in_progress | resolved | rejected)
  - Timeline: created → assigned → in progress → resolved
  - Department assigned
  - Staff comments (public)
  - Citizen comments
  - Review prompt (when status = resolved)
```

### 3.3 Staff Workflow (Department Inbox)

```
/dashboard
  ├── Inbox — new issues assigned to my department
  ├── In Progress — issues I've accepted
  ├── Resolved — closed by me
  └── Stats — count by status, avg resolution time

Actions per issue:
  - Accept → status: in_progress
  - Comment (internal or public)
  - Attach resolution photo
  - Resolve → status: resolved
  - Reject with reason → status: rejected
```

---

## 4. Map System

Uses **MapCore** from Module 0. Issue pins use custom colored icons by status.

### Pin Color Scheme

| Status | Color | Icon |
|---|---|---|
| open | `#E24B4A` red | `!` exclamation |
| in_progress | `#EF9F27` amber | `⟳` wrench |
| resolved | `#1D9E75` teal | `✓` check |
| rejected | `#888780` gray | `×` cross |

### Map Clustering

Use Leaflet.markercluster plugin. Clusters auto-expand on zoom. Cluster bubble shows count.

```javascript
import { MarkerClusterGroup } from 'leaflet.markercluster'

const cluster = new MarkerClusterGroup({
  maxClusterRadius: 60,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  iconCreateFunction: (cluster) => createClusterIcon(cluster.getChildCount())
})
```

### Map Filter Bar (top of `/map`)

```
[All] [Road] [Flood] [Light] [Trash] [Other]
[Open] [In Progress] [Resolved]
```

Filters update the visible pins without page reload (reactive store).

---

## 5. Components

### `<IssueCard />`
Used in lists and map popups.

```
┌──────────────────────────────┐
│ 🔴 Road damage               │
│ Sukhumvit Soi 11             │
│ Reported 2 days ago          │
│ [Open]           👍 14 🗨 3  │
└──────────────────────────────┘
```

Props: `{ issue: Issue, compact?: boolean }`

### `<IssueStatusTimeline />`
Vertical timeline shown on `/issues/:id`.

```
● Created          Jan 10 09:00
● Assigned (DPT)   Jan 10 14:00
◉ In Progress      Jan 11 08:30
○ Resolved         —
```

### `<ReportWizard />`
Multi-step form. Step state lives in Svelte store, not URL.

```svelte
<ReportWizard steps={['location', 'category', 'details', 'review']} />
```

### `<DepartmentInbox />`
Staff dashboard table with real-time updates via Supabase Realtime.

```svelte
// Subscribe to new issues for this department
const channel = supabase
  .channel('dept-inbox')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'issues',
    filter: `department=eq.${dept}`
  }, handleNewIssue)
  .subscribe()
```

---

## 6. Issue Review System

After an issue is resolved, the reporting citizen can leave a review.

```sql
reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid REFERENCES issues(id) UNIQUE,
  user_id     uuid REFERENCES profiles(id),
  rating      int CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz DEFAULT now()
)
```

Review prompt appears once, 24h after status changes to `resolved`. Rating is 1–5 stars. Visible on issue detail page.

---

## 7. Admin System

### Roles
```
citizen  — report, comment, review
staff    — manage issues within their department
admin    — full access, manage users and departments
```

Role stored in `profiles.role`. Enforced via Supabase RLS:

```sql
-- Staff can only update issues in their department
CREATE POLICY "staff_update_own_dept" ON issues
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'staff' AND department = issues.department
    )
  );

-- Admin can do everything
CREATE POLICY "admin_all" ON issues
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### Admin Dashboard `/admin/issues`

- Table: all issues across all departments
- Filters: department, status, date range, category
- Bulk actions: reassign department, bulk reject
- Export: CSV download
- Stats: resolution rate, average time to resolve, heatmap by area

---

## 8. Image Handling

Follow the shared pipeline from `WDD-Overview.md §13`.

Additional rules for this module:
- Max 5 images per issue
- Each image gets a `before` / `after` tag when uploaded by staff
- Before/after slider shown on resolved issues

```svelte
<BeforeAfterSlider before={issue.images[0]} after={resolution.images[0]} />
```

---

## 9. Supabase Realtime Subscriptions

| Event | Channel | Subscriber |
|---|---|---|
| New issue submitted | `issues:INSERT` | Admin dashboard count |
| Issue status changed | `issues:UPDATE` | Citizen issue detail page |
| New comment | `comments:INSERT` | Issue detail comment section |
| New assignment | `issues:UPDATE` | Staff inbox |

---

## 10. Notifications

Push via browser Notification API (if permitted) + in-app bell icon.

| Trigger | Recipient |
|---|---|
| Issue submitted | Citizen (confirmation) |
| Issue assigned to department | Staff |
| Issue status changed | Citizen who reported |
| New comment on issue | Issue owner + participants |
| Issue resolved | Citizen (triggers review prompt) |

---

## 11. Shared Exports (for Module 1.3)

Module 1.3 (Transit Map) will overlay issue pins on the transit map. Export these:

```typescript
// src/modules/issues/index.ts
export { IssueCard } from './components/IssueCard.svelte'
export { issueStore } from './stores/issues'
export type { Issue, IssueFilter } from './types'
```

Module 1.3 imports `issueStore.list()` to optionally show issues near transit stops.

---

*WDD-Module-1.1 · v1.0*
