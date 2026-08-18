import React from 'react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import TicketCard, { Ticket } from './components/TicketCard'

export const dynamic = 'force-dynamic'

export default async function SupportTicketsPage() {
  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .order('status', { ascending: false }) // 'open' comes before 'closed'
    .order('created_at', { ascending: false })

  if (error) console.error("🚨 Error fetching tickets:", error)

  const typedTickets = (tickets || []) as Ticket[]

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Support Tickets</h1>
        <p className="text-zinc-500 font-medium mt-1">Respond to user inquiries from info@revalidate.ai.</p>
      </div>
      
      <div className="space-y-6">
        {typedTickets.length > 0 ? (
          typedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-zinc-200 shadow-sm text-center">
            <h3 className="text-lg font-black text-zinc-900 mb-2">Inbox Zero! 🎉</h3>
            <p className="text-zinc-500 font-medium">There are no open support tickets right now.</p>
          </div>
        )}
      </div>
    </div>
  )
}