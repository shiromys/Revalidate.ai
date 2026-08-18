import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  let next = searchParams.get('next')

  // FORCE OVERRIDE
  if (!next || next === '/' || next === '/dashboard') {
    next = '/auth/login?message=Email verified! You can now log in.'
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://revalidateai-production.up.railway.app'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${appUrl}${next}`)
    } else {
      // 🚨 ADDED: This will print the EXACT reason it failed in your terminal!
      console.error("🚨 SUPABASE VERIFICATION ERROR:", error.message)
    }
  }

  return NextResponse.redirect(`${appUrl}/auth/login?error=Could not verify link`)
}