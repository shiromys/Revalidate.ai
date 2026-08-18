import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Content Security Policy Header definition
  const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com; frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com; connect-src 'self' https://*.supabase.co https://*.supabase.in https://challenges.cloudflare.com https://revalidate.ai https://revalidateai-production.up.railway.app https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com; img-src 'self' blob: data: https:; style-src 'self' 'unsafe-inline';"
  // --- 1. INSTANT PUBLIC ROUTE & WEBHOOK BYPASS ---
  if (pathname.startsWith('/api/webhook')) {
    const response = NextResponse.next()
    response.headers.set('Content-Security-Policy', cspHeader)
    return response
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set Security Header on initial response
  response.headers.set('Content-Security-Policy', cspHeader)

  // Define route categories
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')

  // --- 2. FAST PATH: SKIP SUPABASE NETWORK CALL IF ROUTE IS NOT AUTH/PROTECTED ---
  if (!isDashboardRoute && !isAdminRoute && !isAuthRoute) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.headers.set('Content-Security-Policy', cspHeader)
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.headers.set('Content-Security-Policy', cspHeader)
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Only run session verification for protected or auth routes
  const { data: { user } } = await supabase.auth.getUser()
  
  // Define fallback app URL for canonical redirects
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://revalidate.ai';

  // 1. PROTECTION LOGIC: Redirect unauthenticated users away from dashboard/admin
  if ((isDashboardRoute || isAdminRoute) && !user) {
    return NextResponse.redirect(new URL('/auth/login', appUrl))
  }

  // 2. CONVENIENCE LOGIC: Redirect logged-in users away from auth pages to dashboard
  const isResetFlow = pathname.startsWith('/auth/reset-password') || pathname.startsWith('/auth/verify-otp')
  const isSignout = pathname.startsWith('/auth/signout')

  if (isAuthRoute && user && !isResetFlow && !isSignout) {
    return NextResponse.redirect(new URL('/dashboard', appUrl))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/webhook (STRICT EXCLUSION)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (.svg, .png, .jpg, .css, .js, etc.)
     */
    '/((?!api/webhook|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}