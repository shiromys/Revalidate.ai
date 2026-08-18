'use client'

import * as React from 'react'
import { updatePassword } from '../actions'
import { Eye, EyeOff } from 'lucide-react'

/**
 * ResetPasswordPage
 * Workflow: Step 2 of the Forgot Password flow.
 * Logic: Includes show/hide password toggles for both fields and select-none on header.
 */
export default function ResetPasswordPage({ 
  searchParams 
}: { 
  searchParams: { error?: string; message?: string } 
}) {
  const [loading, setLoading] = React.useState(false);

  // State to track visibility of both password fields independently
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Since you are on Next.js 14, we access params directly from the object
  const error = searchParams?.error;
  const message = searchParams?.message;

  const handleUpdate = async (formData: FormData) => {
    setLoading(true);
    try {
      // Calls updatePassword in actions.ts (Updates DB + Global SignOut)
      await updatePassword(formData);
    } catch (e: unknown) {
      console.error("Update failed:", e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-sans text-zinc-900 selection:bg-red-100 selection:text-red-900 relative">
      
      {/* Main Card Container */}
      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 sm:p-12">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase cursor-default">
              REVALIDATE<span className="text-red-700">.AI</span>
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2 select-none">New Password</h1>
          <p className="text-zinc-500 font-medium text-sm">
            Create a secure password to replace your old one.
          </p>
        </div>
        
        {/* Form Section */}
        <form action={handleUpdate} className="space-y-5">
          
          {/* --- NEW PASSWORD FIELD --- */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                autoFocus
                placeholder="••••••••" 
                minLength={6}
                className="w-full px-5 py-3.5 pr-12 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* --- CONFIRM PASSWORD FIELD --- */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative">
              <input 
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                required 
                placeholder="••••••••" 
                minLength={6}
                className="w-full px-5 py-3.5 pr-12 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-[#b91c1c] text-white rounded-2xl font-black text-base hover:bg-[#991b1b] transition-all shadow-lg shadow-red-700/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'Updating Password...' : 'Update & Log In Again'}
          </button>
        </form>

        {/* Error Feedback */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-200 text-center animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        {/* Success Feedback */}
        {message && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200 text-center animate-in fade-in slide-in-from-top-2 duration-300">
            {message}
          </div>
        )}

        {/* Footer Section */}
        <div className="mt-8 pt-8 border-t border-zinc-100 text-center space-y-4">
          <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide">
            Note: You will be signed out globally after this update to ensure security.
          </p>
        </div>

      </div>
    </div>
  )
}