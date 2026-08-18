'use client'

import React, { useState, useEffect } from 'react'

interface HeaderCreditsProps {
  initialCredits: number;
  userEmail: string;
}

export default function HeaderCreditsWidget({ initialCredits, userEmail }: HeaderCreditsProps) {
  const [displayCredits, setDisplayCredits] = useState(initialCredits)

  useEffect(() => {
    const handleBalanceSync = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.credits === 'number') {
        setDisplayCredits(customEvent.detail.credits);
      }
    };

    window.addEventListener('credits-updated', handleBalanceSync);
    return () => window.removeEventListener('credits-updated', handleBalanceSync);
  }, []);

  return (
    <div className="flex items-center gap-6">
      
      {/* Live Dynamic Balance Count Tracker Capsule */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
        <span className="text-xs font-bold text-zinc-500">Available Credits:</span>
        <span className="text-sm font-black text-zinc-900 tabular-nums">
          {displayCredits.toLocaleString()}
        </span>
      </div>

      {/* User Session Avatar Capsule */}
      <div className="flex items-center gap-4 bg-zinc-50 p-1.5 pr-4 rounded-full border border-zinc-100">
        <div className="w-8 h-8 bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm shadow-red-700/20">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs font-black text-zinc-900 leading-none mb-1 max-w-[150px] truncate">{userEmail}</p>
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Verified Session</p>
        </div>
      </div>

    </div>
  )
}