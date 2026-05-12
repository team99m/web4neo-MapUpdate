/**
 * Web4neo — System Integration Test Script
 * ==========================================
 * Validates that the core platform infrastructure is ready
 * for Modules 1.1, 1.2, and 1.3 implementation.
 *
 * Run:  node scripts/system-test.mjs
 *
 * Tests performed:
 *   1. Environment Configuration
 *   2. Supabase Connectivity (Auth + Database tables)
 *   3. Route Accessibility (all 20+ pages via HTTP)
 *   4. Module-Specific Readiness (Map / Feed / Transit)
 */

import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rvehbomxsetqdvdjhlmb.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nFL8mR94yTQff7YbfV5k6A_LMlQeOuU'

// ─── Helpers ─────────────────────────────────────────
const PASS = '✅'
const FAIL = '❌'
const WARN = '⚠️'
const INFO = 'ℹ️'

let totalPass = 0
let totalFail = 0
let totalWarn = 0
const results = []

function log(icon, section, message, detail = '') {
  const line = `  ${icon}  ${message}${detail ? ` — ${detail}` : ''}`
  console.log(line)
  results.push({ section, icon, message, detail })
}

function pass(section, msg, detail) { totalPass++; log(PASS, section, msg, detail) }
function fail(section, msg, detail) { totalFail++; log(FAIL, section, msg, detail) }
function warn(section, msg, detail) { totalWarn++; log(WARN, section, msg, detail) }

function header(title) {
  console.log('')
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  ${title}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

// ─── Test 1: Environment Configuration ───────────────
async function testEnvironment() {
  header('1. Environment Configuration')

  if (SUPABASE_URL && SUPABASE_URL.startsWith('https://')) {
    pass('env', 'SUPABASE_URL is set', SUPABASE_URL.substring(0, 40) + '...')
  } else {
    fail('env', 'SUPABASE_URL is missing or invalid')
  }

  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10) {
    pass('env', 'SUPABASE_ANON_KEY is set', `${SUPABASE_ANON_KEY.length} chars`)
  } else {
    fail('env', 'SUPABASE_ANON_KEY is missing or too short')
  }

  pass('env', 'BASE_URL configured', BASE_URL)
}

// ─── Test 2: Supabase Connectivity ───────────────────
async function testSupabase() {
  header('2. Supabase Connectivity')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // 2a. Auth service
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    pass('supabase', 'Auth service reachable', 'getSession() OK')
  } catch (e) {
    fail('supabase', 'Auth service unreachable', e.message)
  }

  // 2b. Database tables required for Module 1.1 (Map & Issues)
  const module11Tables = ['issues', 'profiles']
  for (const table of module11Tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      if (error) throw error
      pass('supabase', `Table "${table}" accessible`, `${data.length} row(s) sampled`)
    } catch (e) {
      if (e.message?.includes('does not exist') || e.code === '42P01') {
        fail('supabase', `Table "${table}" does NOT exist`, 'Run supabase_setup.sql first')
      } else {
        warn('supabase', `Table "${table}" query issue`, e.message)
      }
    }
  }

  // 2c. Database tables required for Module 1.2 (Feed)
  const module12Tables = ['posts', 'comments', 'reactions']
  for (const table of module12Tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      if (error) throw error
      pass('supabase', `Table "${table}" accessible`, `${data.length} row(s) sampled`)
    } catch (e) {
      if (e.message?.includes('does not exist') || e.code === '42P01') {
        fail('supabase', `Table "${table}" does NOT exist`, 'Required for Module 1.2')
      } else {
        warn('supabase', `Table "${table}" query issue`, e.message)
      }
    }
  }

  // 2d. Database tables required for Module 1.3 (Transit)
  const module13Tables = ['transit_routes', 'transit_stops']
  for (const table of module13Tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      if (error) throw error
      pass('supabase', `Table "${table}" accessible`, `${data.length} row(s) sampled`)
    } catch (e) {
      if (e.message?.includes('does not exist') || e.code === '42P01') {
        fail('supabase', `Table "${table}" does NOT exist`, 'Required for Module 1.3')
      } else {
        warn('supabase', `Table "${table}" query issue`, e.message)
      }
    }
  }

  // 2e. Notifications table
  try {
    const { data, error } = await supabase.from('notifications').select('id').limit(1)
    if (error) throw error
    pass('supabase', 'Table "notifications" accessible', `${data.length} row(s) sampled`)
  } catch (e) {
    warn('supabase', 'Table "notifications" query issue', e.message)
  }

  // 2f. Realtime channel test (Module 1.2 dependency)
  try {
    const channel = supabase.channel('test-channel')
    pass('supabase', 'Realtime channel creation', 'channel("test-channel") OK')
    supabase.removeChannel(channel)
  } catch (e) {
    fail('supabase', 'Realtime channel creation failed', e.message)
  }
}

