import { NextRequest, NextResponse } from 'next/server';
import { withNexusAuth } from '@/lib/nexus/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { parseLimit } from '@/lib/nexus/pagination';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/v1/users/{id}/activity (optional per spec section 3)
 * "Recent usage or error events, for troubleshooting." Backed by this
 * app's existing user_activities table (login/logout/single_email/bulk_email
 * events — see lib/supabase/admin.ts logUserActivity).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withNexusAuth(req, 'users:read', async () => {
    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams.get('limit'));

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', params.id)
      .maybeSingle();
    if (profileError) {
      console.error('🚨 Nexus GET /users/:id/activity profile error:', profileError.message);
      return NexusErrors.serverError();
    }
    if (!profile) return NexusErrors.notFound('User not found.');

    const { data: activities, error } = await supabaseAdmin
      .from('user_activities')
      .select('activity, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('🚨 Nexus GET /users/:id/activity error:', error.message);
      return NexusErrors.serverError();
    }

    return NextResponse.json({
      items: (activities ?? []).map((a) => ({ type: a.activity, created_at: a.created_at })),
    });
  });
}