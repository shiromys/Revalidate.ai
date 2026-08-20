import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import WS from 'ws'; 

if (typeof globalThis.WebSocket === 'undefined') {
  Object.assign(globalThis, { WebSocket: WS });
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  try {
    const { userId, emails, mode, fileName } = await req.json();
    const jobId = crypto.randomUUID();

    if (!userId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Missing required properties" }, { status: 400 });
    }

    // 1. BILLING & CREDIT CHECK
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_credits, monthly_basic_used')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    const walletCredits = profile?.wallet_credits ?? 0;
    const basicUsed = profile?.monthly_basic_used ?? 0;
    const freeLimit = 100;

    let newBasicUsed = basicUsed;
    let newWalletCredits = walletCredits;
    
    let emailsToProcess: string[] = emails;
    let remainingEmails: string[] = [];

    // --- ENFORCED MODE BALANCE HANDLING ---
    if (mode === 'basic') {
      const remainingFree = Math.max(0, freeLimit - basicUsed);
      
      if (remainingFree <= 0) {
        return NextResponse.json(
          { error: "Monthly Basic Limit Reached. Please use Full Deep AI mode.", status: "LIMIT_REACHED" }, 
          { status: 403 }
        );
      }

      if (emails.length > remainingFree) {
        emailsToProcess = emails.slice(0, remainingFree);
        remainingEmails = emails.slice(remainingFree);
      }
      
      // Update basic usage counter
      newBasicUsed += emailsToProcess.length;

    } else {
      // Full Deep AI Mode handles Wallet Credits deduction
      if (walletCredits <= 0) {
        return NextResponse.json(
          { error: "Not enough Wallet Credits. Please add funds.", status: "NO_FUNDS" }, 
          { status: 403 }
        );
      }

      if (emails.length > walletCredits) {
        emailsToProcess = emails.slice(0, walletCredits);
        remainingEmails = emails.slice(walletCredits);
      }
      
      // Deduct from wallet balance
      newWalletCredits -= emailsToProcess.length;
    }

    const totalEmailsToProcess = emailsToProcess.length;

    // 2. UPDATE USER PROFILE CREDITS
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        monthly_basic_used: newBasicUsed,
        wallet_credits: newWalletCredits
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 3. LOG ACTIVE JOB STATE
    const actualFileName = remainingEmails.length > 0 
      ? `(Part 1) ${fileName || 'bulk_upload.csv'}` 
      : (fileName || 'bulk_upload.csv');

    // 🔴 FIX: Added the 'mode' column insertion here so the dashboard can track it
    const { error: jobError } = await supabase.from('jobs').insert([
      {
        id: jobId,
        user_id: userId,
        file_name: actualFileName,
        status: 'PROCESSING',
        email_count: totalEmailsToProcess,
        progress_percentage: 0,
        mode: mode === 'full' ? 'full' : 'basic' 
      }
    ]);

    if (jobError) throw jobError;

    // 4. PREPARE & STREAM TASKS TO REDIS
    const tasks = emailsToProcess.map((email: string) => JSON.stringify({
      jobId,
      email,
      mode: mode === 'full' ? 'advanced' : 'basic'
    }));

    await redis.lpush('tasks', ...tasks);

    // 5. INITIALIZE THE PENDING COUNTER (single O(1) key /api/jobs/status reads
    // instead of scanning the whole 'tasks' list on every poll). TTL matches the
    // 24h result-retention window used elsewhere.
    await redis.set(`job:${jobId}:pending`, totalEmailsToProcess, { ex: 90000 });

    return NextResponse.json({ 
      success: true, 
      jobId, 
      partial: remainingEmails.length > 0,
      remainingEmails
    });
    
  } catch (err) { 
    console.error("🚨 BULK JOBS CONTROLLER BREAKDOWN:", err); 
    const msg = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}