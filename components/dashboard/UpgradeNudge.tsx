'use client'

import React from 'react'
import { Crown, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface UpgradeNudgeProps {
  type: 'basic' | 'full';
  isVisible: boolean;
}

export default function UpgradeNudge({ type, isVisible }: UpgradeNudgeProps) {
  // If user still has credits, don't show anything
  if (!isVisible) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-amber-50 border-2 border-amber-200/50 p-6 rounded-[2.5rem] relative overflow-hidden">
        
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 opacity-10 translate-x-4 -translate-y-4">
          <Crown size={120} />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Icon Section */}
          <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <AlertCircle size={28} strokeWidth={2.5} />
          </div>

          {/* Text Section */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-amber-900 tracking-tight">
              {type === 'full' ? 'Full AI Credits Exhausted' : 'Monthly Basic Limit Reached'}
            </h3>
            <p className="text-sm text-amber-700 font-medium mt-1">
              Your data deserves the best. Upgrade to a Pro plan to continue validating 
              with 99.9% accuracy and no daily limits.
            </p>
          </div>

          {/* Action Button */}
          <Link 
            href="/dashboard/settings" 
            className="group flex items-center gap-2 bg-amber-900 text-amber-50 px-8 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-amber-900/10 active:scale-95"
          >
            Upgrade Workspace
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}