'use client'

import { useState } from 'react'
import { deleteUserAccount } from '../actions'

export default function DeleteUserButton({ userId, email }: { userId: string, email: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    // 1. Show a warning prompt before deleting
    const confirmed = window.confirm(`Are you absolutely sure you want to permanently delete the account for ${email}? This action cannot be undone.`)
    if (!confirmed) return

    // 2. Trigger the server action
    setIsDeleting(true)
    const res = await deleteUserAccount(userId)
    setIsDeleting(false)

    if (!res.success) {
      alert(`Error deleting user: ${res.error}`)
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs font-bold text-red-500 hover:text-white px-3 py-2 bg-red-50 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  )
}