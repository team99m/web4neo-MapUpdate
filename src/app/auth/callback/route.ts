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
      const googleName = user.user_metadata?.full_name 
                      ?? user.user_metadata?.name 
                      ?? null
      const googleAvatar = user.user_metadata?.avatar_url 
                        ?? user.user_metadata?.picture 
                        ?? null
      const googleEmail = user.email ?? null
      const username = googleEmail?.split('@')[0] ?? 'user_' + user.id.slice(0, 8)

      console.log('Saving Google profile:', { googleName, googleAvatar, googleEmail })

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: googleEmail,
        username: username,
        display_name: googleName,
        avatar_url: googleAvatar,
        role: 'citizen'
      }, { onConflict: 'id' })

      if (profileError) {
        console.log('Profile save error:', profileError.message)
      }
    }
  }

  return NextResponse.redirect(new URL('/map', request.url))
}
