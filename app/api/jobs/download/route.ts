import { Redis } from '@upstash/redis';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Explicit structure matching the data format saved by the email background worker
// (see processEmail()'s return shape in app/api/cron/process-bulk/route.ts)
interface ValidationResult {
  email?: string;
  address?: string;
  status?: string;
  reason?: string;
  isValid?: boolean;
  valid?: boolean;
  isCatchAll?: boolean;
  // FIX: the process that actually writes results in production emits THESE
  // snake_case fields, not isValid/valid/isCatchAll above — confirmed by
  // inspecting live data in Redis. Reading only isValid/valid meant
  // "Syntax Check" showed FALSE for every single row, since that field
  // never existed on a real record; it just silently fell through to false.
  syntax_valid?: boolean;
  mx_valid?: boolean;
  not_disposable?: boolean;
  not_role_based?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return new NextResponse('Missing jobId', { status: 400 });
    }

    // 1. GATING GUARD: Verify if the job is still actively running in Upstash Tasks list
    // Each queued task is a JSON string like {"jobId":"...","email":"...","mode":"..."},
    // so we need to check whether jobId appears WITHIN each entry, not an exact match.
    const activeTasks = await redis.lrange('tasks', 0, -1);
    const isStillPending = activeTasks.some(task => {
      const taskString = typeof task === 'string' ? task : JSON.stringify(task);
      return taskString.includes(jobId);
    });

    if (isStillPending) {
      return new NextResponse(
        `Validation is still processing in the background. Please wait until the task completes...`, 
        { status: 202, headers: { 'Retry-After': '5' } }
      );
    }

    // 2. Fetch results from Upstash Redis using both potential naming variants
    let redisKey = `results:${jobId}`;
    let results = await redis.lrange(redisKey, 0, -1);
    
    if (!results || results.length === 0) {
      redisKey = `job:${jobId}:results`;
      results = await redis.lrange(redisKey, 0, -1);
    }
    
    if (!results || results.length === 0) {
      return new NextResponse('Results are no longer available (Data might have expired after 24 hours).', { status: 404 });
    }

    // 3. Setup clean layout CSV Headers
    let csvContent = "Email,Final Result,Syntax Check,MX DNS Records,Not Disposable,Not Role-Based,Accuracy\n";
    
    // 4. Safely compile records into standard RFC-compliant CSV rows
    for (const item of results) {
      let data: ValidationResult | null = null;
      try {
        data = typeof item === 'string' ? JSON.parse(item) : item;
      } catch {
        continue; // Skip structural anomalies
      }

      if (!data) continue;
      
      const email = data.email || data.address || '';
      const isRecordValid = data.isValid === true || data.valid === true || data.syntax_valid === true;
      const finalResult = data.status || data.reason || (isRecordValid ? 'Deliverable' : 'Undeliverable');

      // FIX: prefer the real boolean fields the production writer actually
      // emits (syntax_valid/mx_valid/not_disposable/not_role_based) over
      // guessing from the finalResult string. Only fall back to the old
      // string-matching heuristics when those fields are genuinely absent,
      // so this stays compatible with any other producer of this data.
      const syntax = data.syntax_valid !== undefined
        ? (data.syntax_valid ? 'TRUE' : 'FALSE')
        : (isRecordValid ? 'TRUE' : 'FALSE');
      const mx = data.mx_valid !== undefined
        ? (data.mx_valid ? 'TRUE' : 'FALSE')
        : ((finalResult !== 'Undeliverable' && !finalResult.includes('599')) ? 'TRUE' : 'FALSE');
      const notDisposable = data.not_disposable !== undefined
        ? (data.not_disposable ? 'TRUE' : 'FALSE')
        : (!finalResult.includes('Temporary Email') ? 'TRUE' : 'FALSE');
      const notRole = data.not_role_based !== undefined
        ? (data.not_role_based ? 'TRUE' : 'FALSE')
        : 'TRUE'; // Baseline layout filler when the field is absent
      
      // FIX: this used to be a static lookup keyed off the status string
      // (Deliverable -> flat 99%, Risky -> flat 50%, else 0%) — not derived
      // from the actual record at all, so every "Deliverable" row showed
      // the identical 99% regardless of its real checks. Compute it live
      // from this row's own syntax/mx/notDisposable/notRole results
      // instead, using the same weighting lib/email-validator.ts already
      // uses for single-email checks (syntax 20, mx 60, not-disposable 10,
      // not-role-based 10 — max 100).
      let accuracyScore = 0;
      if (syntax === 'TRUE') accuracyScore += 20;
      if (mx === 'TRUE') accuracyScore += 60;
      if (notDisposable === 'TRUE') accuracyScore += 10;
      if (notRole === 'TRUE') accuracyScore += 10;
      const accuracy = `${accuracyScore}%`;

      // Escape quotes cleanly inside spreadsheet data properties
      const cleanEmail = email.replace(/"/g, '""');
      const cleanResult = finalResult.replace(/"/g, '""');

      csvContent += `"${cleanEmail}","${cleanResult}",${syntax},${mx},${notDisposable},${notRole},"${accuracy}"\n`;
    }

    // 5. Instantly trigger file download stream attachment on client side
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="validation_report_${jobId.slice(0, 6)}.csv"`,
        'Cache-Control': 'no-store, max-age=0'
      },
    });
  } catch (error) {
    console.error("🚨 DOWNLOAD API SYSTEM FAULT:", error);
    return new NextResponse('Internal server formatting error during CSV generation.', { status: 500 });
  }
}