/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import { Resolver } from 'dns/promises';

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const dnsResolver = new Resolver();
const DNS_SERVERS = process.env.DNS_SERVERS
  ? process.env.DNS_SERVERS.split(',').map(s => s.trim())
  : ['1.1.1.1', '8.8.8.8'];
dnsResolver.setServers(DNS_SERVERS);

const CONFIG = {
  BATCH_SIZE: parseInt(process.env.BULK_PROCESSING_BATCH_SIZE || '5'),
  BACKEND_URL: process.env.REVALIDATE_BACKEND_URL || 'http://5.78.65.28:3000',
  BACKEND_TIMEOUT: parseInt(process.env.BACKEND_TIMEOUT || '45000'),
  LOG_RESPONSES: process.env.LOG_BACKEND_RESPONSES === 'true',
  CRON_SECRET: process.env.CRON_SECRET,
  FREE_TIER_LIMIT: parseInt(process.env.FREE_TIER_LIMIT || '100'),
};

const DISPOSABLE_DOMAINS = new Set(
  (process.env.DISPOSABLE_DOMAINS
    ? process.env.DISPOSABLE_DOMAINS.split(',').map(d => d.trim().toLowerCase())
    : [
      'mailinator.com',
      '10minutemail.com',
      'guerrillamail.com',
      'yopmail.com',
      'tempmail.com',
      'burnermail.io',
    ]
  ).filter(d => d.length > 0)
);

const ROLE_PREFIXES = new Set(
  (process.env.ROLE_EMAIL_PREFIXES
    ? process.env.ROLE_EMAIL_PREFIXES.split(',').map(r => r.trim().toLowerCase())
    : [
      'admin',
      'support',
      'info',
      'sales',
      'contact',
      'jobs',
      'marketing',
      'billing',
      'help',
      'team',
      'office',
      'noreply',
      'no-reply',
    ]
  ).filter(r => r.length > 0)
);

interface EmailTask {
  jobId: string;
  email: string;
  mode?: 'basic' | 'advanced';
}

async function checkMXRecords(domain: string): Promise<boolean> {
  try {
    const addresses = await dnsResolver.resolveMx(domain);
    return Boolean(addresses && addresses.length > 0);
  } catch {
    try {
      const aAddresses = await dnsResolver.resolve4(domain);
      return Boolean(aAddresses && aAddresses.length > 0);
    } catch {
      return false;
    }
  }
}

