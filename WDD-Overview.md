# WDD — Web Design Document
## Civic Issue Reporting & Community Platform

> Version 1.0 · Team of 4 · Mobile-First · Frontend-Only Architecture

---

## 1. Project Summary

A mobile-first civic reporting web application inspired by Bangkok's [Traffy Fondue](https://www.traffy.in.th/), redesigned and expanded with a social layer and public transport tracking. Citizens can report street-level issues, follow their progress, engage with the community, and navigate public transport — all from a single platform.

---

## 2. Design Philosophy

| Principle | Implementation |
|---|---|
| Mobile-First | Designed for 390px viewport first, scales up |
| Flat Design | No gradients, no shadows — clean geometric UI |
| GPU Acceleration | `transform`, `will-change`, `translateZ(0)` on animated elements |
| Offline-Ready | Service Worker + IndexedDB for partial offline use |
| Speed-First | Astro static shell + lazy-loaded islands + HTTP cache headers |
| i18n | English default · Thai auto-detected · all code keys in English |

---

## 3. Core Tech Stack

### Frontend Framework
- **Astro** — Static shell, file-based routing, island architecture
- **Svelte** — UI islands (dynamic components within Astro pages)
- **Tailwind CSS** — Utility-first styling, purged at build time
- **Leaflet.js** — Map rendering (OpenStreetMap tiles, free)

### Backend as a Service (BaaS)
- **Supabase** — PostgreSQL, Auth, Storage, Realtime, Edge Functions
- **Supabase RLS** — Row-Level Security policies replace traditional backend auth middleware
- **Supabase Storage** — Image uploads with built-in transformation/resize API

### Search & Queue
- **Meilisearch** — Full-text search for issues and posts
- **BullMQ + Redis** — Background job processing (notifications, image processing)

### Caching Strategy
| Layer | Technology | TTL |
|---|---|---|
| Static assets | HTTP `Cache-Control: immutable` | Forever |
| API responses | Service Worker (Cache API) | 5–60 min |
| User session | `localStorage` | Session |
| Offline data | IndexedDB | Until sync |

---

## 4. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Module 0 — Core Base                  │
│  Auth · Router · Component Lib · API Client · MapCore  │
│  Image Compress · Cache · State · GPU Helpers          │
└──────────┬────────────────┬──────────────┬─────────────┘
           │                │              │
     ┌─────▼──────┐  ┌─────▼──────┐  ┌──▼──────────┐
     │  1.1 Map   │  │ 1.2 Social │  │ 1.3 Transit │
     │  & Issues  │  │    Feed    │  │     Map     │
     └─────┬──────┘  └─────┬──────┘  └──┬──────────┘
           └───────────────┴─────────────┘
                           │
           ┌───────────────▼──────────────┐
           │        Supabase (BaaS)        │
           │  PostgreSQL · Auth · Storage  │
           │  Realtime · Edge Functions    │
           └───────────────────────────────┘
```

---

## 5. Team Structure & Responsibilities

### Person A — Module 0: Core Base (Shared Foundation)
Builds the base that all others extend from. Must be completed **before** the team splits.

Deliverables:
- Astro project scaffold with `pnpm workspace` monorepo
- Supabase client setup + type-safe query helpers
- Auth system (login, register, session, RLS-aware)
- Shared component library (Button, Card, Modal, Toast, BottomNav, Avatar)
- `MapCore` Svelte component (Leaflet wrapper, pin, geolocation)
- Image compression utility (client-side, WebP output)
- Service Worker setup
- GPU acceleration utility classes
- Base Tailwind theme tokens
- Demo page showing all components

### Person B — Module 1.1: Map & Issue Reporting
Builds the core civic reporting system. Extends MapCore from Module 0.

See: `WDD-Module-1.1-Map-Issues.md`

### Person C — Module 1.2: Social Feed
Builds the Facebook-style social layer. Independent from 1.1 and 1.3.

See: `WDD-Module-1.2-Social-Feed.md`

### Person D — Module 1.3: Transit Map
Builds on top of 1.1's map work to add public transport layer.

See: `WDD-Module-1.3-Transit-Map.md`

---

## 6. Database Schema (Shared — Agree Before Coding)

All modules share one PostgreSQL database on Supabase. Schema must be finalized by the full team on Day 1.

### Core Tables

```sql
-- Shared auth (Supabase built-in)
auth.users (id, email, created_at)

