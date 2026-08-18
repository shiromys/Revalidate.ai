'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'
import UpgradeNudge from '@/components/dashboard/UpgradeNudge'
import { createClient } from '@/lib/supabase/client'

interface ValidationResult {
  status: string;
  score: number;
  theme: 'emerald' | 'amber' | 'red';
  isValid: boolean;
  isCatchAll: boolean;
  isDisposable: boolean;
  details: {
    syntax: boolean;
    mx: boolean;
    disposable: boolean;
    role: boolean;
  };
}

export default function SingleVerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<'basic' | 'full'>('basic')
  const [loading, setLoading] = useState(false)
  
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Your session has expired. Please log in again.")
        setLoading(false)
        return
      }

      const response = await fetch('/api/verify-single', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ email, mode }),
      })

      const res = await response.json()

      if (!response.ok || res.error) {
        const rawError = res.details || res.error || "Verification engine failed"
        
        if (rawError.toLowerCase().includes('limit')) {
          setError(rawError);
        } else if (
          rawError.toLowerCase().includes('timeout') || 
          rawError.toLowerCase().includes('timed out') || 
          rawError.toLowerCase().includes('breakdown')
        ) {
          setError("Something went wrong, please try again.")
        } else {
          setError(rawError)
        }
        
        setLoading(false)
        return
      }

      // 1. EXTRACT RAW FLAGS WITH ROBUST CASING OVERRIDES
      const isValid = res.valid === true;
      const isCatchAll = res.catchAll === true || res.CatchAll === true || (res.customStatus && res.customStatus.toLowerCase().includes('accept'));
      const isDisposable = res.disposableValid === false || (res.customStatus && res.customStatus.toLowerCase().includes('temp')); 

      // 2. APPLY YOUR STRICT SCORE & COLOR MATRIX RULES
      let calculatedScore = 0;
      let calculatedStatus = 'Undeliverable';
      let uiTheme: 'emerald' | 'amber' | 'red' = 'red';

      if (!isValid) {
        calculatedScore = 0;
        calculatedStatus = 'Undeliverable';
        uiTheme = 'red';
      } else if (isDisposable) {
        calculatedScore = 20;
        calculatedStatus = 'Risky / Temporary';
        uiTheme = 'amber';
      } else if (isCatchAll) {
        calculatedScore = 50;
        calculatedStatus = 'Risky / Accept-All';
        uiTheme = 'amber';
      } else {
        calculatedScore = 100;
        calculatedStatus = 'Deliverable';
        uiTheme = 'emerald';
      }

      setResult({
        status: calculatedStatus,
        score: calculatedScore,
        theme: uiTheme,
        isValid: isValid,
        isCatchAll: isCatchAll,
        isDisposable: isDisposable,
        details: {
          syntax: res.syntaxValid ?? false,
          mx: res.mxValid ?? false,
          disposable: res.disposableValid ?? false, 
          role: !res.roleValid
        }
      })

      if (typeof window !== 'undefined' && res.updatedCredits !== undefined) {
        window.dispatchEvent(new CustomEvent('credits-updated', { 
          detail: { 
            credits: res.updatedCredits,
            used: res.updatedCreditsUsed
          } 
        }));
      }

      router.refresh();
      
    } catch (err: unknown) { 
      console.error("Frontend Error:", err)
      setError("Something went wrong, please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-700 font-sans pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">Single Email Verification</h1>
          <p className="text-sm font-medium text-zinc-500">
            Enter a single email address to perform instant real-time validation checks.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/40">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter-email@example.com" 
                className="w-full p-4 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base font-bold text-zinc-900 outline-none focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-zinc-400"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">Select Processing Mode</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div
                  onClick={() => !loading && setMode('basic')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    mode === 'basic' 
                    ? 'border-red-600 bg-red-50/30 shadow-md shadow-red-900/5' 
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`text-base font-black ${mode === 'basic' ? 'text-red-900' : 'text-zinc-700'}`}>Basic Check</h4>
                      <p className="text-xs font-medium text-zinc-500 mt-1.5">Syntax & MX Records. Free tier allowance.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-[3px] mt-0.5 flex items-center justify-center transition-colors ${mode === 'basic' ? 'border-red-600 bg-white' : 'border-zinc-300 bg-transparent'}`}>
                      {mode === 'basic' && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => !loading && setMode('full')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    mode === 'full' 
                    ? 'border-red-600 bg-red-50/30 shadow-md shadow-red-900/5' 
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`text-base font-black ${mode === 'full' ? 'text-zinc-900' : 'text-zinc-700'}`}>Full Deep AI</h4>
                      <p className="text-xs font-medium text-zinc-500 mt-1.5">Full SMTP Handshake. Deducts paid credits.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-[3px] mt-0.5 flex items-center justify-center transition-colors ${mode === 'full' ? 'border-red-600 bg-white' : 'border-zinc-300 bg-transparent'}`}>
                      {mode === 'full' && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <UpgradeNudge type={mode} isVisible={!!error && error.includes('Limit')} />

            <button
              type="submit"
              disabled={loading || !email}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-sm tracking-wide transition-all shadow-sm ${
                loading || !email
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none' 
                : 'bg-[#B71C1C] text-white hover:bg-[#991717] hover:shadow-md active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> VERIFYING EMAIL...
                </>
              ) : (
                'START VALIDATION NOW'
              )}
            </button>
          </form>

          {/* DYNAMIC METRIC MATCHING RESULT CANVAS */}
          {result && (
            <div className="mt-8 border-t border-zinc-100 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900">Verification Result:</h3>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    result.theme === 'amber' ? 'bg-amber-100 text-amber-800' :
                    result.theme === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.status} (Score: {result.score}%)
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                    result.theme === 'amber'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-700'
                      : result.theme === 'emerald'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' 
                        : 'bg-red-500/10 border-red-500/20 text-red-700'
                  }`}>
                    {result.isDisposable ? '● Temporary Email' : result.isCatchAll ? '● Accept-All Domain' : (result.isValid ? '● Email Found' : '● Email Not Found')}
                  </span>
                </div>
              </div>

              {result.isCatchAll && !result.isDisposable && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-sm font-bold leading-relaxed">
                    This domain is configured to accept all incoming mail. We cannot guarantee this specific inbox exists. Sending to this address carries a higher risk.
                  </p>
                </div>
              )}

              {result.isDisposable && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-sm font-bold leading-relaxed">
                    This is a temporary/burner email address. It is highly recommended to block or remove these users as they will expire shortly.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckDetail label="Email Format Check" pass={result.details.syntax} />
                <CheckDetail label="Mail Server Check" pass={result.details.mx} />
                <CheckDetail label="Temporary Email Check" pass={result.details.disposable} />
                <CheckDetail label="Personal vs Shared Inbox Check" pass={!result.details.role} />
              </div>

              {/* NEW: DETAILED EXPLANATION BREAKDOWN */}
              <VerificationDetailsBreakdown result={result} mode={mode} />

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function CheckDetail({ label, pass }: { label: string, pass: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors">
      <span className="text-sm font-bold text-zinc-600 tracking-tight">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${pass ? 'text-emerald-600' : 'text-red-500'}`}>
          {pass ? 'Passed' : 'Failed'}
        </span>
        {pass ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <XCircle size={18} className="text-red-500" />
        )}
      </div>
    </div>
  )
}

