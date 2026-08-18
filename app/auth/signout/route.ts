import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { logUserActivity } from '@/lib/supabase/admin';

/**
 * SIGNOUT ROUTE HANDLER
 * Workflow: Log Activity -> Destroy Session -> Clear Next.js Cache -> Redirect to Login
 */
// FIXED: Removed the unused 'request' parameter
export async function POST() {
  const supabase = createClient();
  
  // 1. ACTIVITY TRACKER: Get the user BEFORE we destroy the session!
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    await logUserActivity(user.id, user.email, 'logout');
  }

  // 2. Sign out from Supabase 
  // This clears the auth cookies (access_token, refresh_token)
  await supabase.auth.signOut();

  // 3. Clear the cache
  // This ensures the Middleware and Dashboard Layout don't show "Stale" logged-in states
  revalidatePath('/', 'layout');

  // 4. BULLETPROOF REDIRECT: Force the correct domain so Railway's internal localhost doesn't leak!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revalidateai-production.up.railway.app';

  return NextResponse.redirect(new URL('/auth/login', appUrl), {
    status: 302,
  });
}

/**
 * GET Handler
 * Prevents 405 Method Not Allowed if a user types the URL manually 
 * or uses a browser bookmark.
 */
// FIXED: Removed the unused 'request' parameter
export async function GET() {
  const supabase = createClient();
  
  // 1. ACTIVITY TRACKER: Get the user BEFORE we destroy the session!
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    await logUserActivity(user.id, user.email, 'logout');
  }
  
  // 2. Sign out
  await supabase.auth.signOut();
  
  // 3. Clear Cache
  revalidatePath('/', 'layout');
  
  // 4. BULLETPROOF REDIRECT: Consistency check: Ensuring GET also lands on the Login page securely
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revalidateai-production.up.railway.app';
  
  return NextResponse.redirect(new URL('/auth/login', appUrl), { 
    status: 302 
  });
}