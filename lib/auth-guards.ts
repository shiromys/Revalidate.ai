import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
 
type GuardResult = { user: User; response: null } | { user: null; response: NextResponse };
 
/** Requires a logged-in Supabase session (cookie). Use in API routes. */
export async function requireUser(): Promise<GuardResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 }) };
  }
  return { user, response: null };
}