// --- UPDATED COMPONENT: Detailed Explanation Breakdown ---
function VerificationDetailsBreakdown({ result, mode }: { result: ValidationResult, mode: 'basic' | 'full' }) {
  const checks = [
    {
      id: 'syntax',
      title: 'Email Format Check',
      passed: result.details.syntax,
      passExplanation: (
        <div className="space-y-1.5">
          <p>We checked that the email address is written correctly and follows the standard format used by email providers. A properly formatted address is the first step toward successful email delivery.</p>
          <p><span className="font-bold text-zinc-900">Why this matters:</span> Incorrectly formatted email addresses cannot receive emails, no matter how good your message is.</p>
        </div>
      ),
      failExplanation: (
        <div className="space-y-1.5">
          <p>This email address is not written in a valid format. Please check for missing characters, extra spaces, or typing mistakes before trying again.</p>
        </div>
      ),
    },
    {
      id: 'mx',
      title: 'Mail Server Check',
      passed: result.details.mx,
      passExplanation: (
        <div className="space-y-1.5">
          <p>We confirmed that this email provider is set up to receive incoming emails. This means the destination is ready to accept messages sent to addresses on this domain.</p>
          <p><span className="font-bold text-zinc-900">Why this matters:</span> If the provider is not accepting emails, your message may never reach the recipient.</p>
        </div>
      ),
      failExplanation: (
        <div className="space-y-1.5">
          <p>We could not confirm that this email provider is able to receive messages. Emails sent to this address may not be delivered.</p>
        </div>
      ),
    },
    {
      id: 'disposable',
      title: 'Temporary Email Check',
      passed: result.details.disposable, // true means it passed the 'Not Temporary' check
      passExplanation: (
        <div className="space-y-1.5">
          <p>We checked whether this email comes from a temporary or one-time-use email service. This address is from a regular email provider and is not considered disposable.</p>
          <p><span className="font-bold text-zinc-900">Why this matters:</span> Temporary email addresses are often abandoned quickly and can lead to poor engagement or higher bounce rates.</p>
        </div>
      ),
      failExplanation: (
        <div className="space-y-1.5">
          <p>This address appears to come from a temporary email service. These inboxes are often short-lived and may not be reliable for ongoing communication.</p>
        </div>
      ),
    },
    {
      id: 'role',
      title: 'Personal vs Shared Inbox Check',
      passed: !result.details.role, // true means it passed the 'Not Role-Based' check
      passExplanation: (
        <div className="space-y-1.5">
          <p>We checked whether this looks like a personal email address or a shared business inbox. This address appears to belong to an individual rather than a general mailbox like support@ or sales@.</p>
          <p><span className="font-bold text-zinc-900">Why this matters:</span> Personal email addresses usually lead to better communication and higher response rates.</p>
        </div>
      ),
      failExplanation: (
        <div className="space-y-1.5">
          <p>This appears to be a shared business mailbox rather than a personal email address. Shared inboxes are commonly used by teams instead of individual people.</p>
        </div>
      ),
    },
  ];

  // Include SMTP Deep Verification specifically for Full Deep AI mode
  if (mode === 'full') {
    checks.push({
      id: 'smtp',
      title: 'Deep AI Mailbox Check (SMTP)',
      passed: result.isValid,
      passExplanation: (
        <div className="space-y-1.5">
          <p>We established a real-time connection with the destination mail server. The server responded with a positive response, confirming the specific mailbox exists and can receive email.</p>
          <p><span className="font-bold text-zinc-900">Why this matters:</span> This guarantees the inbox is real and actively accepting mail, eliminating the risk of a hard bounce.</p>
        </div>
      ),
      failExplanation: (
        <div className="space-y-1.5">
          <p>The destination mail server rejected the mailbox or responded with an error, indicating the mailbox does not exist or is currently unavailable.</p>
        </div>
      ),
    });
  }

  return (
    <div className="mt-10 space-y-4 animate-in fade-in duration-300">
      <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-200 pb-2">
        Detailed Test Case Breakdown
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`p-5 rounded-2xl border transition-all ${
              check.passed
                ? 'bg-emerald-50/40 border-emerald-200/80'
                : 'bg-red-50/40 border-red-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    check.passed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {check.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                {check.passed ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={16} /> Passed
                  </span>
                ) : (
                  <span className="text-red-700 flex items-center gap-1">
                    <XCircle size={16} /> Failed
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-zinc-700 leading-relaxed font-medium flex items-start gap-2 pt-1">
              <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
              <div className="flex-1">{check.passed ? check.passExplanation : check.failExplanation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}