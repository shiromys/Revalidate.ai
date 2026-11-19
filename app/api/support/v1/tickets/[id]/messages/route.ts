import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { withNexusAuth } from '@/lib/nexus/auth';
import { withIdempotency } from '@/lib/nexus/idempotency';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';
import { toNexusMessage } from '@/lib/nexus/mappers';
import { sendNexusWebhook } from '@/lib/nexus/webhooks';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

const bodySchema = z.object({
  type: z.enum(['reply', 'note']),
  body_text: z.string().min(1, 'body_text is required'),
  body_html: z.string().nullable().optional(),
});

/**
 * POST /api/support/v1/tickets/{id}/messages
 * "Send a reply to the user, or add an internal note (type: reply or note)"
 * (spec section 3). A 'reply' goes out by email through this app's own
 * sender (info@revalidate.ai via Resend) so the sender address and thread
 * stay correct, per spec section 8 option 1. A 'note' is stored only —
 * never shown to the end user, per the Message shape in section 4.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withNexusAuth(req, 'messages:write', async (ctx) => {
    return withIdempotency(req, `tickets/${params.id}/messages`, async () => {
      const body = await req.json().catch(() => null);
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return NexusErrors.badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
      }
      const { type, body_text, body_html } = parsed.data;

      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (ticketError) {
        console.error('🚨 Nexus POST messages: ticket lookup error:', ticketError.message);
        return NexusErrors.serverError();
      }
      if (!ticket) return NexusErrors.notFound('Ticket not found.');

      if (type === 'reply') {
        const { error: emailError } = await resend.emails.send({
          from: 'Revalidate Support <info@revalidate.ai>',
          replyTo: 'info@revalidate.ai',
          to: ticket.email,
          subject: `Re: ${ticket.subject}`,
          text: body_text,
          ...(body_html ? { html: body_html } : {}),
        });
        if (emailError) {
          console.error('🚨 Nexus POST messages: email send failed:', emailError.message);
          return NexusErrors.serverError('Failed to send reply email.');
        }
      }

      const author = ctx.agent ? `nexus:${ctx.agent}` : 'nexus';
      const { data: message, error: insertError } = await supabaseAdmin
        .from('support_messages')
        .insert([
          {
            ticket_id: ticket.id,
            type,
            author,
            body_text,
            body_html: body_html ?? null,
          },
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('🚨 Nexus POST messages: insert error:', insertError.message);
        return NexusErrors.serverError();
      }

      // Touch updated_at (trigger does this on `update`, not `insert`) so
      // updated_since catch-up picks up tickets that only got a new message.
      await supabaseAdmin.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticket.id);

      await sendNexusWebhook('message.created', message.id);

      return NextResponse.json(toNexusMessage(message), { status: 201 });
    });
  });
}