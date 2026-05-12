import { NextResponse } from 'next/server'
import { createClient } from '@/core/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  console.log('=== CALLBACK START ===')
  console.log('Full URL:', url.toString())
  console.log('All params:', Object.fromEntries(url.searchParams))
  
  console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('HAS ANON KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const code = url.searchParams.get('code')
  const errorParam = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')
  
  console.log('Code:', code)
  console.log('Error Param:', errorParam)
  console.log('Error Description:', errorDescription)

  if (errorParam) {
    console.error('Auth error received:', errorParam, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${errorParam}&description=${errorDescription}`, request.url)
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Session user:', data?.user?.email)
    console.log('Session error:', error?.message)

    if (error) {
      console.error('Exchange error:', error.message)
      return NextResponse.redirect(new URL(`/login?error=exchange_error&message=${error.message}`, request.url))
    }
  } else {
    console.log('No code received')
    return NextResponse.redirect(
      new URL('/login?error=no_code', request.url)
    )
  }

  // Redirect to map after successful authentication
  return NextResponse.redirect(new URL('/map', request.url))
}
