import { NextRequest, NextResponse } from 'next/server';
import { withNexusAuth } from '@/lib/nexus/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { toNexusTicket } from '@/lib/nexus/mappers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/v1/users/{id}/tickets
 * "All tickets from one user" (spec section 3).
 *
 * support_tickets.user_id is only populated when the ticket was raised by
 * a logged-in user; tickets from the public contact form (not logged in)
 * have user_id = null and are matched by email instead so a user's
 * pre-signup contact-form tickets still show up here.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // This returns ticket data, not profile data, so it's gated on
  // tickets:read — a key with users:read but not tickets:read should not
  // be able to use this as a backdoor into ticket contents.
  return withNexusAuth(req, 'tickets:read', async () => {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', params.id)
      .maybeSingle();

    if (profileError) {
      console.error('🚨 Nexus GET /users/:id/tickets profile error:', profileError.message);
      return NexusErrors.serverError();
    }
    if (!profile) return NexusErrors.notFound('User not found.');

    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .or(`user_id.eq.${profile.id},email.ilike.${profile.email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🚨 Nexus GET /users/:id/tickets error:', error.message);
      return NexusErrors.serverError();
    }

    const rows = tickets ?? [];
    const ticketIds = rows.map((t) => t.id);
    const previews = new Map<string, string>();
    if (ticketIds.length > 0) {
      const { data: messages } = await supabaseAdmin
        .from('support_messages')
        .select('ticket_id, body_text, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false });
      for (const m of messages ?? []) {
        if (!previews.has(m.ticket_id)) previews.set(m.ticket_id, m.body_text);
      }
    }

    const items = rows.map((row) => toNexusTicket(row, previews.get(row.id) ?? row.message ?? ''));
    return NextResponse.json({ items });
  });
}