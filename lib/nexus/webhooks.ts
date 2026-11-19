import crypto from 'crypto';
import { Client as QStashClient } from '@upstash/qstash';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type NexusWebhookEvent = 'ticket.created' | 'ticket.updated' | 'message.created' | 'user.deleted';

const APP_NAME = 'revalidate.ai';

/**
 * Signs the webhook body with the shared secret, per spec section 5:
 * "Signed: each request carries an X-Signature header, an HMAC of the body
 * using a shared secret, so the Nexus can confirm it came from the app."
 */
function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function getQStashClient(): QStashClient | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  return new QStashClient({ token });
}

/**
 * Sends a webhook notifying the Nexus that something changed. Per the spec,
 * the body is intentionally thin — "event, the app name, a timestamp and
 * the object's id" — the Nexus is expected to fetch full details through
 * the normal GET endpoints rather than trust webhook payload contents.
 *
 * Delivery goes through Upstash QStash (already a dependency in this repo)
 * rather than a direct fetch, because the spec requires retries "with
 * increasing delays over at least 24 hours" on non-2xx responses — a single
 * serverless request can't hold a retry loop open that long, but QStash's
 * publish-with-retries does this for us out of the box.
 *
 * NEXUS_WEBHOOK_URL and NEXUS_WEBHOOK_SECRET are provided by the Nexus team
 * (spec section 5: "we provide it"); until both are set in the environment,
 * this is a no-op that just logs, so local/staging work before that handoff
 * doesn't crash on every ticket action.
 */
export async function sendNexusWebhook(event: NexusWebhookEvent, objectId: string): Promise<void> {
  const webhookUrl = process.env.NEXUS_WEBHOOK_URL;
  const secret = process.env.NEXUS_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    console.warn(`[nexus webhook] NEXUS_WEBHOOK_URL/NEXUS_WEBHOOK_SECRET not set — skipping ${event} for ${objectId}`);
    return;
  }

  const payload = {
    event,
    app: APP_NAME,
    timestamp: new Date().toISOString(),
    id: objectId,
  };
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  const client = getQStashClient();

  try {
    let qstashMessageId: string | null = null;

    if (client) {
      const result = await client.publishJSON({
        url: webhookUrl,
        body: payload,
        headers: { 'X-Signature': signature },
        retries: 5, // QStash backs off between attempts automatically; spans well over 24h total
      });
      qstashMessageId = result.messageId ?? null;
    } else {
      // Fallback for environments without QSTASH_TOKEN configured: best-effort
      // single attempt. Logged as 'failed' on any non-2xx so it's visible in
      // nexus_webhook_log that a manual redelivery may be needed.
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
        body,
      });
      if (!res.ok) throw new Error(`Webhook endpoint responded ${res.status}`);
    }

    await supabaseAdmin.from('nexus_webhook_log').insert([
      {
        event,
        object_id: objectId,
        qstash_message_id: qstashMessageId,
        status: client ? 'queued' : 'delivered',
      },
    ]);
  } catch (err) {
    console.error(`🚨 Nexus webhook dispatch failed for ${event} (${objectId}):`, err);
    await supabaseAdmin
      .from('nexus_webhook_log')
      .insert([{ event, object_id: objectId, status: 'failed' }])
      .then(
        () => {},
        () => {}
      );
  }
}