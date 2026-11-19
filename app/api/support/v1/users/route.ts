import { NextRequest, NextResponse } from 'next/server';
import { withNexusAuth } from '@/lib/nexus/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { toNexusUser } from '@/lib/nexus/mappers';
import { decodeCursor, encodeCursor, parseLimit } from '@/lib/nexus/pagination';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/v1/users?q=...
 * "Find a user by email or q" (spec section 3). `email` is accepted as an
 * alias for an exact match; `q` does a partial (ilike) match on email,
 * since name isn't collected at signup in this app.
 */
export async function GET(req: NextRequest) {
  return withNexusAuth(req, 'users:read', async () => {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const q = searchParams.get('q');
    const limit = parseLimit(searchParams.get('limit'));
    const cursor = decodeCursor(searchParams.get('cursor'));

    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, wallet_credits, monthly_basic_used, is_suspended, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (email) query = query.ilike('email', email);
    else if (q) query = query.ilike('email', `%${q}%`);
    if (cursor) query = query.lt('created_at', cursor);

    const { data: profiles, error } = await query;
    if (error) {
      console.error('🚨 Nexus GET /users error:', error.message);
      return NexusErrors.serverError();
    }

    const rows = profiles ?? [];
    const userIds = rows.map((p) => p.id);

    const [{ data: activities }, { data: txns }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from('user_activities').select('user_id, created_at').in('user_id', userIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] as { user_id: string; created_at: string }[] }),
      userIds.length
        ? supabaseAdmin.from('transactions').select('user_id').in('user_id', userIds)
        : Promise.resolve({ data: [] as { user_id: string }[] }),
    ]);

    const lastActiveByUser = new Map<string, string>();
    for (const a of activities ?? []) {
      if (!lastActiveByUser.has(a.user_id)) lastActiveByUser.set(a.user_id, a.created_at);
    }
    const purchasedUserIds = new Set((txns ?? []).map((t) => t.user_id));

    const items = rows.map((row) =>
      toNexusUser(row, {
        lastActiveAt: lastActiveByUser.get(row.id) ?? null,
        hasPurchased: purchasedUserIds.has(row.id),
      })
    );
    const nextCursor = rows.length === limit ? encodeCursor(rows[rows.length - 1].created_at) : undefined;

    return NextResponse.json({ items, next_cursor: nextCursor });
  });
}
