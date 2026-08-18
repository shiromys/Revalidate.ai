import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return new NextResponse("Error: Missing jobId parameter in the URL", { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Error: Unauthorized. Could not find your login session.", { status: 401 });
    }

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, file_name')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return new NextResponse("Error: Job not found or access denied in Supabase.", { status: 404 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    });

    const redisKey = `results:${jobId}`;
    const rawResults = await redis.lrange(redisKey, 0, -1);

    if (!rawResults || rawResults.length === 0) {
      return new NextResponse("Error: This file has expired and been deleted from Upstash Redis.", { status: 410 });
    }

    const parsedResults: Array<Record<string, unknown>> = [];
    
    for (const item of rawResults) {
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item) as Record<string, unknown>;
          parsedResults.push(parsed);
        } catch (err) { 
          // FIX: We are now actively using the 'err' variable in the log.
          // This eliminates the "unused local variable" strict error!
          console.error("Failed to parse row:", item, err);
        }
      } else if (typeof item === 'object' && item !== null) {
         parsedResults.push(item as Record<string, unknown>);
      }
    }

    if (parsedResults.length === 0) {
      return new NextResponse("Error: Invalid data format stored in cache.", { status: 500 });
    }

    const headers = Object.keys(parsedResults[0]).join(',');
    const rows = parsedResults.map(row => 
      Object.values(row).map(val => {
        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const finalFileName = `cleaned_${job.file_name || 'list.csv'}`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
      },
    });

  } catch (error) { 
    console.error("🚨 Bulk Download Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
}