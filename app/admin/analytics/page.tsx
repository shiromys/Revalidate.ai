import React from 'react'
import { getDashboardData } from './actions'
import DashboardCharts from './components/DashboardCharts'
import { Activity, DollarSign, Calendar, TrendingUp, BarChart4, Filter } from 'lucide-react'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface TransactionItem {
  id: string;
  user_id: string;
  amount: number;
  credits_added: number;
  created_at: string;
  user_email: string;
}

interface RawTxRecord {
  id?: string;
  user_id?: string | null;
  amount_usd?: number | null;
  amount?: number | null;
  credits_added?: number | null;
  created_at?: string | null;
  email_id?: string | null;
  email?: string | null;
  user_email?: string | null;
}

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string };
}) {
  // 1. FETCH DASHBOARD CHART DATA
  const chartData = await getDashboardData();

  // 2. PARSE CUSTOM DATES FROM URL
  const startDate = searchParams.startDate || '';
  const endDate = searchParams.endDate || '';

  // 3. SECURELY INITIALIZE ADMIN CLIENT WITH SERVICE ROLE KEY
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  // 4. DIRECT QUERY TO TRANSACTIONS TABLE
  const { data: rawTransactions, error: dbError } = await adminSupabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error('Supabase DB Fetch Error:', dbError);
  }

  // 5. FETCH AUTH USERS FOR EMAIL LOOKUP (Fixed: using const instead of let)
  const userEmailMap = new Map<string, string>();
  try {
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers();
    if (!authError && authData?.users) {
      authData.users.forEach((u) => {
        if (u.id && u.email) {
          userEmailMap.set(u.id, u.email);
        }
      });
    }
  } catch (err) {
    console.error('Auth User Mapping Error:', err);
  }

  // 6. SAFE DATA MAPPING WITH TYPED PARAMETERS (Fixed: using RawTxRecord interface)
  const processedTransactions: TransactionItem[] = (rawTransactions || []).map((tx: RawTxRecord, index: number) => {
    // Resolve email address across all possible column names or Auth lookup
    const resolvedEmail =
      tx.email_id ||
      tx.email ||
      tx.user_email ||
      (tx.user_id ? userEmailMap.get(tx.user_id) : null) ||
      'N/A';

    // Resolve dollar amount prioritizing Stripe amount_usd, then amount
    const rawAmount = tx.amount_usd !== undefined && tx.amount_usd !== null ? tx.amount_usd : tx.amount;
    const finalAmount = Number(rawAmount) || 0;

    return {
      id: tx.id || `tx-${index}`,
      user_id: tx.user_id || 'N/A',
      amount: finalAmount,
      credits_added: Number(tx.credits_added) || 0,
      created_at: tx.created_at || new Date().toISOString(),
      user_email: resolvedEmail,
    };
  });

  // 7. CALCULATE REVENUE STATS
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let todayRevenue = 0;
  let todayCount = 0;
  let sevenDayRevenue = 0;
  let sevenDayCount = 0;
  let allTimeRevenue = 0;
  let allTimeCount = 0;
  let customRevenue = 0;
  let customCount = 0;

  processedTransactions.forEach((tx) => {
    const amount = tx.amount;
    const txDate = tx.created_at;

    allTimeRevenue += amount;
    allTimeCount += 1;

    if (txDate >= startOfToday) {
      todayRevenue += amount;
      todayCount += 1;
    }

    if (txDate >= sevenDaysAgo) {
      sevenDayRevenue += amount;
      sevenDayCount += 1;
    }

    if (startDate && endDate) {
      const filterStart = new Date(`${startDate}T00:00:00.000Z`).toISOString();
      const filterEnd = new Date(`${endDate}T23:59:59.999Z`).toISOString();

      if (txDate >= filterStart && txDate <= filterEnd) {
        customRevenue += amount;
        customCount += 1;
      }
    }
  });

  return (
    <div className="p-8 md:p-12 animate-in fade-in duration-700 bg-[#f8f9fa] min-h-screen font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
              <Activity className="text-red-600" /> Revenue and Analytics
            </h1>
            <div className="h-1 w-12 bg-red-600 rounded-full mt-3 mb-3"></div>
            <p className="text-sm font-medium text-zinc-500">Live platform metrics, revenue, and system security.</p>
          </div>
        </div>

        {/* FILTER CONTROLS */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-red-600" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Custom Date Range</h2>
          </div>

          <form className="flex flex-col sm:flex-row items-end gap-4" method="GET" action="/admin/analytics">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="w-full sm:w-48 p-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                required
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="w-full sm:w-48 p-2.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              <Filter size={16} /> Apply Filter
            </button>

            {startDate && endDate && (
              <a
                href="/admin/analytics"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition-colors"
              >
                Clear
              </a>
            )}
          </form>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TODAY'S REVENUE */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Todays Revenue</h3>
              </div>
              <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-100">
                <DollarSign size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2">
                ${todayRevenue.toFixed(2)}
              </h2>
              <p className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                {todayCount} {todayCount === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
          </div>

          {/* 7-DAY REVENUE */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Last 7 Days</h3>
              </div>
              <div className="p-2.5 bg-zinc-50 text-zinc-700 rounded-lg border border-zinc-100">
                <TrendingUp size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2">
                ${sevenDayRevenue.toFixed(2)}
              </h2>
              <p className="text-sm font-medium text-zinc-500 flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                {sevenDayCount} {sevenDayCount === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
          </div>

          {/* ALL-TIME REVENUE */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between hover:border-red-100 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest">All-Time Revenue</h3>
              </div>
              <div className="p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100">
                <BarChart4 size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-red-600 tracking-tight mb-2">
                ${allTimeRevenue.toFixed(2)}
              </h2>
              <p className="text-sm font-medium text-red-800/70 flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                {allTimeCount} {allTimeCount === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOM RANGE RESULTS */}
        {startDate && endDate && (
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between text-white animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Filtered Revenue</h3>
              <p className="text-zinc-300 text-sm mb-4 md:mb-0">
                From <span className="font-semibold text-white">{startDate}</span> to <span className="font-semibold text-white">{endDate}</span>
              </p>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-4xl font-bold text-white tracking-tight mb-1">
                ${customRevenue.toFixed(2)}
              </h2>
              <p className="text-sm font-medium text-zinc-400">
                {customCount} {customCount === 1 ? 'transaction' : 'transactions'} found
              </p>
            </div>
          </div>
        )}

        {/* CHARTS COMPONENT */}
        <DashboardCharts data={chartData} />

        {/* ALL TRANSACTIONS TABLE */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-base font-bold text-zinc-900">All Transactions</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">
              Complete transaction logs showing user purchases and top-ups.
            </p>
          </div>

          {processedTransactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 font-medium text-sm">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">1. Email</th>
                    <th className="px-6 py-4">2. Date & Time</th>
                    <th className="px-6 py-4">3. Amount ($)</th>
                    <th className="px-6 py-4">4. Credits Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {processedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900">
                        {tx.user_email}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-medium">
                        {new Date(tx.created_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-700">
                        +{tx.credits_added.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}