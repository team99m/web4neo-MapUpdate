# WDD — Module 1.3: Transit Map

> Extends: `WDD-Overview.md` · Person D · Depends on: Module 0 Core + Module 1.1 MapCore

---

## 1. Module Overview

A public transport tracking and navigation layer. Displays bus, BTS, MRT, and boat routes on an interactive map. Users can select a route, see all stops, view schedules, and receive service alerts. Built on top of MapCore from Module 0 and optionally overlays civic issues from Module 1.1.

---

## 2. Pages & Routes

| Route | Description | Auth |
|---|---|---|
| `/transit` | Full-screen transit map — all routes | Public |
| `/transit?type=bus` | Filter by transport type | Public |
| `/transit/:routeId` | Route detail — stops, schedule, alerts | Public |
| `/transit/stop/:stopId` | Stop detail — arriving routes, nearby issues | Public |
| `/transit/nearby` | Routes and stops near current location | Public |
| `/admin/transit` | Admin — manage routes and stops | Admin |

---

## 3. User Flows

### 3.1 Browsing Routes

```
1. Open /transit
2. Default view: all active routes drawn as colored polylines on map
3. Route list panel (bottom sheet, swipeable up):
     [All] [Bus] [BTS] [MRT] [Boat]
     — scrollable list of routes with color dot + name
4. Tap a route → highlights it on map, shows stop pins
5. Bottom sheet expands to show stop list for selected route
6. Tap stop → stop detail popup
```

### 3.2 Viewing a Route

```
/transit/:routeId
  - Route name, type badge (Bus / BTS / MRT / Boat)
  - Route polyline highlighted on map
  - Stop list (ordered by sequence)
  - Schedule accordion (if available)
  - Service alerts for this route
  - Nearby issues toggle (from Module 1.1)
```

### 3.3 Finding Nearby Transport

```
/transit/nearby
  - Auto-detect GPS location
  - Show stops within 500m radius
  - Sorted by walking distance
  - Each stop: route badges, walking time estimate
  - Tap stop → /transit/stop/:stopId
```

### 3.4 Stop Detail

```
/transit/stop/:stopId
  - Stop name + location on mini-map
  - Routes passing through this stop
  - Next departures (if realtime data available)
  - Nearby civic issues (optional overlay from 1.1)
  - Street-level photo (from Supabase Storage)
```

---

## 4. Map System

Builds on **MapCore** from Module 0. Transit adds these layers on top of the base map:

### Layer Stack (Leaflet)

```
Layer 1: OpenStreetMap base tiles          (always visible)
Layer 2: Civic issue pins                  (from Module 1.1, toggle)
Layer 3: Route polylines                   (colored by type)
Layer 4: Stop markers                      (small circle pins)
Layer 5: Selected route highlight          (thicker, glowing stroke)
Layer 6: Nearby radius circle              (on /transit/nearby)
Layer 7: User location dot                 (pulsing blue dot)
```

### Route Colors by Type

| Type | Color | Hex |
|---|---|---|
| Bus | Orange | `#EF9F27` |
| BTS Skytrain | Green | `#1D9E75` |
| MRT Subway | Blue | `#378ADD` |
| Boat | Navy | `#185FA5` |
| Airport Link | Red | `#D85A30` |
| Custom | Use `transit_routes.color` field | — |

### Drawing Routes

Routes stored as GeoJSON LineString in `transit_routes.polyline`. Rendered with Leaflet `L.geoJSON()`:

```javascript
const routeLayer = L.geoJSON(route.polyline, {
  style: {
    color: route.color,
    weight: 4,
    opacity: 0.85,
    lineJoin: 'round',
    lineCap: 'round'
  }
})

// Highlight selected route
const selectedLayer = L.geoJSON(route.polyline, {
  style: {
    color: route.color,
    weight: 7,
    opacity: 0.5
  }
})
```

### Stop Markers

```javascript
const stopIcon = L.divIcon({
  className: 'transit-stop',
  html: `<div class="stop-dot" style="background:${color}"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
})
```

CSS for stop dot:
```css
.stop-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
```

---

## 5. Components

### `<TransitMap />`

Main map component. Wraps MapCore with transit-specific layers.

```svelte
<TransitMap
  activeRoute={selectedRoute}
  showIssueOverlay={showIssues}
  onStopClick={(stopId) => goto(`/transit/stop/${stopId}`)}
  onRouteClick={(routeId) => goto(`/transit/${routeId}`)}
