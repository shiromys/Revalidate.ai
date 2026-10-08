import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { addWalletCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// STRIPE_WEBHOOK_SECRET may hold one secret, or several separated by commas
// (e.g. "whsec_live...,whsec_test...").
function getWebhookSecrets(): string[] {
  return (process.env.STRIPE_WEBHOOK_SECRET || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
}

export async function POST(req: Request) {
  const rawBody = await req.text();           // Stripe signs the exact raw body
  const signature = req.headers.get('stripe-signature');
  const secrets = getWebhookSecrets();

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  if (secrets.length === 0) {
    console.error('Webhook rejected: STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  let event: Stripe.Event | null = null;
  let lastError = 'Unknown verification error';
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
    }
  }
  if (!event) {
    console.error('Webhook signature verification failed:', lastError);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, ignored: event.type }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, ignored: 'not_paid' }, { status: 200 });
  }

  const userId = session.metadata?.userId;
  const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
  const sessionId = session.id;
  const amountPaidUsd = (session.amount_total || 0) / 100;

  if (!userId || !Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
    return NextResponse.json({ error: 'Missing userId or credits' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles').select('email').eq('id', userId).maybeSingle();
    if (fetchError) throw fetchError;
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Claim this Stripe session first. The unique index makes a repeat delivery fail with 23505.
    const { error: claimError } = await supabase.from('transactions').insert([{
      user_id: userId,
      email_id: profile.email || '',
      amount_usd: amountPaidUsd,
      credits_added: creditsToAdd,
      stripe_session_id: sessionId,
    }]);
    if (claimError) {
      if (claimError.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }
      throw claimError;
    }

    // Credit atomically. If it fails, release the claim so Stripe's retry can try again.
    try {
      const newBalance = await addWalletCredits(userId, creditsToAdd);
      if (newBalance === null) throw new Error('profile not found while crediting');
      return NextResponse.json({ success: true, updatedBalance: newBalance }, { status: 200 });
    } catch (creditError) {
      await supabase.from('transactions').delete().eq('stripe_session_id', sessionId);
      throw creditError;
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}