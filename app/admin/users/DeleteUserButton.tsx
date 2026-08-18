'use client';

import { Trash2 } from 'lucide-react';

export default function DeleteUserButton({ email }: { email: string }) {
    return (
        <button 
            type="submit"
            onClick={(e) => {
                if(!window.confirm(`Are you sure you want to permanently delete and ban ${email}? This cannot be undone.`)) {
                    e.preventDefault();
                }
            }}
            title="Delete & Ban User"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 transition-colors rounded-xl shadow-sm"
        >
            <Trash2 size={14} /> Delete
        </button>
    );
}