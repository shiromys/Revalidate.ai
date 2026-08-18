'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Security Guard
async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return false
  
  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle()
    
  return !!adminRecord
}

/**
 * ACTION: Close a ticket without replying
 */
export async function closeTicket(ticketId: string) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) throw new Error("Unauthorized access")

    const { error } = await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', ticketId)

    if (error) throw error

    revalidatePath('/admin/tickets')
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred"
    return { success: false, error: errorMessage }
  }
}

/**
 * ACTION: Reply via Email and Close Ticket
 */
export async function replyToTicket(ticketId: string, userEmail: string, subject: string, replyMessage: string) {
  try {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) throw new Error("Unauthorized access")

    // 1. Send the email using Resend
    // Here we strictly enforce info@revalidate.ai for sending AND receiving
    const { error: emailError } = await resend.emails.send({
      from: 'Revalidate Support <info@revalidate.ai>', // <-- SENDER
      replyTo: 'info@revalidate.ai',                   // <-- FIX: Changed to camelCase replyTo!
      to: userEmail,
      subject: `Re: ${subject}`,
      text: replyMessage,
    })

    if (emailError) throw new Error(emailError.message)

    // 2. Mark the ticket as closed in the database
    const { error: dbError } = await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', ticketId)

    if (dbError) throw dbError

    // 3. Refresh the UI
    revalidatePath('/admin/tickets')
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred"
    console.error("Failed to reply:", errorMessage)
    return { success: false, error: errorMessage }
  }
}
