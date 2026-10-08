'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'

interface CheckoutSuccessOverlayProps {
  success: boolean;
  sessionId: string | null;
  fallbackCredits: number | null;
}

interface CheckoutSessionDetails {
  paid: boolean;
  credits: number;
  amountPaidUsd: number;
  credited: boolean;
  walletCredits: number | null;
}

const AUTO_DISMISS_MS = 6000

export default function CheckoutSuccessOverlay({ success, sessionId, fallbackCredits }: CheckoutSuccessOverlayProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(success)
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<CheckoutSessionDetails | null>(null)
  const [verifyFailed, setVerifyFailed] = useState(false)

  const dismiss = () => {
    setVisible(false)
    // Strip success/credits/session_id from the URL so a refresh or back-navigation
    // doesn't reopen the overlay for a purchase that's already been acknowledged.
    router.replace('/dashboard')
  }

  // Ask the server for the real, verified numbers — straight from Stripe and from the
  // wallet balance itself — instead of trusting whatever the redirect URL happened to say.
  useEffect(() => {
    if (!success || !sessionId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function verify() {
      try {
        const res = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId as string)}`)
        if (!res.ok) throw new Error('Verification request failed')
        const data: CheckoutSessionDetails = await res.json()
        if (!cancelled) {
          setDetails(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Checkout verification failed:', err)
        if (!cancelled) {
          setVerifyFailed(true)
          setLoading(false)
        }
      }
    }

    verify()
    return () => { cancelled = true }
  }, [success, sessionId])

  // Only start the auto-close countdown once the real numbers are on screen, so the
  // overlay never disappears mid-verification.
  useEffect(() => {
    if (!success || loading) return
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, loading])

  if (!visible) return null

  // Verified data from Stripe/Supabase always wins. The URL-provided credit count is
  // only ever shown if the verification call itself couldn't be reached.
  const creditsToShow = details?.credits ?? (verifyFailed ? fallbackCredits : null)
  const amountToShow = details?.amountPaidUsd ?? null
  const newBalance = details?.walletCredits ?? null

  return (
    <div className="fixed inset-0 z-[999] bg-white/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2rem] border border-zinc-200 shadow-2xl p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-300">

        {loading ? (
          <>
            <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4">
              <Loader2 size={28} className="text-zinc-400 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-zinc-950 tracking-tight">Confirming your payment&hellip;</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1.5">Just a moment while we verify everything with Stripe.</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
              <CheckCircle2 size={30} className="text-emerald-600" />
            </div>

            <h2 className="text-2xl font-black text-zinc-950 tracking-tight">Thank You!</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1.5">Your payment was successful.</p>

            {amountToShow !== null && (
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4">
                ${amountToShow.toFixed(2)} charged
              </p>
            )}

            {creditsToShow !== null && creditsToShow > 0 && (
              <>
                <p className="text-4xl font-black text-[#8B0000] tracking-tight mt-2 tabular-nums">
                  +{creditsToShow.toLocaleString()}
                </p>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  Credits added to your wallet
                </p>
              </>
            )}

            {newBalance !== null && (
              <p className="text-xs font-semibold text-zinc-500 mt-4">
                New wallet balance: <span className="font-bold text-zinc-800">{newBalance.toLocaleString()} credits</span>
              </p>
            )}

            {details && !details.credited && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4 flex items-center gap-2 text-left">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Your payment went through, but crediting your wallet is taking a little longer than usual. It&apos;ll land shortly — no action needed.
              </p>
            )}

            {verifyFailed && (
              <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4 flex items-center gap-2 text-left">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                We couldn&apos;t confirm the exact details here, but your payment went through. Your wallet balance below reflects the real total.
              </p>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="mt-7 w-full bg-white border border-zinc-200 text-zinc-800 font-bold text-sm py-3 rounded-xl hover:bg-zinc-50 transition-all cursor-pointer"
            >
              Continue
            </button>
            <span className="text-[10px] font-medium text-zinc-400 mt-3">Closing automatically&hellip;</span>
          </>
        )}
      </div>
    </div>
  )
}