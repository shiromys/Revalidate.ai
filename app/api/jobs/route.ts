import { Redis } from '@upstash/redis';
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Aggressive Cache-Busting Configs
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// We only need Supabase for the POST route (creating the initial record)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
  process.env.SUPABASE_SERVICE_ROLE_KEY as string 
);

// =======================================================================
// POST: CREATES JOB RECORD (Unchanged)
// =======================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body || !body.userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const jobId = crypto.randomUUID(); 

    const { error: dbError } = await supabase
      .from('jobs') 
      .insert([
        { 
          id: jobId, 
          user_id: body.userId, 
          file_name: body.fileName || 'manual_upload.pdf',
          status: 'PENDING', 
          email_count: 0,
          progress_percentage: 0
        }
      ]);

    if (dbError) {
      console.error("❌ Supabase Insert Error:", dbError.message);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    await redis.lpush('tasks', JSON.stringify({ 
      jobId: jobId, 
      user: body.userId 
    }));

    return NextResponse.json({ success: true, jobId });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// =======================================================================
// GET: PROGRESS CHECKER (STRICTLY READS UPSTASH QUEUES ONLY)
// =======================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    // 1. Get Completed Count directly from Upstash — a single LLEN against the
    // list /api/cron/process-bulk actually appends to (results:{jobId}).
    const completedCount = await redis.llen(`results:${jobId}`);

    // 2. Get Pending Count from the O(1) counter set at enqueue time
    // (job:{jobId}:pending, decremented once per processed email).
    // FIX: this used to be `LLEN job:{jobId}` — a list nothing ever wrote to,
    // which always read back 0 and, combined with a full LRANGE('tasks', 0, -1)
    // scan on every single poll "to be sure," meant a job could never be
    // detected as complete. That's what kept the 3-second client poll loop
    // running forever for any open bulk-validation tab. No more full-list scan
    // needed: the counter alone is authoritative.
    const pendingRaw = await redis.get(`job:${jobId}:pending`);
    const pendingCount = pendingRaw !== null ? Number(pendingRaw) : null;

    // 3. Calculate Progress completely independent of Supabase
    const total = completedCount + Math.max(pendingCount ?? 0, 0);
    let progress = 0;
    let isComplete = false;

    if (total > 0) {
      progress = Math.floor((completedCount / total) * 100);
    }

    // ====================================================================
    // THE ULTIMATE GATE:
    // The download button ONLY unlocks once the pending counter hits 0.
    // If the counter key has expired/vanished (pendingCount === null) we
    // can't confirm completion from Redis alone, so we deliberately do NOT
    // report "complete" — the client-side safety cutoff (see bulk/page.tsx)
    // is what stops polling in that edge case, not this endpoint.
    // ====================================================================
    if (pendingCount !== null && pendingCount <= 0 && completedCount > 0) {
      progress = 100;
      isComplete = true;
    } else {
      isComplete = false;
      if (progress >= 100) {
        progress = 99;
      }
    }

    // 5. Force strict cache-busting headers so Next.js never serves stale data
    return NextResponse.json({
      status: isComplete ? 'completed' : 'processing',
      progress: progress,
      completed: completedCount,
      total: total > 0 ? total : 0
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error("🚨 STATUS API ERROR:", error);
    return NextResponse.json({ error: 'Internal server error calculating progress' }, { status: 500 });
  }
}