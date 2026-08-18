'use client'

import React, { useState } from 'react'
import { manageUserCredits } from '../actions'

export default function TopUpPage() {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const handleTransaction = async (actionType: 'add' | 'deduct') => {
    // Basic validation
    if (!email || !amount || amount <= 0) {
      setMessage({ text: 'Please enter a valid email and a credit amount greater than 0.', type: 'error' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    // Call the server action we just built
    const result = await manageUserCredits(email, Number(amount), actionType)

    if (result.success) {
      setMessage({ 
        text: `Success! ${actionType === 'add' ? 'Added' : 'Deducted'} ${amount} credits. New balance is ${result.newBalance}.`, 
        type: 'success' 
      })
      // Clear the amount so you don't accidentally click it twice
      setAmount('') 
    } else {
      setMessage({ text: `Error: ${result.error}`, type: 'error' })
    }

    setIsLoading(false)
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Manage Wallet Credits</h1>
        <p className="text-zinc-500 font-medium mt-1">Add or deduct verification credits from user accounts.</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
        
        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">User Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., user@example.com"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#1E3A8A] transition-colors font-medium text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Amount of Credits</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g., 500"
              min="1"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-[#1E3A8A] transition-colors font-medium text-zinc-900"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-zinc-100">
          <button 
            onClick={() => handleTransaction('add')}
            disabled={isLoading}
            className="flex-1 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : '+ Add Credits'}
          </button>
          
          <button 
            onClick={() => handleTransaction('deduct')}
            disabled={isLoading}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : '- Deduct Credits'}
          </button>
        </div>

      </div>
    </div>
  )
}