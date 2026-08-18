'use client'

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createCheckoutSession } from '@/app/actions/stripe'
import { useRouter } from 'next/navigation'

interface CheckoutButtonProps {
  priceId: string;
  isPopular?: boolean;
  credits: number;
}

export default function CheckoutButton({ priceId, credits }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      // The credits are passed here to the server action
      const res = await createCheckoutSession(priceId, credits)
      
      if (res?.requireLogin) {
        localStorage.setItem('pendingStripeCheckout', JSON.stringify({ priceId, credits }))
        router.push('/auth/login') 
        return; 
      }

      if (res?.error) {
        setError(res.error)
        setLoading(false)
        return
      }

      if (res?.url) {
        // Redirecting to the Stripe Checkout page
        window.location.href = res.url
      }
    } catch (err: unknown) { 
      console.error("Checkout Error:", err) 
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full mb-8">
      <button 
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-[#8B0000] hover:bg-[#6A0000] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Processing...</>
        ) : (
          'Buy Now'
        )}
      </button>
      
      {error && (
        <p className="text-red-600 text-xs font-bold text-center mt-2 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  )
}