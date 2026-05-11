import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  console.log('--- Auth Callback Start ---')
  console.log('URL:', request.url)
  console.log('Code present:', !!code)

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
              console.error('Cookie setAll error:', err)
            }
          },
        },
      }
    )

    console.log('Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange result - Error:', error ? error.message : 'none')
    console.log('Exchange result - Session present:', !!data.session)

    if (!error && data.session) {
      const user = data.session.user
      console.log('User ID:', user.id)
      
      // Sync profile for LINE users
      const lineIdentity = user.identities?.find(id => id.provider === 'custom:line')
      if (lineIdentity) {
        console.log('LINE Identity found, syncing profile...')
        const lineUserId = lineIdentity.identity_data?.sub
        const displayName = lineIdentity.identity_data?.full_name || lineIdentity.identity_data?.name
        
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: user.id,
          username: displayName ?? `line_${lineUserId?.substring(0, 8) || user.id.substring(0, 8)}`,
          display_name: displayName || 'LINE User',
          line_user_id: lineUserId,
          role: 'citizen'
        } as any, { onConflict: 'id' })

        if (upsertError) console.error('Profile upsert error:', upsertError)
      }
      
      console.log('Redirecting to /map')
      return NextResponse.redirect(new URL('/map', request.url))
    }
    
    if (error) {
      console.error('Auth callback error detail:', error)
      return NextResponse.redirect(
        new URL(`/login?error=true&message=${encodeURIComponent(error.message)}`, request.url)
      )
    }
  }

  // If no code, check if there's an error in the URL (Supabase often passes errors this way)
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  if (errorParam) {
    console.error('Supabase returned error in URL:', errorParam, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=true&message=${encodeURIComponent(errorDescription || errorParam)}`, request.url)
    )
  }

  console.log('Fallback: Redirecting to /login')
  return NextResponse.redirect(new URL('/login', request.url))
}
