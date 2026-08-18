'use client'

import * as React from 'react'
import { login } from '../actions'
import Link from 'next/link'
// ADDED: Imported Check for the success message icon
import { ArrowLeft, Eye, EyeOff, Check } from 'lucide-react'

export default function LoginPage({ 
  searchParams 
}: { 
  searchParams: { error?: string; message?: string } 
}) {
  // 1. Access searchParams directly (Now grabbing both error AND message)
  const error = searchParams?.error;
  const message = searchParams?.message;
  
  // 2. State to track if the password should be visible
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center relative overflow-hidden font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* Simulated Blurred Landing Page Background (Red Orbs on Light Gray) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-red-700/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-red-700/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto px-4 z-10 flex flex-col">
        
        {/* Back Button matching the Contact Page */}
        <div className="mb-6 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-white transition-colors shadow-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        {/* Glassmorphism Login Card */}
        <div className="p-10 rounded-[2.5rem] border border-white/60 bg-white/80 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(185,28,28,0.1)]">
          
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <span className="text-2xl font-black tracking-tighter text-zinc-800 uppercase cursor-default">
                REVALIDATE<span className="text-red-700">.AI</span>
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 select-none">Welcome Back</h1>
            <p className="text-zinc-500 mt-2 font-medium">Log in to your dashboard.</p>
          </div>

          {/* ADDED: Success Message Banner (Triggers when arriving from email verification) */}
          {message && (
            <div className="mb-8 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200 text-center animate-in slide-in-from-top-4 fade-in duration-500 shadow-sm flex items-center justify-center gap-2">
              <Check size={18} className="stroke-[3]" />
              {message}
            </div>
          )}
          
          <form action={login} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                placeholder="you@company.com" 
                className="w-full p-4 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 shadow-sm" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••" 
                  className="w-full p-4 pr-12 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 shadow-sm" 
                />
                
                <button
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-700 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>
            
            <button className="w-full py-4 bg-red-700 text-white rounded-2xl font-black text-lg hover:bg-red-800 transition-all shadow-xl shadow-red-700/20 active:scale-[0.98]">
              Sign In
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-200 text-center animate-in fade-in zoom-in duration-200 shadow-sm">
              {error}
            </div>
          )}

          <div className="mt-10 flex flex-col items-center gap-4 text-sm font-bold">
             <Link href="/auth/forgot-password" className="text-zinc-500 hover:text-zinc-900 transition-colors">
               Forgot your password?
             </Link>
             <div className="w-full h-px bg-zinc-200"></div>
             <p className="text-zinc-500 font-medium">
               Do not have an account? <Link href="/auth/signup" className="text-red-700 hover:text-red-800 hover:underline font-bold">Create one</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}