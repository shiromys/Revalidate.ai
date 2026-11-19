import { createClient } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendNexusWebhook } from '@/lib/nexus/webhooks'

// 1. Adjusted rules to be more forgiving for short words
const contactSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long"),
  email: z.string().email("Invalid email format"),
  subject: z.string().min(2, "Subject is too short").max(150, "Subject is too long"),
  message: z.string().min(5, "Message is too short").max(2000, "Message is too long")
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 0. Cloudflare Turnstile bot/spam check — must pass before anything else runs
    const isHuman = await verifyTurnstileToken(
      body.turnstileToken,
      request.headers.get('x-forwarded-for') ?? undefined
    )
    if (!isHuman) {
      return NextResponse.json(
        { success: false, error: "Verification failed. Please try again." },
        { status: 400 }
      )
    }

    // Safely parse and sanitize the data
    const validatedData = contactSchema.safeParse(body)

    if (!validatedData.success) {
      // FIXED: Changed .errors to .issues to satisfy Zod's strict TypeScript definitions
      const specificErrorMessage = validatedData.error.issues[0]?.message || "Invalid form data provided.";
      
      return NextResponse.json(
        { success: false, error: specificErrorMessage },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validatedData.data
    const supabase = createClient()
    const fullMessage = `From: ${name.trim()}\n\n${message.trim()}`

    const { data: ticket, error: dbError } = await supabase
      .from('support_tickets')
      .insert([
        {
          email: email.trim(),
          subject: subject.trim(),
          message: fullMessage,
          status: 'open',
          user_id: null,
          channel: 'form'
        }
      ])
      .select('id')
      .single()

    if (dbError) {
      console.error("🚨 DATABASE ERROR:", dbError.message)
      return NextResponse.json(
        { success: false, error: "Database insertion failed" },
        { status: 500 }
      )
    }

    // Record the opening message in the thread (service-role client: the
    // anon/cookie client used above may not have insert rights on this
    // table depending on RLS, and this write isn't user-facing).
    await supabaseAdmin.from('support_messages').insert([
      {
        ticket_id: ticket.id,
        type: 'user',
        author: email.trim(),
        body_text: fullMessage,
      },
    ]).then(() => {}, (err) => console.error('🚨 Failed to record opening message:', err))

    // Notify the Application Nexus so a support person sees this within
    // seconds (spec section 5, event: ticket.created). Best-effort — a
    // webhook failure must never block the user's contact-form submission.
    void sendNexusWebhook('ticket.created', ticket.id)

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("🚨 API ROUTE ERROR:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    )
  }
}