import { NextRequest, NextResponse } from 'next/server';
import { withNexusAuth } from '@/lib/nexus/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { toNexusTicket } from '@/lib/nexus/mappers';
import { decodeCursor, encodeCursor, parseLimit } from '@/lib/nexus/pagination';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['open', 'pending', 'resolved', 'closed'];

/**
 * GET /api/support/v1/tickets
 * Filters: status, assignee, updated_since, q (search), plus limit and cursor.
 * Spec section 3 (required) and section 6 (pagination conventions).
 */
export async function GET(req: NextRequest) {
  return withNexusAuth(req, 'tickets:read', async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');
    const updatedSince = searchParams.get('updated_since');
    const q = searchParams.get('q');
    const limit = parseLimit(searchParams.get('limit'));
    const cursor = decodeCursor(searchParams.get('cursor'));

    if (status && !VALID_STATUSES.includes(status)) {
      return NexusErrors.badRequest(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`);
    }

    let query = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (assignee) query = query.eq('assignee', assignee);
    if (updatedSince) query = query.gte('updated_at', updatedSince);
    if (cursor) query = query.lt('created_at', cursor);
    if (q) {
      // Search subject or the requester's email — the two fields a support
      // person would realistically search tickets by.
      query = query.or(`subject.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data: tickets, error } = await query;
    if (error) {
      console.error('🚨 Nexus GET /tickets error:', error.message);
      return NexusErrors.serverError();
    }

    const rows = tickets ?? [];
    const ticketIds = rows.map((t) => t.id);

    // Pull just the newest message per ticket for last_message_preview,
    // rather than N+1 queries per ticket.
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
    const nextCursor = rows.length === limit ? encodeCursor(rows[rows.length - 1].created_at) : undefined;

    return NextResponse.json({ items, next_cursor: nextCursor });
  });
}
