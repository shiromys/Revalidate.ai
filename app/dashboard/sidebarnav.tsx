'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarNavProps {
  isAdmin: boolean;
}

export default function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname();

  // Rest API and Settings have been removed from this array
  // Added Profile to the very top of the list
  const links = [
    { name: 'Profile', href: '/dashboard/profile' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Single Verification', href: '/dashboard/single' },
    { name: 'Bulk Verification', href: '/dashboard/bulk' },
    { name: 'List Cleaning', href: '/dashboard/sorting' },
  ];

  return (
    <nav className="flex-1 space-y-1 mt-6 flex flex-col w-full">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            // Increased text size to text-base and matched text weights to Admin layout
            className={`w-full text-left pl-8 pr-4 py-3.5 font-bold text-base transition-all duration-200 border-l-4 ${
              isActive
                ? 'border-red-600 bg-red-50 text-red-600'
                : 'border-transparent text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50/60'
            }`}
          >
            {link.name}
          </Link>
        );
      })}

      {/* CONDITIONAL ADMIN PANEL LINK */}
      {isAdmin && (
        <div className="mt-auto pt-6 pb-2 px-6 w-full">
          <Link
            href="/admin"
            className="block text-center w-full px-4 py-3 rounded-xl font-bold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm"
          >
            Admin Panel
          </Link>
        </div>
      )}
    </nav>
  );
}