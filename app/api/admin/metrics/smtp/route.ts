import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function GET() {
  try {
    // 1. Fetch Total Accounts
    const { count: totalAccounts } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch Bulk Job Metrics
    const { data: jobs } = await supabase
      .from('jobs')
      .select('email_count, mode');

    let bulkUploadsCount = 0;
    let bulkBasicCount = 0;
    let bulkFullCount = 0;

    jobs?.forEach(job => {
      const count = job.email_count || 0;
      const mode = job.mode?.toLowerCase() || 'full'; // Default to full deep AI if unspecified
      
      bulkUploadsCount += count;
      if (mode === 'basic') {
        bulkBasicCount += count;
      } else {
        bulkFullCount += count;
      }
    });

    // 3. Fetch Single Verifications Metrics
    const { data: singleLogs, error: singleLogsError } = await supabase
      .from('single_verifications')
      .select('mode');

    let singleChecksCount = 0;
    let singleBasicCount = 0;
    let singleFullCount = 0;

    if (!singleLogsError && singleLogs) {
      singleChecksCount = singleLogs.length;
      
      singleLogs.forEach(log => {
        if (log.mode?.toLowerCase() === 'basic') {
          singleBasicCount++;
        } else {
          singleFullCount++;
        }
      });
    } else {
      // Fallback calculation directly from user profiles if single logs are missing
      const { data: profiles } = await supabase
        .from('profiles')
        .select('monthly_basic_used');

      singleBasicCount = profiles?.reduce((sum, p) => sum + (p.monthly_basic_used || 0), 0) || 0;
      singleChecksCount = singleBasicCount;
    }

    // 4. Calculate Final Aggregated Metrics
    const totalValidations = bulkUploadsCount + singleChecksCount;
    const basicChecksCount = bulkBasicCount + singleBasicCount;
    const fullDeepAiCount = bulkFullCount + singleFullCount;

    return NextResponse.json({
      // Core Metrics
      totalAccounts: totalAccounts || 0,
      totalValidations: totalValidations,
      
      // Upload Type Split
      bulkUploads: bulkUploadsCount,
      singleChecks: singleChecksCount,
      
      // Engine Mode Split
      basicChecks: basicChecksCount,
      fullDeepAi: fullDeepAiCount,
      
      // Legacy Aliases (preserved for other dashboards like System Health)
      total: totalValidations,
      success: fullDeepAiCount, 
      failed: 0
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });

  } catch (error) {
    console.error('Metrics route error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}