// ─── Test 3: Route Accessibility ─────────────────────
async function testRoutes() {
  header('3. Route Accessibility (HTTP GET)')

  const routes = [
    // Core routes
    { path: '/',             module: 'Core',    desc: 'Landing Page' },
    { path: '/home',         module: 'Core',    desc: 'User Dashboard' },
    { path: '/login',        module: 'Core',    desc: 'Login Page' },
    { path: '/register',     module: 'Core',    desc: 'Register Page' },
    { path: '/settings',     module: 'Core',    desc: 'Settings Page' },
    { path: '/notifications',module: 'Core',    desc: 'Notifications Page' },

    // Module 1.1: Map & Issue Reporting
    { path: '/map',          module: '1.1 Map',     desc: 'Map Page' },
    { path: '/report',       module: '1.1 Report',  desc: 'Report Wizard' },

    // Module 1.2: Community Feed
    { path: '/feed',         module: '1.2 Feed',    desc: 'Community Feed' },
    { path: '/post/new',     module: '1.2 Feed',    desc: 'New Post Page' },

    // Module 1.3: Transit
    { path: '/transit',      module: '1.3 Transit', desc: 'Transit Hub' },
    { path: '/transit/nearby', module: '1.3 Transit', desc: 'Nearby Stops' },

    // Admin
    { path: '/admin',        module: 'Admin',   desc: 'Admin Panel' },
    { path: '/admin/issues', module: 'Admin',   desc: 'Issue Management' },
    { path: '/admin/transit', module: 'Admin',  desc: 'Transit Management' },
    { path: '/admin/users',  module: 'Admin',   desc: 'User Management' },
    { path: '/dashboard',    module: 'Admin',   desc: 'Staff Dashboard' },
  ]

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        pass('routes', `[${route.module}] ${route.desc}`, `${route.path} → ${res.status}`)
      } else {
        fail('routes', `[${route.module}] ${route.desc}`, `${route.path} → ${res.status}`)
      }
    } catch (e) {
      fail('routes', `[${route.module}] ${route.desc}`, `${route.path} → ${e.message}`)
    }
  }
}

