import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  
  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('Full URL:', request.url)
  console.log('Code:', code ? 'EXISTS' : 'MISSING')
  console.log('Error param:', error)
  console.log('Error description:', errorDescription)
  console.log('Search params:', requestUrl.search)
  
  if (!code) {
    console.log('No code found in query parameters.')
    if (error) {
      console.log('Redirecting to login with error:', errorDescription || error)
      return NextResponse.redirect(
        new URL(`/login?error=true&message=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }
    console.log('Redirecting to login (fallback).')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
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
            console.error('Cookie setAll error:', err)
          }
        },
      },
    }
  )

  console.log('Exchanging code for session...')
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  
  console.log('Exchange result data:', JSON.stringify(data))
  if (exchangeError) {
    console.log('Exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      new URL(`/login?error=true&message=${encodeURIComponent(exchangeError.message)}`, request.url)
    )
  }
  
  if (data.session) {
    console.log('Success - session established for user:', data.session.user.id)
    
    // Sync profile for LINE users
    const user = data.session.user
    const lineIdentity = user.identities?.find(id => id.provider === 'custom:line')
    if (lineIdentity) {
      console.log('Syncing LINE profile...')
      const lineUserId = lineIdentity.identity_data?.sub
      const displayName = lineIdentity.identity_data?.full_name || lineIdentity.identity_data?.name
      
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: displayName ?? `line_${lineUserId?.substring(0, 8) || user.id.substring(0, 8)}`,
        display_name: displayName || 'LINE User',
        line_user_id: lineUserId,
        role: 'citizen'
      } as any, { onConflict: 'id' })

      if (upsertError) console.error('Profile sync error:', upsertError)
    }
    
    console.log('Redirecting to /map')
    return NextResponse.redirect(new URL('/map', request.url))
  }

  console.log('No session in data after exchange - redirecting to login.')
  return NextResponse.redirect(new URL('/login', request.url))
}
