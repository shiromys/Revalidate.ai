import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// 1. Define the strict rules for the incoming data
const contactSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long"),
  email: z.string().email("Invalid email format"),
  subject: z.string().min(5, "Subject is too short").max(150, "Subject is too long"),
  message: z.string().min(10, "Message is too short").max(2000, "Message is too long")
})

// 2. Transformed into an explicit POST HTTP Method handler for standard API routing
export async function POST(request: Request) {
  try {
    // Read the incoming JSON body payload sent from your client form handler
    const body = await request.json()

    // Safely parse and sanitize the data using Zod
    const validatedData = contactSchema.safeParse({
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
    })

    // If a malicious payload is sent, bounce it immediately
    if (!validatedData.success) {
      // Returning a generic error so we don't expose internal validation logic
      return NextResponse.json(
        { success: false, error: "Invalid form data provided. Please check your inputs." },
        { status: 400 }
      )
    }

    // Extract the safely validated strings
    const { name, email, subject, message } = validatedData.data
    const supabase = createClient()

    // Insert payload into your Supabase database instance
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
      // Log the real error to your secure console, but DO NOT send it to the user
      console.error("🚨 DATABASE ERROR:", dbError.message)
      throw new Error("Database insertion failed") 
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    // Generic Error Fallback (Prevents stack trace leaks to the browser)
    console.error("🚨 API ROUTE ERROR:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred. Please try again later." 
      },
      { status: 500 }
    )
  }
}