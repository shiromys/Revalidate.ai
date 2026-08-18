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

    // 1. Get Completed Count directly from Upstash
    let completedCount = await redis.llen(`results:${jobId}`);
    if (completedCount === 0) {
      completedCount = await redis.llen(`job:${jobId}:results`);
    }

    // 2. Get Pending Count strictly from the dedicated Upstash job list
    const pendingCount = await redis.llen(`job:${jobId}`);
    
    // 3. Double-check the main 'tasks' list to ensure the job isn't still waiting to start
    const activeTasks = await redis.lrange('tasks', 0, -1);
    let isWaitingInMainQueue = false;
    
    if (activeTasks && activeTasks.length > 0) {
      for (const task of activeTasks) {
        const taskString = typeof task === 'string' ? task : JSON.stringify(task);
        if (taskString.includes(jobId)) {
          isWaitingInMainQueue = true;
          break;
        }
      }
    }

    // 4. Calculate Progress completely independent of Supabase
    const total = completedCount + pendingCount;
    let progress = 0;
    let isComplete = false;

    if (total > 0) {
      progress = Math.floor((completedCount / total) * 100);
    }

    // ====================================================================
    // THE ULTIMATE GATE: 
    // The download button ONLY unlocks if Upstash confirms 0 pending items.
    // ====================================================================
    if (pendingCount === 0 && !isWaitingInMainQueue && completedCount > 0) {
      progress = 100;
      isComplete = true;
    } else {
      // If there is ANY pending task left in Upstash, force hold at 99%
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