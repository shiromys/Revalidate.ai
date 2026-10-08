import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// How many times, and how far apart, to re-check for the webhook's credit before
// giving up and just reporting what Stripe itself confirms was charged.
const CREDIT_POLL_ATTEMPTS = 5;
const CREDIT_POLL_DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  // 1. Identify who is asking. We never trust a session_id alone — it must also
  // belong to the person making this request.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2. Pull the real Checkout Session straight from Stripe. This, not the URL the
  // browser was redirected with, is the authoritative record of what was actually
  // charged — the same object the webhook itself trusts.
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('Checkout session lookup failed:', err);
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const ownsSession =
    session.client_reference_id === user.id || session.metadata?.userId === user.id;
  if (!ownsSession) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const paid = session.payment_status === 'paid';
  const credits = parseInt(session.metadata?.credits || '0', 10);
  const amountPaidUsd = (session.amount_total || 0) / 100;

  // 3. The wallet credit itself happens asynchronously in the Stripe webhook, so give
  // it a brief window to land, then report the user's real, current wallet balance —
  // not a guess — so "credited" on screen means it actually happened in the database.
  let credited = false;
  let walletCredits: number | null = null;

  if (paid) {
    for (let attempt = 0; attempt < CREDIT_POLL_ATTEMPTS; attempt++) {
      const { data: txn } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('stripe_session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (txn) {
        credited = true;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('wallet_credits')
          .eq('id', user.id)
          .single();
        walletCredits = profile?.wallet_credits ?? null;
        break;
      }

      if (attempt < CREDIT_POLL_ATTEMPTS - 1) {
        await sleep(CREDIT_POLL_DELAY_MS);
      }
    }
  }

  return NextResponse.json({
    paid,
    credits,
    amountPaidUsd,
    credited,
    walletCredits,
  });
}