import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Supabase browser client — singleton.
 * Uses @supabase/ssr for App Router compatibility.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
