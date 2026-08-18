import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Users, Mail, BarChart3, Layers } from 'lucide-react';

// Force Next.js to NEVER cache this page so the numbers are always 100% live
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store'; 
export const revalidate = 0;

interface JobItem {
    email_count: number | null;
    created_at: string;
    mode: string | null;
}

interface SingleVerificationItem {
    created_at: string;
    mode: string | null;
}

interface ActivityItem {
    user_id: string;
}

export default async function AdminDashboardPage() {
    await headers();
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. OPTIMIZED PARALLEL QUERIES (Selective column projection + SQL-level filtering)
    const results = await Promise.all([
        // Total Users Count
        adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
        
        // Active Users (Last 30 Days)
        adminSupabase.from('user_activities').select('user_id').gte('created_at', thirtyDaysAgo),
        
        // Completed Jobs
        adminSupabase.from('jobs').select('email_count, created_at, mode').in('status', ['COMPLETED', 'completed', 'Completed']),
        
        // Single Verifications (Filtered to current month to minimize data payload)
        adminSupabase.from('single_verifications').select('created_at, mode').gte('created_at', firstDayOfMonth),
        
        // Single Verifications Total Count
        adminSupabase.from('single_verifications').select('*', { count: 'exact', head: true }),

        // Validation Results Count (Fallback reference)
        adminSupabase.from('validation_results').select('*', { count: 'exact', head: true })
    ]);

    const totalUsers = results[0].count || 0;
    const recentActivities = (results[1].data as ActivityItem[] | null) || [];
    const jobs = (results[2].data as JobItem[] | null) || [];
    const monthlySingleVerifications = (results[3].data as SingleVerificationItem[] | null) || [];
    const totalSingleVerificationsCount = results[4].count || 0;
    const resultsTableCount = results[5].count || 0;

    const activeUserIds = new Set(recentActivities.map((activity) => activity.user_id));
    const activeUsersCount = activeUserIds.size;

    // ==========================================
    // 2. PROCESS BULK UPLOADS (From 'jobs' table)
    // ==========================================
    let bulkAllTime = 0;
    let bulkThisMonth = 0;
    let bulkBasicThisMonth = 0;
    let bulkFullThisMonth = 0;

    const firstDayTime = new Date(firstDayOfMonth).getTime();

    jobs.forEach((job) => {
        const count = job.email_count || 0;
        bulkAllTime += count;
        
        if (new Date(job.created_at).getTime() >= firstDayTime) {
            bulkThisMonth += count;
            
            const mode = String(job.mode || '').toLowerCase().trim();
            if (mode.includes('full') || mode.includes('deep') || mode.includes('advanced')) {
                bulkFullThisMonth += count;
            } else {
                bulkBasicThisMonth += count;
            }
        }
    });

    // ==========================================
    // 3. PROCESS SINGLE CHECKS (From 'single_verifications' table)
    // ==========================================
    let singleChecksTotal = totalSingleVerificationsCount;
    const singleThisMonth = monthlySingleVerifications.length;
    let singleBasicThisMonth = 0;
    let singleFullThisMonth = 0;

    monthlySingleVerifications.forEach((log) => {
        const mode = String(log.mode || '').toLowerCase().trim();
        if (mode.includes('full') || mode.includes('deep') || mode.includes('advanced')) {
            singleFullThisMonth++;
        } else {
            singleBasicThisMonth++;
        }
    });

    // Keep historical all-time total accurate in case old logs were deleted
    if (resultsTableCount > bulkAllTime) {
        const historicalSingles = resultsTableCount - bulkAllTime;
        if (historicalSingles > singleChecksTotal) {
            singleChecksTotal = historicalSingles; 
        }
    }

    // ==========================================
    // 4. AGGREGATE FINAL TOTALS
    // ==========================================
    const totalAllTime = bulkAllTime + singleChecksTotal;
    const totalThisMonth = bulkThisMonth + singleThisMonth;
    
    // Total Basic = (Bulk Basic + Single Basic)
    const basicThisMonth = bulkBasicThisMonth + singleBasicThisMonth;
    
    // Total Full = (Bulk Full + Single Full)
    const fullThisMonth = bulkFullThisMonth + singleFullThisMonth;
    
    const modesTotal = basicThisMonth + fullThisMonth;

    // Percentages for Progress Bars
    const uploadTotal = bulkAllTime + singleChecksTotal;
    const bulkPercent = uploadTotal > 0 ? (bulkAllTime / uploadTotal) * 100 : 0;
    const singlePercent = uploadTotal > 0 ? (singleChecksTotal / uploadTotal) * 100 : 0;

    const basicPercent = modesTotal > 0 ? (basicThisMonth / modesTotal) * 100 : 0;
    const fullPercent = modesTotal > 0 ? (fullThisMonth / modesTotal) * 100 : 0;

    return (
        <div className="p-8 md:p-12 animate-in fade-in duration-700 bg-[#f8f9fa] min-h-screen font-sans">
            <div className="max-w-6xl mx-auto space-y-10">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Validation Report</h1>
                        <div className="h-1 w-12 bg-red-600 rounded-full mt-2 mb-3"></div>
                        <p className="text-sm font-medium text-zinc-500">Live administrator dashboard and platform metrics.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-zinc-200 shadow-sm">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Live Data</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* USERS CARD */}
                    <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-base font-semibold text-zinc-900">Total User Accounts</h3>
                                <p className="text-sm font-normal text-zinc-500 mt-1">People registered on the platform</p>
                            </div>
                            <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-100">
                                <Users size={18} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-zinc-900 mb-3">
                                {totalUsers.toLocaleString()}
                            </h2>
                            <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <p className="text-sm font-medium text-zinc-700">
                                    <span className="font-semibold text-zinc-900">{activeUsersCount.toLocaleString()}</span> active last 30 days
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* VALIDATIONS CARD */}
                    <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-red-100 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-base font-semibold text-red-700">Total Validations</h3>
                                <p className="text-sm font-normal text-zinc-500 mt-1">Total volume of emails checked</p>
                            </div>
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100">
                                <Mail size={18} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold text-red-600 mb-3">
                                {totalAllTime.toLocaleString()}
                            </h2>
                            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-md">
                                <p className="text-sm font-medium text-red-800">
                                    <span className="font-semibold">{totalThisMonth.toLocaleString()}</span> processed this month
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* UPLOAD TYPE SPLIT CARD */}
                    <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-base font-semibold text-zinc-900">How Users Validate</h3>
                                <p className="text-sm font-normal text-zinc-500 mt-1">Bulk CSV Uploads vs Single Email Checks</p>
                            </div>
                            <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-100">
                                <Layers size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="w-full h-2 flex rounded-full overflow-hidden mb-5 bg-zinc-100">
                                <div style={{ width: `${bulkPercent}%` }} className="h-full bg-zinc-800"></div>
                                <div style={{ width: `${singlePercent}%` }} className="h-full bg-red-600"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span> Bulk Uploads
                                    </p>
                                    <h3 className="text-2xl font-bold text-zinc-900">{bulkAllTime.toLocaleString()}</h3>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Single Checks
                                    </p>
                                    <h3 className="text-2xl font-bold text-red-600">{singleChecksTotal.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VALIDATION MODES SPLIT CARD */}
                    <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-base font-semibold text-zinc-900">Engine Usage (This Month)</h3>
                                <p className="text-sm font-normal text-zinc-500 mt-1">Fast Basic Checks vs Full Deep AI Analysis</p>
                            </div>
                            <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-100">
                                <BarChart3 size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="w-full h-2 flex rounded-full overflow-hidden mb-5 bg-zinc-100">
                                <div style={{ width: `${basicPercent}%` }} className="h-full bg-zinc-300"></div>
                                <div style={{ width: `${fullPercent}%` }} className="h-full bg-red-600"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Basic Checks
                                    </p>
                                    <h3 className="text-2xl font-bold text-zinc-700">{basicThisMonth.toLocaleString()}</h3>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Full Deep AI
                                    </p>
                                    <h3 className="text-2xl font-bold text-red-600">{fullThisMonth.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}