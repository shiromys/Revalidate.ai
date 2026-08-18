import { forgotPassword } from '../actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ForgotPasswordPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string, message?: string }> 
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center py-12 px-4 font-sans text-zinc-900 selection:bg-red-100 selection:text-red-900">
      
      {/* Back to Login Button */}
      <div className="mb-8">
        <Link href="/auth/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-sm">
          <ArrowLeft size={16} strokeWidth={2.5} /> Back to Login
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 sm:p-12">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase cursor-default">
              REVALIDATE<span className="text-red-700">.AI</span>
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">Reset Password</h1>
          <p className="text-zinc-500 font-medium text-sm">We will send a 8-digit code to your email.</p>
        </div>

        {/* Form Section */}
        <form action={forgotPassword} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="name@company.com" 
              className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" 
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#b91c1c] text-white rounded-2xl font-black text-base hover:bg-[#991b1b] transition-all shadow-lg shadow-red-700/20 active:scale-[0.98]"
          >
            Send Verification Code
          </button>
        </form>

        {/* Error State */}
        {params.error && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-200 text-center animate-in fade-in duration-300">
            {params.error}
          </div>
        )}

        {/* Success Message */}
        {params.message && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200 text-center animate-in fade-in duration-300">
            {params.message}
          </div>
        )}
        
        {/* Footer Section */}
        <div className="mt-8 pt-8 border-t border-zinc-100 text-center space-y-4">
          <p className="text-zinc-500 font-medium text-sm">
            Remember your password? <Link href="/auth/login" className="text-red-700 font-bold hover:underline">Login</Link>
          </p>
        </div>

      </div>
    </div>
  )
}