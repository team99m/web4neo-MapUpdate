import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  console.log('=== CALLBACK START ===')
  console.log('URL:', request.url)
  console.log('Code exists:', !!code)

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
            } catch (err) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Session user:', data?.user?.email)
    console.log('Session error:', error?.message)

    if (error) {
      console.error('Exchange error:', error.message)
      return NextResponse.redirect(new URL('/login?error=true', origin))
    }
  }

  // Redirect to map after successful authentication
  return NextResponse.redirect(new URL('/map', origin))
}
