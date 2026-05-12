import { NextResponse } from 'next/server'
import { createClient } from '@/core/supabase/server'

export async function GET(request: Request) {
  console.log('=== CALLBACK START ===')
  console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('HAS ANON KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('URL:', request.url)

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  console.log('Code exists:', !!code)

  if (code) {
    const supabase = await createClient()
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