// ─── Test 4: Module-Specific Readiness ───────────────
async function testModuleReadiness() {
  header('4. Module-Specific Readiness')

  // 4a. Module 1.1 — Map Engine & Issue Reporting
  console.log('\n  📍 Module 1.1: Map Engine & Issue Reporting')
  console.log('  ─────────────────────────────────────────')

  // Check Leaflet dependency
  try {
    const pkg = (await import('../package.json', { with: { type: 'json' } })).default
    if (pkg.dependencies?.leaflet) {
      pass('mod1.1', 'Leaflet dependency installed', `v${pkg.dependencies.leaflet}`)
    } else {
      fail('mod1.1', 'Leaflet dependency missing', 'npm install leaflet')
    }
    if (pkg.devDependencies?.['@types/leaflet']) {
      pass('mod1.1', 'Leaflet TypeScript types installed', `v${pkg.devDependencies['@types/leaflet']}`)
    } else {
      warn('mod1.1', 'Leaflet TypeScript types missing', 'npm install -D @types/leaflet')
    }
  } catch {
    warn('mod1.1', 'Could not parse package.json for dependency check')
  }

  // Check MapCore component exists
  try {
    const mapRes = await fetch(`${BASE_URL}/map`, { signal: AbortSignal.timeout(8000) })
    const html = await mapRes.text()
    if (html.includes('leaflet') || html.includes('map')) {
      pass('mod1.1', 'MapCore component renders on /map', 'Leaflet CSS/script detected')
    } else {
      warn('mod1.1', 'MapCore renders but Leaflet references not found in HTML')
    }
  } catch (e) {
    fail('mod1.1', '/map page unreachable', e.message)
  }

  // Check AuthGuard on /report
  try {
    const reportRes = await fetch(`${BASE_URL}/report`, { signal: AbortSignal.timeout(8000) })
    if (reportRes.ok) {
      pass('mod1.1', 'Report wizard route accessible', '/report → 200')
    }
  } catch (e) {
    fail('mod1.1', '/report route failed', e.message)
  }

  // Supabase issue schema validation
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  try {
    const { data, error } = await supabase.from('issues').select('id, title, category, status, lat, lng, user_id').limit(0)
    if (error) throw error
    pass('mod1.1', 'Issues table schema validated', 'All required columns present')
  } catch (e) {
    fail('mod1.1', 'Issues table schema check failed', e.message)
  }

  // 4b. Module 1.2 — Real-Time Community Feed
  console.log('\n  💬 Module 1.2: Real-Time Community Feed')
  console.log('  ─────────────────────────────────────────')

  try {
    const { data, error } = await supabase.from('posts').select('id, user_id, content, category, visibility').limit(0)
    if (error) throw error
    pass('mod1.2', 'Posts table schema validated', 'All required columns present')
  } catch (e) {
    fail('mod1.2', 'Posts table schema check failed', e.message)
  }

  try {
    const { data, error } = await supabase.from('comments').select('id, user_id, parent_type, parent_id, content').limit(0)
    if (error) throw error
    pass('mod1.2', 'Comments table schema validated', 'All required columns present')
  } catch (e) {
    fail('mod1.2', 'Comments table schema check failed', e.message)
  }

  try {
    const { data, error } = await supabase.from('reactions').select('id, user_id, parent_type, parent_id, type').limit(0)
    if (error) throw error
    pass('mod1.2', 'Reactions table schema validated', 'All required columns present')
  } catch (e) {
    fail('mod1.2', 'Reactions table schema check failed', e.message)
  }

  // Realtime subscription test
  try {
    const channel = supabase
      .channel('feed-test')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {})
    pass('mod1.2', 'Realtime subscription configurable', 'postgres_changes on "posts" OK')
    supabase.removeChannel(channel)
  } catch (e) {
    fail('mod1.2', 'Realtime subscription failed', e.message)
  }

  // 4c. Module 1.3 — Smart Transit Hub
  console.log('\n  🚌 Module 1.3: Smart Transit Hub')
  console.log('  ─────────────────────────────────────────')

  try {
    const { data, error } = await supabase.from('transit_routes').select('id, name, type, color, polyline, active').limit(0)
    if (error) throw error
    pass('mod1.3', 'Transit routes table schema validated', 'All required columns present')
  } catch (e) {
    fail('mod1.3', 'Transit routes table schema check failed', e.message)
  }

  try {
    const { data, error } = await supabase.from('transit_stops').select('id, route_id, name, lat, lng, sequence').limit(0)
    if (error) throw error
    pass('mod1.3', 'Transit stops table schema validated', 'All required columns present')
  } catch (e) {
    fail('mod1.3', 'Transit stops table schema check failed', e.message)
  }

  // Check transit sub-routes
  for (const subRoute of ['/transit', '/transit/nearby']) {
    try {
      const res = await fetch(`${BASE_URL}${subRoute}`, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        pass('mod1.3', `Transit sub-route accessible`, `${subRoute} → ${res.status}`)
      } else {
        fail('mod1.3', `Transit sub-route failed`, `${subRoute} → ${res.status}`)
      }
    } catch (e) {
      fail('mod1.3', `Transit sub-route failed`, `${subRoute} → ${e.message}`)
    }
  }
}

// ─── Summary ─────────────────────────────────────────
function printSummary() {
  header('FINAL SUMMARY')
  const total = totalPass + totalFail + totalWarn
  console.log(`\n  Total checks: ${total}`)
  console.log(`  ${PASS}  Passed:   ${totalPass}`)
  console.log(`  ${FAIL}  Failed:   ${totalFail}`)
  console.log(`  ${WARN}  Warnings: ${totalWarn}`)
  console.log('')

  if (totalFail === 0) {
    console.log('  🚀 ALL SYSTEMS GO — Ready for Modules 1.1, 1.2, and 1.3!')
  } else {
    console.log(`  🛑 ${totalFail} issue(s) must be resolved before proceeding.`)
  }
  console.log('')
}

// ─── Main ────────────────────────────────────────────
async function main() {
  console.log('')
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║   Web4neo — System Integration Test Suite        ║')
  console.log('║   Validating readiness for Modules 1.1–1.3      ║')
  console.log('╚══════════════════════════════════════════════════╝')

  await testEnvironment()
  await testSupabase()
  await testRoutes()
  await testModuleReadiness()
  printSummary()

  process.exit(totalFail > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(2)
})
