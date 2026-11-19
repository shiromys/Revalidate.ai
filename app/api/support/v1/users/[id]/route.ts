import { NextRequest, NextResponse } from 'next/server';
import { withNexusAuth } from '@/lib/nexus/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { toNexusUser } from '@/lib/nexus/mappers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/v1/users/{id}
 * "Basic user profile: name, email, plan, signup date, last active, account
 * status" (spec section 3). Deliberately never selects password hashes,
 * Stripe customer/payment details, or anything beyond what's listed in the
 * User shape (spec section 4 / section 7 "least access").
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withNexusAuth(req, 'users:read', async () => {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, wallet_credits, monthly_basic_used, is_suspended, created_at')
      .eq('id', params.id)
      .maybeSingle();

    if (error) {
      console.error('🚨 Nexus GET /users/:id error:', error.message);
      return NexusErrors.serverError();
    }
    if (!profile) return NexusErrors.notFound('User not found.');

    const [{ data: lastActivity }, { data: txn }] = await Promise.all([
      supabaseAdmin
        .from('user_activities')
        .select('created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.from('transactions').select('id').eq('user_id', profile.id).limit(1).maybeSingle(),
    ]);

    return NextResponse.json(
      toNexusUser(profile, {
        lastActiveAt: lastActivity?.created_at ?? null,
        hasPurchased: Boolean(txn),
      })
    );
  });
}