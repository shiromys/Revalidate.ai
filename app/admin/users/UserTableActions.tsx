'use client';

import React, { useState, useTransition } from 'react';
import { Trash2, ShieldCheck, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { deleteAndBanUser, promoteUserToAdmin } from '../actions';

interface ActionProps {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export default function UserTableActions({ userId, email, isAdmin }: ActionProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleDeleteExecution = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('email', email);
      await deleteAndBanUser(formData);
      setShowDeleteModal(false);
    });
  };

  const handleAdminPromotion = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('email', email);
      await promoteUserToAdmin(formData);
      setShowAdminModal(false);
    });
  };

  return (
    <div className="relative inline-flex items-center justify-end gap-2 text-left">
      {/* 1. Promote to Admin Button */}
      {!isAdmin && (
        <button 
          onClick={() => setShowAdminModal(true)}
          className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-zinc-200 shadow-sm"
        >
          <ShieldCheck size={14} /> Make Admin
        </button>
      )}

      {/* 2. Deletion Action Button */}
      <button 
        onClick={() => setShowDeleteModal(true)}
        className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 size={14} /> Delete
      </button>

      {/* --- CONFIRM DELETION MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={18} /> Confirm User Deletion
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Are you sure you want to permanently delete and ban <span className="font-bold text-zinc-900 break-all">&quot;{email}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                disabled={isPending}
                className="px-4 py-2 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 font-bold rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteExecution}
                disabled={isPending}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? 'Processing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PROMOTE TO ADMIN MODAL --- */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ShieldAlert className="text-[#8B0000]" size={18} /> Elevate Access Level
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm font-medium text-zinc-500 leading-relaxed">
              Are you sure you want to make <span className="font-bold text-zinc-900 break-all">&quot;{email}&quot;</span> an admin?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowAdminModal(false)} 
                disabled={isPending}
                className="px-4 py-2 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 font-bold rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdminPromotion}
                disabled={isPending}
                className="px-4 py-2 text-white bg-[#8B0000] hover:bg-[#6A0000] font-bold rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isPending ? 'Elevating...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}