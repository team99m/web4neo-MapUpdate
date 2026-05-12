import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          }
        }
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Save profile after successful login
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name 
                      ?? user.user_metadata?.name 
                      ?? user.email?.split('@')[0] 
                      ?? 'User',
        avatar_url: user.user_metadata?.avatar_url ?? null,
        username: user.user_metadata?.preferred_username
                  ?? user.email?.split('@')[0]
                  ?? 'user_' + user.id.slice(0, 8),
        role: 'citizen'
      }, { onConflict: 'id' })
    }
  }

  return NextResponse.redirect(new URL('/map', request.url))
}