-- Extended user profile
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  username    text UNIQUE,
  display_name text,
  avatar_url  text,
  bio         text,
  role        text DEFAULT 'citizen', -- citizen | staff | admin
  created_at  timestamptz DEFAULT now()
)

-- Issues (Module 1.1 owns)
issues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  title       text NOT NULL,
  description text,
  category    text,           -- road | flood | light | trash | other
  status      text DEFAULT 'open', -- open | in_progress | resolved | rejected
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  address     text,
  department  text,
  images      text[],
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)

-- Posts (Module 1.2 owns)
posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  issue_id    uuid REFERENCES issues(id), -- optional link to issue
  content     text NOT NULL,
  images      text[],
  category    text,
  visibility  text DEFAULT 'public',
  created_at  timestamptz DEFAULT now()
)

-- Comments (shared by 1.1 and 1.2)
comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  parent_type text NOT NULL, -- 'issue' | 'post'
  parent_id   uuid NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz DEFAULT now()
)

-- Reactions (shared)
reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  parent_type text NOT NULL,
  parent_id   uuid NOT NULL,
  type        text NOT NULL, -- like | support | resolved
  UNIQUE (user_id, parent_type, parent_id)
)

-- Transit routes (Module 1.3 owns)
transit_routes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL, -- bus | bts | mrt | boat
  color       text,
  polyline    jsonb,          -- GeoJSON LineString
  active      boolean DEFAULT true
)

-- Transit stops (Module 1.3 owns)
transit_stops (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id    uuid REFERENCES transit_routes(id),
  name        text NOT NULL,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  sequence    int
)

-- Notifications (shared)
notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id),
  type        text,
  payload     jsonb,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
)
```

---

## 7. Routing Structure

```
/                   → Landing / feed (guest: public issues)
/map                → Full map view of issues
/issues/:id         → Issue detail page
/report             → Report new issue (auth required)
/feed               → Social feed (1.2)
/profile/:username  → User profile (1.2)
/transit            → Transit map (1.3)
/transit/:routeId   → Route detail (1.3)
/admin              → Admin dashboard (role: admin)
/dashboard          → Staff dashboard (role: staff)
/settings           → Account settings
/login              → Auth
/register           → Auth
```

---

## 8. Shared API Contracts (Module Interfaces)

Each module must expose and consume these interfaces exactly. Do not change signatures without team agreement.

### MapCore (exported from Module 0)
```typescript
// Component
<MapCore
  center: [lat, lng]
  zoom: number
  markers?: MarkerConfig[]
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (id: string) => void
/>

type MarkerConfig = {
  id: string
  lat: number
  lng: number
  type: 'issue' | 'stop' | 'vehicle'
  status?: string
  label?: string
}
```

### Issue Store (exported from Module 1.1, consumed by 1.3 overlay)
```typescript
import { issueStore } from '@modules/issues'

issueStore.list(filters?: IssueFilter): Promise<Issue[]>
issueStore.get(id: string): Promise<Issue>
issueStore.create(data: NewIssue): Promise<Issue>
issueStore.updateStatus(id: string, status: string): Promise<void>
```

### Auth Store (exported from Module 0)
```typescript
import { auth } from '@core/auth'

auth.user: Writable<Profile | null>
auth.login(email, password): Promise<void>
auth.logout(): Promise<void>
auth.requireAuth(): void  // redirects to /login if not logged in
```

---

## 9. Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.2s on 4G |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Lighthouse Mobile Score | ≥ 85 |
| Image upload size limit | 5MB input → 500KB WebP output |
| Map tile cache | 7 days (OpenStreetMap) |

---

## 10. GPU Acceleration Guidelines

Apply these CSS rules on all animated/scrolled elements:

```css
/* Use on map container, cards, bottom nav */
.gpu-layer {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* Smooth scroll for feed */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: y proximity;
}

