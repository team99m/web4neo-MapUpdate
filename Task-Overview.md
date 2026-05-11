# Phase 1: Core Engine (Module 0) — Task Tracker

## 1. Project Scaffold
- [x] Check `create-next-app` options
- [x] Initialize Next.js App Router project
- [x] Install dependencies (leaflet, react-leaflet, @supabase/supabase-js)
- [x] Configure `next.config.js`
- [x] Create `.env.local` template for Supabase keys
- [x] Remove Tailwind (vanilla CSS only)

## 2. Design System (Functional)
- [x] `globals.css` — CSS custom properties, base reset, typography, spacing
- [x] GPU acceleration utility classes
- [x] Animation keyframes (slideUp, fadeIn, pulse, spin, shimmer, scaleIn)

## 3. Supabase Client
- [x] `src/core/supabase/client.ts` — browser client
- [x] `src/core/supabase/types.ts` — database type definitions (all 8 tables)

## 4. Auth System
- [x] `src/core/auth/types.ts`
- [x] `src/core/auth/AuthProvider.tsx` — React Context
- [x] `src/core/auth/useAuth.ts` — hook
- [x] `src/core/auth/AuthGuard.tsx` — redirect wrapper with role support

## 5. Component Library
- [x] `Button.tsx` + CSS module
- [x] `Card.tsx` + CSS module
- [x] `Modal.tsx` + CSS module
- [x] `Toast.tsx` + CSS module + `toastStore.ts`
- [x] `BottomNav.tsx` + CSS module
- [x] `Avatar.tsx` + CSS module
- [x] `Badge.tsx` + CSS module
- [x] `Spinner.tsx` + CSS module
- [x] `CategoryChip.tsx` + CSS module

## 6. Map Engine
- [x] `MapCore.tsx` + CSS module — Leaflet dynamic wrapper
- [x] `MapMarker.tsx` — custom markers by type/status
- [x] `useGeolocation.ts` — GPS hook

## 7. i18n System (EN-only)
- [x] `config.ts` — locale config
- [x] `I18nProvider.tsx` — context
- [x] `useTranslation.ts` — hook
- [x] `messages/en.json` — full EN translations from WDD

## 8. Utilities
- [x] `imageCompress.ts` — WebP compression pipeline
- [x] `gpu.ts` — GPU acceleration helpers
- [x] `formatDate.ts` — relative time formatting
- [x] `cn.ts` — className merger

## 9. App Shell & Routes (18 routes)
- [x] Root layout with providers (Auth, i18n, Toast, BottomNav)
- [x] Landing page `/`
- [x] Map page `/map` (full Leaflet map)
- [x] Issue detail `/issues/[id]` (dynamic)
- [x] Report `/report` (auth-guarded)
- [x] Feed `/feed`
- [x] Post detail `/post/[id]` (dynamic)
- [x] New post `/post/new` (auth-guarded)
- [x] Transit `/transit`
- [x] Route detail `/transit/[routeId]` (dynamic)
- [x] Stop detail `/transit/stop/[stopId]` (dynamic)
- [x] Nearby `/transit/nearby`
- [x] Profile `/profile/[username]` (dynamic)
- [x] Edit profile `/profile/edit` (auth-guarded)
- [x] Admin `/admin` (admin-only)
- [x] Admin issues `/admin/issues` (admin-only)
- [x] Admin transit `/admin/transit` (admin-only)
- [x] Dashboard `/dashboard` (staff/admin)
- [x] Login `/login`
- [x] Register `/register`
- [x] Settings `/settings` (auth-guarded)
- [x] Notifications `/notifications` (auth-guarded)

## 10. Build Verification
- [x] `npm run build` — ✅ zero TypeScript errors
- [x] `npm run dev` — ✅ renders on localhost:3000
- [x] All static routes accessible — ✅ 18/18
- [x] All dynamic routes work — ✅ [id], [username], [routeId], [stopId]
- [x] Map renders OpenStreetMap tiles — ✅ Bangkok centered
- [x] Supabase connected (.env configured) — ✅
- [x] BottomNav present on all pages — ✅
- [x] i18n labels working — ✅

## ✅ PHASE 1 COMPLETE
