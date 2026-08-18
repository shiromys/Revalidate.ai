import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import React, { cache } from 'react'
import SidebarNav from './sidebarnav' // <-- THIS LINE IS FIXED

// Cache the auth and admin lookup per request cycle
const getAuthAndAdminStatus = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, isAdmin: false }
  }

  let isAdmin = false
  if (user.email) {
    const { data: adminRecord } = await supabaseAdmin
      .from('admins')
      .select('email')
      .ilike('email', user.email)
      .maybeSingle()

    isAdmin = !!adminRecord
  }

  return { user, isAdmin }
})

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin } = await getAuthAndAdminStatus()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans text-zinc-900 selection:bg-red-100 selection:text-red-900">
      
      {/* PERSISTENT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-zinc-200 hidden lg:flex flex-col sticky top-0 h-screen z-20">
        
        {/* Sidebar Header */}
        <div className="pt-8 px-6 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity mb-4">
            <div className="relative w-16 h-16 shrink-0">
              <Image 
                src="/logo.png" 
                alt="Revalidate.ai Logo" 
                fill 
                className="object-contain"
                sizes="120px"
                quality={100}
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tighter text-zinc-800 uppercase cursor-pointer">
              REVALIDATE<span className="text-red-700">.AI</span>
            </span>
          </Link>
          <span className="text-sm font-medium text-zinc-400 block mt-1 truncate pl-1">
            {user.email}
          </span>
        </div>
        
        {/* Navigation Tracker List */}
        <SidebarNav isAdmin={isAdmin} />

        {/* Logout Section */}
        <div className="p-6 border-t border-zinc-100">
          <form action="/auth/signout" method="post">
            <button 
              type="submit" 
              className="w-full py-2.5 bg-white border border-red-600 text-red-600 font-bold text-base rounded-xl hover:bg-red-50 transition-all text-center block cursor-pointer"
            >
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* PERSISTENT NAVBAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Workspace</span>
            <div className="h-4 w-px bg-zinc-200 mx-2"></div>
            <span className="text-sm font-bold text-zinc-900">Default Workspace</span>
          </div>

          <div className="flex items-center gap-4 bg-zinc-50 p-1.5 pr-4 rounded-full border border-zinc-100">
            <div className="w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm shadow-red-700/20">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-end">
              <p className="text-xs font-black text-zinc-900 leading-none mb-1">{user.email}</p>
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Verified Session</p>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT ROUTER ROOT VIEWPORTS */}
        <main className="p-10 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}