/>
```

### `<RouteListPanel />`

Bottom sheet with route list. Swipe up to expand, down to minimize.

```
┌──────────────────────────────────┐
│ ━━━  (drag handle)               │
│ [All] [Bus] [BTS] [MRT] [Boat]   │
│ ─────────────────────────────── │
│ 🟠 Bus 23  Siam → On Nut         │
│ 🟠 Bus 79  Victory Monument ...  │
│ 🟢 BTS Sukhumvit Line            │
│ 🔵 MRT Blue Line                 │
└──────────────────────────────────┘
```

### `<StopListAccordion />`

Ordered list of stops for the selected route. Clickable, with distance badge if GPS is active.

```
● Siam BTS         (start)
● Asok              0.3 km
◉ Phrom Phong       ← nearest to you
● On Nut
● Bang Na           (end)
```

### `<ServiceAlert />`

Banner shown when a route has active service disruptions.

```
⚠️  BTS Sukhumvit: Delays between Siam–Asok due to maintenance
```

Stored in `service_alerts` table, shown on route and stop pages.

### `<NearbyStopsCard />`

Card showing closest stop and its routes. Used in `/transit/nearby` and as a widget on the homepage.

```
┌────────────────────────────────┐
│ 📍 Asok Station    180m walk   │
│ 🟢 BTS · 🔵 MRT              │
│ Next BTS: 4 min                │
└────────────────────────────────┘
```

---

## 6. Data Model (Module 1.3 Owned)

Core tables in `WDD-Overview.md §6`. Additional tables:

```sql
-- Service alerts per route
service_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id    uuid REFERENCES transit_routes(id),
  title       text NOT NULL,
  message     text,
  severity    text DEFAULT 'info', -- info | warning | critical
  active      boolean DEFAULT true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz DEFAULT now()
)

-- Stop arrival schedules (static, not realtime)
stop_schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id     uuid REFERENCES transit_stops(id),
  route_id    uuid REFERENCES transit_routes(id),
  weekday     text, -- mon-fri | sat | sun | holiday
  times       text[]  -- array of HH:MM strings e.g. ['06:00','06:15','06:30']
)

-- Stop photos
stop_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id     uuid REFERENCES transit_stops(id),
  url         text,
  uploaded_by uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
)
```

---

## 7. Seeding Route Data

Transit route data must be pre-loaded. Source the following data:

| Network | Data Source |
|---|---|
| BTS Skytrain | Official GTFS from [OpenMobilityData](https://transitfeeds.com) |
| MRT Subway | Manual entry or official open data |
| Bangkok Bus | BMTA open data (if available) |
| Chao Phraya Boat | Manual entry |

Import script converts GTFS → `transit_routes` + `transit_stops` rows:

```
supabase/seed/import-gtfs.js
  reads: gtfs/routes.txt, gtfs/stops.txt, gtfs/shapes.txt
  outputs: SQL INSERT statements
  run: node import-gtfs.js | psql $SUPABASE_DB_URL
```

---

## 8. Issue Overlay (Integration with Module 1.1)

When user toggles "Show Issues" on the transit map, civic issue pins load from Module 1.1:

```svelte
// In TransitMap.svelte
import { issueStore } from '@modules/issues'

let showIssues = false
let issues = []

$: if (showIssues) {
  issueStore.list({ status: 'open', bbox: mapBounds }).then(r => issues = r)
}
```

Issue pins use Module 1.1's existing `IssueCard` popup component — no duplication.

Toggle button in map controls:
```
[🔴 Show Issues]  ← teal when active
```

---

## 9. Realtime Considerations

At v1, realtime vehicle positions are **not required** (GTFS-RT feeds need paid API access). The system shows:
- Static route polylines
- Static stop list
- Static schedule times
- Manual service alerts (admin updates)

Design the data model to support realtime in v2:

```sql
-- Future: vehicle positions (GTFS-RT)
vehicles (
  id          text PRIMARY KEY,  -- vehicle ID from GTFS-RT
  route_id    uuid REFERENCES transit_routes(id),
  lat         double precision,
  lng         double precision,
  bearing     int,               -- degrees 0-359
  updated_at  timestamptz
)
```

When realtime is added, vehicle dots animate on map using Supabase Realtime channel.

---

## 10. Admin Panel `/admin/transit`

Admin interface for managing route data without touching SQL.

Features:
- Route table: list, create, edit, deactivate
- Stop table: linked to route, drag-reorder for sequence
- Service alert creator: select route, set message, severity, time range
- Route preview: draw route on mini-map from stored polyline

---

## 11. Performance Notes

- Route polylines can be large (many coordinates). Store simplified GeoJSON (Douglas-Peucker algorithm, tolerance 0.00005) at save time
- Load only visible routes based on current map bounds (spatial query via PostGIS if available, or client-side bounding box filter)
- Tile caching: Leaflet's default tile caching + Service Worker caches visited tile areas
- Stop markers use `L.divIcon` (DOM-based) not image icons — faster render, no network request

```sql
-- Spatial filter for stops in viewport (PostGIS extension)
SELECT * FROM transit_stops
WHERE lat BETWEEN $south AND $north
  AND lng BETWEEN $west AND $east;
```

---

## 12. Shared Exports

```typescript
// src/modules/transit/index.ts
export { TransitMap } from './components/TransitMap.svelte'
export { NearbyStopsCard } from './components/NearbyStopsCard.svelte'
export { transitStore } from './stores/transit'
export type { TransitRoute, TransitStop } from './types'
```

`NearbyStopsCard` can be embedded in the homepage or the issue report page (shows transport options near a reported issue).

---

*WDD-Module-1.3 · v1.0*
