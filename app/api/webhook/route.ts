import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature') || req.headers.get('x-webhook-signature'); 
    const secret = process.env.WEBHOOK_SECRET;
    const rawBody = await req.text();

    // Security Verification
    if (secret && signature && req.headers.get('x-webhook-signature')) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(rawBody).digest('hex');

      if (digest !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Bypassing RLS with Service Role Key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    let userId = payload.user_id;
    let creditsToAdd = payload.updated_credits;
    let sessionId = '';
    let amountPaidUsd = 0; // NEW: Variable to hold the amount paid

    // Extract data from Stripe payload
    if (payload.type === 'checkout.session.completed') {
      const session = payload.data.object;
      userId = session.metadata?.userId;
      creditsToAdd = parseInt(session.metadata?.credits || '0');
      sessionId = session.id;
      
      // NEW: Stripe sends amounts in cents (e.g., 500 cents = $5.00). We divide by 100.
      amountPaidUsd = (session.amount_total || 0) / 100;
    }

    if (!userId) {
      console.error("Webhook payload missing userId metadata");
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // --- 1. FETCH CURRENT BALANCE AND EMAIL ---
    // We select both the wallet_credits AND the email from their profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('wallet_credits, email')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newTotalBalance = (profile?.wallet_credits || 0) + creditsToAdd;
    const userEmail = profile?.email || ''; // Grab the email we just fetched

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
          amount_usd: amountPaidUsd,     // <--- NEW: Amount successfully added here!
          credits_added: creditsToAdd,  
          stripe_session_id: sessionId
          // Note: I removed the 'status: completed' line here because your screenshot 
          // did not show a status column. This prevents a database error!
        }
      ]);

    if (transactionError) {
      console.error("Failed to insert transaction log:", transactionError.message);
    }

    return NextResponse.json({ success: true, updatedBalance: newTotalBalance }, { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}