function validateSyntax(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

async function processEmail(
  jobId: string,
  email: string,
  mode: 'basic' | 'advanced'
): Promise<{
  email: string;
  isValid: boolean;
  isCatchAll: boolean;
  validationCertainty: number;
  reason: string;
}> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const [, domain] = normalizedEmail.split('@');

    const isSyntaxValid = validateSyntax(normalizedEmail);
    if (!isSyntaxValid || !domain) {
      return {
        email: normalizedEmail,
        isValid: false,
        isCatchAll: false,
        validationCertainty: 0.05,
        reason: 'Invalid Syntax',
      };
    }

    if (isDisposableDomain(domain)) {
      return {
        email: normalizedEmail,
        isValid: false,
        isCatchAll: false,
        validationCertainty: 0.1,
        reason: 'Disposable Domain',
      };
    }

    if (mode === 'basic') {
      const isMxValid = await checkMXRecords(domain);
      return {
        email: normalizedEmail,
        isValid: isSyntaxValid && isMxValid,
        isCatchAll: false,
        validationCertainty: isMxValid ? 0.7 : 0.05,
        reason: isMxValid ? 'Valid Email Address' : 'No MX Records',
      };
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
        signal: AbortSignal.timeout(CONFIG.BACKEND_TIMEOUT),
      });

      if (!response.ok) {
        console.warn(`Backend error for ${normalizedEmail}:`, response.status);
        return {
          email: normalizedEmail,
          isValid: false,
          isCatchAll: false,
          validationCertainty: 0.3,
          reason: 'Backend Error',
        };
      }

      const report = await response.json();

      const isValid = report.valid === true || report.isValid === true;
      const isCatchAll =
        report.catchAll === true ||
        report.isCatchAll === true ||
        report.catch_all === true;
      const certainty = report.validationCertainty || 0.5;

      const finalValid = isValid && !isCatchAll && certainty >= 0.7;

      return {
        email: normalizedEmail,
        isValid: finalValid,
        isCatchAll,
        validationCertainty: certainty,
        reason: report.reason || (isValid ? 'Deliverable' : 'Invalid'),
      };
    } catch (error) {
      console.error(`Backend error for ${normalizedEmail}:`, error);
      return {
        email: normalizedEmail,
        isValid: false,
        isCatchAll: false,
        validationCertainty: 0.3,
        reason: 'Validation Error',
      };
    }
  } catch (error) {
    console.error(`Error processing email ${email}:`, error);
    return {
      email,
      isValid: false,
      isCatchAll: false,
      validationCertainty: 0.0,
      reason: 'Processing Error',
    };
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = CONFIG.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRITICAL: CRON_SECRET environment variable is missing.');
      return NextResponse.json(
        { error: 'Server authentication misconfiguration' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron execution attempt');
      return NextResponse.json(
        { error: 'Unauthorized execution' },
        { status: 401 }
      );
    }

    if (!CONFIG.BACKEND_URL) {
      console.error('CRITICAL: REVALIDATE_BACKEND_URL is missing.');
      return NextResponse.json(
        { error: 'Backend configuration error' },
        { status: 500 }
      );
    }

    console.log('📌 Starting bulk email validation cron job');

    // FIX: this used to read 'validation_queue', a key nothing ever wrote to —
    // /api/jobs/bulk enqueues onto 'tasks'. That mismatch meant this cron job
    // always saw an empty queue and never actually processed a real upload.
    const jobQueue = await redis.lrange('tasks', 0, CONFIG.BATCH_SIZE - 1);

    if (!jobQueue || jobQueue.length === 0) {
      console.log('✅ No pending jobs');
      return NextResponse.json({
        success: true,
        message: 'No pending jobs',
        processed: 0,
      });
    }

    console.log(`📋 Processing ${jobQueue.length} jobs`);

    let successCount = 0;
    let failureCount = 0;

    for (const jobData of jobQueue) {
      try {
        const task: EmailTask = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;

        const mode = task.mode === 'basic' ? 'basic' : 'advanced';
        const result = await processEmail(task.jobId, task.email, mode);

        // FIX: append to the per-job results LIST that /api/jobs/status,
        // /api/jobs/download and /api/bulk-download actually read
        // (previously this overwrote a single string key, 'validation_result:{jobId}',
        // that nothing downstream ever looked at, and never accumulated more than
        // one email's result per job).
        const resultsKey = `results:${task.jobId}`;
        await redis.rpush(resultsKey, JSON.stringify(result));
        await redis.expire(resultsKey, 86400);

        // FIX: decrement the pending counter set at enqueue time, so
        // /api/jobs/status can detect completion in O(1) instead of never.
        await redis.decr(`job:${task.jobId}:pending`);

        const { error: dbError } = await supabase.from('validation_results').insert([
          {
            job_id: task.jobId,
            email: result.email,
            is_valid: result.isValid,
            is_catch_all: result.isCatchAll,
            validation_certainty: result.validationCertainty,
            reason: result.reason,
            mode: mode,
            created_at: new Date().toISOString(),
          },
        ]);

        if (!dbError) {
          successCount++;
          console.log(`✅ Processed: ${result.email} - Valid: ${result.isValid}`);
        } else {
          failureCount++;
          console.warn(`⚠️  DB error for ${result.email}:`, dbError.message);
        }

        await redis.lpop('tasks');
      } catch (error) {
        failureCount++;
        console.error('Error processing job:', error);
      }
    }

    console.log(
      `✅ Cron job complete - Success: ${successCount}, Failures: ${failureCount}`
    );

    return NextResponse.json({
      success: true,
      message: 'Bulk validation completed',
      processed: successCount,
      failed: failureCount,
      total: successCount + failureCount,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}