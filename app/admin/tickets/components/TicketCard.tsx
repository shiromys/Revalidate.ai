'use client'

import React, { useState } from 'react'
import { replyToTicket, closeTicket } from '../actions'
import { Mail, CheckCircle, XCircle, Send } from 'lucide-react'

export type Ticket = {
  id: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim()) return alert("Please enter a message.")
    
    setIsSubmitting(true)
    const result = await replyToTicket(ticket.id, ticket.email, ticket.subject, replyText)
    setIsSubmitting(false)

    if (result.success) {
      setIsReplying(false)
      setReplyText('')
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleCloseOnly = async () => {
    const confirmed = window.confirm("Are you sure you want to close this ticket without replying?")
    if (!confirmed) return

    setIsSubmitting(true)
    const result = await closeTicket(ticket.id)
    setIsSubmitting(false)

    if (!result.success) alert(`Error: ${result.error}`)
  }

  const isOpen = ticket.status === 'open'

  return (
    <div className={`bg-white rounded-2xl border ${isOpen ? 'border-[#1E3A8A]/20 shadow-md' : 'border-zinc-200 shadow-sm opacity-75'} overflow-hidden transition-all`}>
      <div className={`p-6 border-b ${isOpen ? 'bg-blue-50/50 border-blue-100' : 'bg-zinc-50 border-zinc-100'} flex justify-between items-start gap-4`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-black text-lg text-zinc-900">{ticket.subject}</h3>
            {isOpen ? (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase tracking-wider rounded-full">Needs Reply</span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                <CheckCircle size={12}/> Closed
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-zinc-500 flex items-center gap-2">
            <Mail size={14} /> {ticket.email}
          </p>
        </div>
        <p className="text-xs font-bold text-zinc-400">
          {new Date(ticket.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="p-6">
        <p className="text-zinc-700 font-medium whitespace-pre-wrap">{ticket.message}</p>
      </div>

      {isOpen && (
        <div className="p-6 pt-0">
          {!isReplying ? (
            <div className="flex gap-3 mt-4">
              <button onClick={() => setIsReplying(true)} className="bg-[#1E3A8A] hover:bg-blue-900 text-white text-sm font-bold py-2 px-6 rounded-xl transition-colors flex items-center gap-2">
                <Send size={16} /> Reply to User
              </button>
              <button onClick={handleCloseOnly} disabled={isSubmitting} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2">
                <XCircle size={16} /> Close Ticket
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <textarea 
                value={replyText} onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your email reply here..." rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl outline-none focus:border-[#1E3A8A] transition-colors font-medium text-zinc-900"
              />
              <div className="flex gap-3">
                <button onClick={handleReply} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Sending...' : 'Send Email & Close'}
                </button>
                <button onClick={() => setIsReplying(false)} disabled={isSubmitting} className="text-zinc-500 hover:text-zinc-700 text-sm font-bold py-2 px-4 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}