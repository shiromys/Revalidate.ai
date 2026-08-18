'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function VerifyOTPPage() {
  const [otp, setOtp] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [email, setEmail] = React.useState('')

  const supabase = createClient()

  // We use standard window.location to get the email.
  // This avoids the 'next/navigation' hook that is causing your crash.
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setEmail(params.get('email') || '')
    }
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || loading) return

    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'recovery',
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      // Hard redirect to bypass middleware and the broken router
      window.location.replace('/auth/reset-password')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center py-12 px-4 font-sans text-zinc-900 selection:bg-red-100 selection:text-red-900">
      
      {/* Back to Login Link */}
      <div className="mb-8">
        <Link href="/auth/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-sm">
          <ArrowLeft size={16} strokeWidth={2.5} /> Back to Login
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 sm:p-12 text-center">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex justify-center mb-6">
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase cursor-default">
              REVALIDATE<span className="text-red-700">.AI</span>
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 mb-2">Verify Code</h1>
          <p className="text-zinc-500 font-medium text-sm leading-relaxed">
            We sent a verification code to <br />
            <span className="text-red-700 font-bold">{email}</span>
          </p>
        </div>
        
        <form onSubmit={handleVerify} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest block">
              Enter 6-Digit Code
            </label>
            <input 
              type="text"
              placeholder="000000"
              required
              maxLength={8}
              className="w-full text-center text-4xl font-black p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-red-700 focus:ring-4 focus:ring-red-50 transition-all tracking-[0.2em] placeholder:text-zinc-200 shadow-inner"
              onChange={(e) => setOtp(e.target.value)}
              value={otp}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#b91c1c] text-white rounded-2xl font-black text-lg hover:bg-[#991b1b] transition-all shadow-lg shadow-red-700/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-200 animate-in fade-in zoom-in duration-200">
            {error}
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-10 pt-8 border-t border-zinc-50">
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <ShieldCheck size={16} />
            <p className="text-[11px] font-bold uppercase tracking-wider">Secure Verification</p>
          </div>
        </div>
      </div>
    </div>
  )
}