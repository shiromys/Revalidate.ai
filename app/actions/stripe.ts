'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

// NEW: We now accept 'credits' as a second argument
export async function createCheckoutSession(priceId: string, credits: number) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { requireLogin: true } 
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: user.id,
      // NEW: We securely save the credit amount in Stripe's metadata memory
      metadata: {
        userId: user.id,
        credits: credits.toString() 
      },
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'payment',
      
      // NEW: Instead of just 'success=true', we ask Stripe to attach the specific Session ID
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    })

    return { url: session.url }
    
  } catch (error: unknown) { 
    console.error('Stripe Checkout Error:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to create checkout session.' }
  }
}