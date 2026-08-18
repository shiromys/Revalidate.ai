import { supabaseAdmin } from '@/lib/supabase/admin'
import { Ban, CheckCircle2, Wallet, Clock } from 'lucide-react'
import UserTableActions from './UserTableActions'

// This forces Next.js to always fetch fresh data when you load this page
export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  // 1. Handle Search
  const query = searchParams.search || ''
  
  // 2. Fetch Users securely from the server
  let dbQuery = supabaseAdmin
    .from('profiles')
    .select('id, email, wallet_credits, free_used, monthly_basic_used, is_suspended, created_at, is_admin')
    .order('created_at', { ascending: false })

  if (query) {
    dbQuery = dbQuery.ilike('email', `%${query}%`)
  }

  const { data: users, error } = await dbQuery

  // 3. --- LIVE 30-DAY ACTIVITY CHECK ---
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: recentActivities } = await supabaseAdmin
      .from('user_activities')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo);

  const activeUserIds = new Set(recentActivities?.map(activity => activity.user_id) || []);

  if (error) {
    return <div className="text-red-500 font-bold p-8">Error loading users: {error.message}</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">User Management</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage accounts, wallets, and access.</p>
        </div>

        <form className="relative w-72" method="GET" action="/admin/users">
          <input 
            type="text" 
            name="search"
            defaultValue={query}
            placeholder="Search by email..." 
            className="w-full p-3 rounded-xl border border-zinc-200 outline-none focus:border-red-600 font-bold text-sm shadow-sm transition-colors"
          />
          <button type="submit" className="hidden">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">User Email</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Wallet Credits</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Usage (Free / Monthly)</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Joined</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users?.map((user) => {
                // Determine Live Status
                const isActive = activeUserIds.has(user.id);

                return (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-5 font-bold text-zinc-900 flex items-center gap-2">
                      <span className="truncate">{user.email}</span>
                      {user.is_admin && (
                        <span className="bg-red-50 text-[#8B0000] text-[10px] font-bold px-2 py-0.5 rounded border border-red-100 uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                    </td>
                    
                    {/* LIVE STATUS COLUMN */}
                    <td className="p-5">
                      {user.is_suspended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                          <Ban size={10} /> Suspended
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-wider border border-zinc-200">
                          <Clock size={10} /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2 font-bold text-blue-800">
                        <Wallet size={16} /> {user.wallet_credits?.toLocaleString() || 0}
                      </div>
                    </td>
                    
                    {/* LIVE BASIC USAGE COLUMN */}
                    <td className="p-5 font-bold text-zinc-600 text-sm">
                      {user.monthly_basic_used || 0} / 100
                    </td>
                    
                    <td className="p-5 text-sm font-bold text-zinc-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="p-5 text-right">
                      {/* Uses clean pathing now */}
                      <UserTableActions 
                        userId={user.id} 
                        email={user.email} 
                        isAdmin={!!user.is_admin} 
                      />
                    </td>
                  </tr>
                )
              })}
              
              {users?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-bold text-zinc-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}