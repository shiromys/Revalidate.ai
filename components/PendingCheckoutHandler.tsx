'use client'

import { useEffect, useState } from 'react'
import { createCheckoutSession } from '@/app/actions/stripe'
import { Loader2 } from 'lucide-react'

export default function PendingCheckoutHandler() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Check if the user tried to buy something before logging in
    const pendingDataString = localStorage.getItem('pendingStripeCheckout')
    
    if (pendingDataString) {
      setIsRedirecting(true)
      
      // Remove it immediately so it doesn't trigger again in the future
      localStorage.removeItem('pendingStripeCheckout')
      
      try {
        // Parse the saved JSON data
        const data = JSON.parse(pendingDataString)
        
        // Ensure both arguments exist before calling the backend
        if (data.priceId && data.credits) {
          // FIXED: We now pass BOTH arguments to satisfy TypeScript!
          createCheckoutSession(data.priceId, data.credits)
            .then((res) => {
              if (res?.url) {
                window.location.href = res.url // Send them straight to Stripe!
              } else {
                setIsRedirecting(false)
              }
            })
            .catch(() => setIsRedirecting(false))
        } else {
          setIsRedirecting(false)
        }
      } catch { 
        // FIXED: Removed the unused (e) variable to clear the TypeScript error
        // Failsafe in case old string data is stuck in local storage
        setIsRedirecting(false)
      }
    }
  }, [])

  if (!isRedirecting) return null

  return (
    <div className="fixed inset-0 z-[999] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
      <Loader2 size={48} className="animate-spin text-red-600 mb-6" />
      <h2 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">Preparing your secure checkout...</h2>
      <p className="text-zinc-500 font-medium">Please wait while we redirect you to Stripe.</p>
    </div>
  )
}