/* Animate only transform and opacity — never layout properties */
.card-enter {
  animation: slideUp 200ms ease-out;
}
@keyframes slideUp {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
```

---

## 11. Monorepo Structure

```
wdd/
├── package.json          # pnpm workspace root
├── pnpm-workspace.yaml
├── packages/
│   ├── core/             # Module 0 — shared code
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── map/      # MapCore
│   │   │   ├── utils/
│   │   │   └── stores/
│   │   └── package.json
│   └── db/               # Shared Supabase types + schema
│       ├── schema.sql
│       ├── types.ts      # auto-generated from Supabase CLI
│       └── package.json
├── apps/
│   └── web/              # Main Astro app
│       ├── src/
│       │   ├── pages/
│       │   ├── modules/
│       │   │   ├── issues/    # 1.1
│       │   │   ├── social/    # 1.2
│       │   │   └── transit/   # 1.3
│       │   └── layouts/
│       └── package.json
└── supabase/
    ├── migrations/
    └── seed.sql
```

---

## 12. Development Workflow

1. **Day 1** — Full team: finalize DB schema, agree on API contracts, set up monorepo
2. **Week 1–2** — Person A builds Module 0, team reviews and approves
3. **Week 2 onward** — Persons B, C, D develop 1.1, 1.2, 1.3 in parallel
4. **Integration** — Weekly merge to `main`, resolve conflicts early
5. **Testing** — Each module ships with Playwright smoke tests for its routes

### Git Branching
```
main          ← stable, always deployable
dev           ← integration branch
feat/core     ← Module 0 (Person A)
feat/issues   ← Module 1.1 (Person B)
feat/social   ← Module 1.2 (Person C)
feat/transit  ← Module 1.3 (Person D)
```

---

## 13. Image Compression Pipeline

All image uploads go through this pipeline before storage:

```
User selects image
      ↓
Client-side: canvas.toBlob() → WebP, quality 0.82
      ↓
Resize: max 1200×1200px (maintain aspect ratio)
      ↓
Upload to Supabase Storage
      ↓
Supabase Storage Transform API serves responsive sizes:
  - Thumbnail: ?width=120&height=120&resize=cover
  - Card:      ?width=600
  - Full:      ?width=1200
```

---

## 14. Internationalization (i18n)

### Language Strategy

| Language | Status | Detection |
|---|---|---|
| English | **Primary / Default** | Always fallback |
| Thai (`th`) | **Supported** | Auto-detected from browser `Accept-Language` |

All source code, variable names, API keys, and translation keys are written in **English only**. Thai translations live in a separate locale file — never inline in component logic.

### Library

Use **`@inlang/paraglide-js`** (built for Astro, zero runtime overhead — translations are tree-shaken at build time):

```
pnpm add -D @inlang/paraglide-astro
```

Or use the lightweight alternative **`i18next`** with `i18next-browser-languagedetector`:

```
pnpm add i18next i18next-browser-languagedetector
```

**Recommended: Paraglide** — generates typed message functions, no string-key typos, no runtime bundle cost.

### File Structure

```
apps/web/
└── src/
    └── i18n/
        ├── messages/
        │   ├── en.json       ← source of truth
        │   └── th.json       ← Thai translations
        ├── index.ts          ← exports t(), locale store
        └── config.ts         ← supported locales, default
```

### Locale Config

```typescript
// src/i18n/config.ts
export const locales = ['en', 'th'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'en'

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return defaultLocale
  const lang = navigator.language.slice(0, 2)  // 'th-TH' → 'th'
  return locales.includes(lang as Locale) ? (lang as Locale) : defaultLocale
}
```

### Translation Files

```jsonc
// src/i18n/messages/en.json
{
  "nav.home":           "Home",
  "nav.map":            "Map",
  "nav.report":         "Report",
  "nav.feed":           "Feed",
  "nav.transit":        "Transit",

  "issue.status.open":        "Open",
  "issue.status.in_progress": "In Progress",
  "issue.status.resolved":    "Resolved",
  "issue.status.rejected":    "Rejected",

  "report.step.location":   "Set Location",
  "report.step.category":   "Category",
  "report.step.details":    "Details",
  "report.step.review":     "Review",
  "report.submit":          "Submit Report",

  "category.road":    "Road Damage",
  "category.flood":   "Flooding",
  "category.light":   "Broken Light",
  "category.trash":   "Garbage",
  "category.noise":   "Noise",
  "category.other":   "Other",

  "feed.post.placeholder":  "What's happening in your area?",
  "feed.empty":             "No posts yet. Be the first.",

  "transit.nearby":         "Near Me",
  "transit.route":          "Route",
  "transit.stop":           "Stop",
  "transit.alert":          "Service Alert",

  "auth.login":             "Sign In",
  "auth.register":          "Sign Up",
  "auth.logout":            "Sign Out",

  "common.loading":         "Loading…",
  "common.error":           "Something went wrong.",
  "common.retry":           "Try again",
  "common.save":            "Save",
  "common.cancel":          "Cancel",
  "common.confirm":         "Confirm",
  "common.delete":          "Delete"
}
```

```jsonc
// src/i18n/messages/th.json
{
  "nav.home":           "หน้าแรก",
  "nav.map":            "แผนที่",
  "nav.report":         "แจ้งปัญหา",
  "nav.feed":           "ฟีด",
  "nav.transit":        "ขนส่ง",

  "issue.status.open":        "รอดำเนินการ",
  "issue.status.in_progress": "กำลังดำเนินการ",
  "issue.status.resolved":    "แก้ไขแล้ว",
  "issue.status.rejected":    "ปฏิเสธ",

  "report.step.location":   "เลือกตำแหน่ง",
  "report.step.category":   "ประเภทปัญหา",
  "report.step.details":    "รายละเอียด",
  "report.step.review":     "ตรวจสอบ",
  "report.submit":          "ส่งเรื่องแจ้ง",

  "category.road":    "ถนนชำรุด",
  "category.flood":   "น้ำท่วม",
  "category.light":   "ไฟถนนเสีย",
  "category.trash":   "ขยะ",
  "category.noise":   "เสียงดัง",
  "category.other":   "อื่นๆ",

  "feed.post.placeholder":  "มีอะไรเกิดขึ้นในพื้นที่ของคุณ?",
  "feed.empty":             "ยังไม่มีโพสต์ เป็นคนแรกเลย",

  "transit.nearby":         "ใกล้ฉัน",
  "transit.route":          "สาย",
  "transit.stop":           "ป้าย",
  "transit.alert":          "แจ้งเตือนบริการ",

  "auth.login":             "เข้าสู่ระบบ",
  "auth.register":          "สมัครสมาชิก",
  "auth.logout":            "ออกจากระบบ",

  "common.loading":         "กำลังโหลด…",
  "common.error":           "เกิดข้อผิดพลาด",
  "common.retry":           "ลองใหม่",
  "common.save":            "บันทึก",
  "common.cancel":          "ยกเลิก",
  "common.confirm":         "ยืนยัน",
  "common.delete":          "ลบ"
}
```

### Usage in Components

```svelte
<!-- ✅ Correct — translation key in English, output in detected language -->
<script>
  import { t, locale } from '@/i18n'
</script>

<button>{t('report.submit')}</button>
<span>{t('issue.status.open')}</span>

<!-- Language switcher (shown in settings and header) -->
<select bind:value={$locale}>
  <option value="en">English</option>
  <option value="th">ภาษาไทย</option>
</select>
```

```typescript
// src/i18n/index.ts
import { writable, derived } from 'svelte/store'
import { detectLocale, defaultLocale, type Locale } from './config'
import en from './messages/en.json'
import th from './messages/th.json'

const messages = { en, th }

export const locale = writable<Locale>(
  (typeof localStorage !== 'undefined'
    ? (localStorage.getItem('locale') as Locale)
    : null) ?? detectLocale()
)

// Persist user choice
locale.subscribe(val => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('locale', val)
})

export const t = derived(locale, ($locale) =>
  (key: string, vars?: Record<string, string>) => {
    let msg = messages[$locale][key] ?? messages[defaultLocale][key] ?? key
    if (vars) Object.entries(vars).forEach(([k, v]) => msg = msg.replace(`{{${k}}}`, v))
    return msg
  }
)
```

### Auto-Detection Flow

```
Browser opens site
      ↓
detectLocale() reads navigator.language
      ↓
  'th' found?  ──yes──→ load Thai   → save 'th' to localStorage
      │
      no
      ↓
  default → load English → save 'en' to localStorage
      ↓
User can override anytime via language switcher in header/settings
Preference persists across sessions via localStorage
```

### Rules for the Team

- **Never** hardcode display text in Thai or English directly in a component
- **Always** use `t('key.name')` — even for simple words like "Save" or "Cancel"
- **All keys** use dot-notation English: `noun.verb` or `section.element`
- **Add both** `en.json` and `th.json` entries at the same time — never leave one language missing a key
- If a Thai translation is not ready yet, copy the English value as placeholder — the fallback in `t()` will handle it gracefully

---

*Last updated: 2026 · WDD v1.1*
