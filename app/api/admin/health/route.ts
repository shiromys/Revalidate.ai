import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthResults = {
    supabase: {
      status: 'DOWN' as 'OPERATIONAL' | 'DEGRADED' | 'DOWN',
      latencyMs: 0,
      error: null as string | null,
    },
    stripe: {
      status: 'DOWN' as 'OPERATIONAL' | 'DEGRADED' | 'DOWN',
      latencyMs: 0,
      error: null as string | null,
    },
    checkedAt: new Date().toISOString(),
  };

  // --- 1. LIVE SUPABASE DB PING ---
  const dbStart = Date.now();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase environment keys missing');
    }

    const adminSupabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await adminSupabase.from('profiles').select('id').limit(1);

    healthResults.supabase.latencyMs = Date.now() - dbStart;

    if (error) {
      healthResults.supabase.status = 'DEGRADED';
      healthResults.supabase.error = error.message;
    } else {
      healthResults.supabase.status =
        healthResults.supabase.latencyMs > 1500 ? 'DEGRADED' : 'OPERATIONAL';
    }
  } catch (err: unknown) {
    healthResults.supabase.latencyMs = Date.now() - dbStart;
    healthResults.supabase.status = 'DOWN';
    healthResults.supabase.error = err instanceof Error ? err.message : 'Database check failed';
  }

  // --- 2. LIVE STRIPE API PING ---
  const stripeStart = Date.now();
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeKey, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: '2023-10-16' as any,
    });

    await stripe.prices.list({ limit: 1 });

    healthResults.stripe.latencyMs = Date.now() - stripeStart;
    healthResults.stripe.status =
      healthResults.stripe.latencyMs > 1500 ? 'DEGRADED' : 'OPERATIONAL';
  } catch (err: unknown) {
    healthResults.stripe.latencyMs = Date.now() - stripeStart;
    healthResults.stripe.status = 'DOWN';
    healthResults.stripe.error = err instanceof Error ? err.message : 'Stripe check failed';
  }

  return NextResponse.json(healthResults, { status: 200 });
}