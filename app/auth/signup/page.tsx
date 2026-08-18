'use client'

import * as React from 'react'
import { signUp } from '../actions'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, Check, Mail } from 'lucide-react'

export default function SignupPage({ 
  searchParams 
}: { 
  searchParams?: { error?: string } 
}) {
  const [isPending, startTransition] = React.useTransition();
  const [showPassword, setShowPassword] = React.useState(false);
  
  // State to control the success modal and local errors
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [localError, setLocalError] = React.useState(searchParams?.error || "");

  const handleSignUp = (formData: FormData) => {
    setLocalError(""); // Clear any previous errors

    startTransition(async () => {
      try {
        const result = await signUp(formData);
        
        if (result?.success) {
          // Show the success modal!
          setShowSuccessModal(true);
        } else if (result?.error) {
          // Show the error returned from the server without redirecting
          setLocalError(result.error);
        }
      } catch (err: unknown) {
        console.error("Signup failed:", err);
        setLocalError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <>
      {/* SUCCESS MODAL OVERLAY */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
              <Mail size={36} strokeWidth={2} />
            </div>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight leading-tight">
              Check your inbox
            </h3>
            <p className="text-zinc-500 font-medium leading-relaxed text-[15px]">
              Verification email sent! Please check your inbox/spam and click the verification link to activate your account. <span className="text-red-700 font-bold">You won’t be able to access the application until your email is verified.</span>
            </p>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT - Blurs when modal is open */}
      <div className={`min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center py-12 px-4 font-sans text-zinc-900 selection:bg-red-100 selection:text-red-900 overflow-hidden transition-all duration-500 ${showSuccessModal ? 'blur-md pointer-events-none opacity-40' : ''}`}>
        
        {/* 2-COLUMN LAYOUT FOR DESKTOP */}
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
          
          {/* LEFT COLUMN: FEATURES LIST */}
          <div className="flex-1 max-w-md w-full order-2 lg:order-1">
            <div className="mb-10 hidden lg:block">
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-sm w-fit">
                <ArrowLeft size={16} strokeWidth={2.5} /> Back to Home
              </Link>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 mb-8 leading-tight">
              Sign up for free and get:
            </h1>
            
            {/* FEATURE LIST */}
            <ul className="space-y-6">
              <FeatureItem text="Real-time email validation" />
              <FeatureItem text="Detect disposable emails" />
              <FeatureItem text="Detect role-based emails" />
              <FeatureItem text="MX record verification" />
              <FeatureItem text="Bulk email validation" />
              <FeatureItem text="100 Free credits every month" />
            </ul>
          </div>

          {/* RIGHT COLUMN: SIGNUP FORM */}
          <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 sm:p-12 order-1 lg:order-2">
            
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-full text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-sm">
                <ArrowLeft size={16} strokeWidth={2.5} /> Back to Home
              </Link>
            </div>

            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <span className="text-xl font-black tracking-tighter text-zinc-900 uppercase cursor-default">
                  REVALIDATE<span className="text-red-700">.AI</span>
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">Get Started</h2>
              <p className="text-zinc-500 font-medium text-sm">
                Join Revalidate.ai & get <span className="text-red-700 font-bold">100 free credits</span>.
              </p>
            </div>
            
            <form action={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="you@company.com" 
                  className="w-full px-5 py-3.5 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" 
                />
                <div className="flex items-center gap-1.5 ml-1 mt-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                   <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">
                     Permanent email providers only
                   </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••" 
                    minLength={6}
                    className="w-full px-5 py-3.5 pr-12 rounded-2xl bg-white border border-zinc-200 focus:border-red-700 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm" 
                  />
                  <button
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 font-bold text-center px-2 pb-2 leading-relaxed">
                Verify your email using the link sent to your inbox. Login is enabled <span className="text-red-700">only after verification</span>.
              </p>

              <button 
                type="submit" 
                disabled={isPending} 
                className="w-full py-4 bg-[#b91c1c] text-white rounded-2xl font-black text-base hover:bg-[#991b1b] transition-all shadow-lg shadow-red-700/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                {isPending ? 'Verifying...' : 'Sign Up'}
              </button>
            </form>

            {localError && (
              <div className="mt-5 p-4 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-200 text-center animate-in fade-in duration-300">
                {localError}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-zinc-100 text-center space-y-4">
              <p className="text-zinc-500 font-medium text-sm">
                Already have an account? <Link href="/auth/login" className="text-red-700 font-bold hover:underline">Login</Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// HELPER COMPONENT FOR THE FEATURE CHECKLIST
function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-700 flex items-center justify-center shadow-sm">
        <Check size={16} strokeWidth={3.5} />
      </div>
      <span className="font-bold text-zinc-700 text-base">{text}</span>
    </li>
  )
}