import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import Stripe from 'stripe';
 
export const dynamic = 'force-dynamic';
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  apiVersion: '2023-10-16' as any,

});
 
export async function POST(req: Request) {

  // Stripe's signature is computed over the EXACT raw request body, so we

  // must read it as raw text (not JSON.parse it first) before verifying.

  const rawBody = await req.text();

  const signature = req.headers.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
 
  if (!signature) {

    console.error('Webhook rejected: request had no stripe-signature header');

    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });

  }
 
  if (!webhookSecret) {

    console.error('Webhook rejected: STRIPE_WEBHOOK_SECRET is not configured');

    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });

  }
 
  // --- REAL Stripe signature verification (replaces the old broken custom check) ---

  let event: Stripe.Event;

  try {

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  } catch (err) {

    const message = err instanceof Error ? err.message : 'Unknown verification error';

    console.error('Webhook signature verification failed:', message);

    return NextResponse.json(

      { error: `Webhook signature verification failed: ${message}` },

      { status: 400 }

    );

  }

  // If we reach this line, Stripe has cryptographically proven this request

  // is genuine. Everything below only ever runs for verified events.
 
  try {

    if (event.type !== 'checkout.session.completed') {

      // Acknowledge any other event type so Stripe doesn't keep retrying it,

      // but we only act on completed checkouts.

      return NextResponse.json({ received: true, ignored: event.type }, { status: 200 });

    }
 
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;

    const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);

    const sessionId = session.id;

    // Stripe sends amounts in cents (e.g., 500 cents = $5.00). We divide by 100.

    const amountPaidUsd = (session.amount_total || 0) / 100;
 
    if (!userId) {

      console.error('Webhook payload missing userId metadata', { sessionId });

      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    }
 
    // Bypassing RLS with Service Role Key

    const supabase = createClient(

      process.env.NEXT_PUBLIC_SUPABASE_URL!,

      process.env.SUPABASE_SERVICE_ROLE_KEY!

    );
 
    // --- 1. FETCH CURRENT BALANCE AND EMAIL ---

    const { data: profile, error: fetchError } = await supabase

      .from('profiles')

      .select('wallet_credits, email')

      .eq('id', userId)

      .single();
 
    if (fetchError) throw fetchError;
 
    const newTotalBalance = (profile?.wallet_credits || 0) + creditsToAdd;

    const userEmail = profile?.email || '';
 
    // --- 2. UPDATE USER CREDITS ---

    const { error: updateError } = await supabase

      .from('profiles')

      .update({ wallet_credits: newTotalBalance })

      .eq('id', userId);
 
    if (updateError) throw updateError;
 
    // --- 3. LOG THE TRANSACTION WITH EMAIL AND AMOUNT ---

    const { error: transactionError } = await supabase

      .from('transactions')

      .insert([

        {

          user_id: userId,

          email_id: userEmail,

          amount_usd: amountPaidUsd,

          credits_added: creditsToAdd,

          stripe_session_id: sessionId,

        },

      ]);
 
    if (transactionError) {

      console.error('Failed to insert transaction log:', transactionError.message);

    }
 
    return NextResponse.json({ success: true, updatedBalance: newTotalBalance }, { status: 200 });

  } catch (err) {

    console.error('Webhook processing error:', err);

    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });

  }

}
 