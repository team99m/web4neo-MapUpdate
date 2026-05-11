import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/map'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      const user = data.session.user
      // Sync profile for LINE users
      const lineIdentity = user.identities?.find(id => id.provider === 'custom:line')
      if (lineIdentity) {
        const lineUserId = lineIdentity.identity_data?.sub
        const displayName = lineIdentity.identity_data?.full_name || lineIdentity.identity_data?.name
        
        await supabase.from('profiles').upsert({
          id: user.id,
          username: displayName ?? `line_${lineUserId?.substring(0, 8) || user.id.substring(0, 8)}`,
          display_name: displayName || 'LINE User',
          line_user_id: lineUserId,
          role: 'citizen'
        } as any, { onConflict: 'id' })
      }
      
      return NextResponse.redirect(new URL('/map', request.url))
    }
    if (error) console.error('Auth callback error:', error)
    return NextResponse.redirect(
      new URL(`/login?error=true&message=${encodeURIComponent(error?.message || 'Exchange failed')}`, request.url)
    )
  }

  // If no code, check if there's an error in the URL (Supabase often passes errors this way)
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=true&message=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
