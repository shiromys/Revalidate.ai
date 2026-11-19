import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withNexusAuth } from '@/lib/nexus/auth';
import { withIdempotency } from '@/lib/nexus/idempotency';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { toNexusMessage, toNexusTicket } from '@/lib/nexus/mappers';
import { sendNexusWebhook } from '@/lib/nexus/webhooks';

export const dynamic = 'force-dynamic';

/**
 * GET /api/support/v1/tickets/{id}
 * "One ticket with its full message thread" (spec section 3).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withNexusAuth(req, 'tickets:read', async () => {
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (ticketError) {
      console.error('🚨 Nexus GET /tickets/:id error:', ticketError.message);
      return NexusErrors.serverError();
    }
    if (!ticket) return NexusErrors.notFound('Ticket not found.');

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('🚨 Nexus GET /tickets/:id messages error:', messagesError.message);
      return NexusErrors.serverError();
    }

    const thread = messages ?? [];
    const lastMessage = thread[thread.length - 1];

    return NextResponse.json({
      ...toNexusTicket(ticket, lastMessage?.body_text ?? ticket.message ?? ''),
      messages: thread.map(toNexusMessage),
    });
  });
}

const patchSchema = z.object({
  status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignee: z.string().nullable().optional(),
});

/**
 * PATCH /api/support/v1/tickets/{id}
 * "Change status, priority or assignee" (spec section 3).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withNexusAuth(req, 'tickets:write', async () => {
    return withIdempotency(req, `tickets/${params.id}/patch`, async () => {
      const body = await req.json().catch(() => null);
      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return NexusErrors.badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
      }
      if (Object.keys(parsed.data).length === 0) {
        return NexusErrors.badRequest('At least one of status, priority, assignee is required.');
      }

      const { data: updated, error } = await supabaseAdmin
        .from('support_tickets')
        .update(parsed.data)
        .eq('id', params.id)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('🚨 Nexus PATCH /tickets/:id error:', error.message);
        return NexusErrors.serverError();
      }
      if (!updated) return NexusErrors.notFound('Ticket not found.');

      await sendNexusWebhook('ticket.updated', updated.id);

      return NextResponse.json(toNexusTicket(updated, updated.message ?? ''));
    });
  });
}
