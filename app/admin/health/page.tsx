'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Database, CreditCard, Activity, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface ServiceHealth {
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  error: string | null;
}

interface HealthData {
  supabase: ServiceHealth;
  stripe: ServiceHealth;
  checkedAt: string;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // FETCH LIVE DATA FROM API
  const fetchLiveHealth = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch live health metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveHealth();
    // Auto-poll live status every 15 seconds
    const interval = setInterval(() => fetchLiveHealth(), 15000);
    return () => clearInterval(interval);
  }, [fetchLiveHealth]);

  return (
    <div className="animate-in fade-in duration-500 pb-8 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Activity className="text-red-600" />
            System Health
          </h1>
          <p className="text-sm font-medium text-zinc-500 mt-2">
            Real-time infrastructure monitoring and API connection status.
          </p>
        </div>

        <button
          onClick={() => fetchLiveHealth(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-red-600' : ''} />
          {refreshing ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 font-semibold text-sm bg-white rounded-2xl border border-zinc-200">
          Fetching live system status...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SUPABASE CARD */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Database size={24} />
                </div>
                {health?.supabase?.status === 'OPERATIONAL' ? (
                  <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Supabase Database</h3>
              <p className="text-xs font-medium text-zinc-400">
                Live query response time: <span className="text-zinc-700 font-bold">{health?.supabase?.latencyMs}ms</span>
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  health?.supabase?.status === 'OPERATIONAL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {health?.supabase?.status || 'UNKNOWN'}
              </span>
            </div>
          </div>

          {/* STRIPE CARD */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CreditCard size={24} />
                </div>
                {health?.stripe?.status === 'OPERATIONAL' ? (
                  <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                  <XCircle className="text-red-500" size={20} />
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Stripe Checkout</h3>
              <p className="text-xs font-medium text-zinc-400">
                Live API response time: <span className="text-zinc-700 font-bold">{health?.stripe?.latencyMs}ms</span>
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  health?.stripe?.status === 'OPERATIONAL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {health?.stripe?.status || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}