import type { Profile } from '@/core/supabase/types'

/** Auth session user — extends Profile with auth metadata */
export interface AuthUser extends Profile {
  email: string
}

/** Auth context value exposed by AuthProvider */
export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: () => Promise<void>
  demoLogin: () => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
}
