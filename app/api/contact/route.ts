import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

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

    const { error: dbError } = await supabase
      .from('support_tickets')
      .insert([
        {
          email: email.trim(),
          subject: subject.trim(),
          message: `From: ${name.trim()}\n\n${message.trim()}`,
          status: 'open',
          user_id: null
        }
      ])

    if (dbError) {
      console.error("🚨 DATABASE ERROR:", dbError.message)
      return NextResponse.json(
        { success: false, error: "Database insertion failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("🚨 API ROUTE ERROR:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    )
  }
}