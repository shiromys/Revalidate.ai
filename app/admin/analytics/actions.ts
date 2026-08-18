'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { format, subDays } from 'date-fns'

// Security Guard
async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return false
  
  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle()
    
  return !!adminRecord
}

/**
 * ACTION: Ping the VPS Health Endpoint
 */
export async function checkVpsHealth() {
  try {
    const response = await fetch('https://worker.revalidate.ai/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) 
    })
    return { status: response.ok ? 'online' : 'degraded' }
  } catch { 
    return { status: 'offline' }
  }
}

/**
 * ACTION: Fetch Abuse Logs
 */
export async function getAbuseLogs() {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) throw new Error("Unauthorized")

  const { data, error } = await supabaseAdmin
    .from('rate_limit_violations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

/**
 * ACTION: Fetch 100% Real, Database-Driven Chart Data (Last 7 Days)
 */
export async function getDashboardData() {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) throw new Error("Unauthorized")

  const sevenDaysAgo = subDays(new Date(), 7).toISOString()

  // 1. Fetch RAW LIVE DATA. Notice we now query 'validation_results' and 'amount_usd'
  const [profilesRes, transactionsRes, validationsRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('created_at').gte('created_at', sevenDaysAgo),
    supabaseAdmin.from('transactions').select('amount_usd, created_at').gte('created_at', sevenDaysAgo),
    supabaseAdmin.from('validation_results').select('created_at').gte('created_at', sevenDaysAgo)
  ])

  // 2. Initialize the last 7 days with absolute ZERO
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i)
    return {
      date: format(d, 'MMM dd'),
      signups: 0,
      revenue: 0,
      validations: 0 
    }
  })

  // 3. Process Real Signups
  if (profilesRes.data) {
    profilesRes.data.forEach(profile => {
      const day = format(new Date(profile.created_at), 'MMM dd')
      const chartDay = chartData.find(d => d.date === day)
      if (chartDay) chartDay.signups += 1
    })
  }

  // 4. Process Real Revenue (Using amount_usd)
  if (transactionsRes.data) {
    transactionsRes.data.forEach(tx => {
      const day = format(new Date(tx.created_at), 'MMM dd')
      const chartDay = chartData.find(d => d.date === day)
      if (chartDay) chartDay.revenue += Number(tx.amount_usd || 0)
    })
  }

  // 5. Process Real Validations (Counting rows in validation_results)
  if (validationsRes.data) {
    validationsRes.data.forEach(val => {
      const day = format(new Date(val.created_at), 'MMM dd')
      const chartDay = chartData.find(d => d.date === day)
      if (chartDay) chartDay.validations += 1
    })
  }

  return chartData
}