'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar({ email }: { email: string }) {
    const pathname = usePathname();

    // Default unread tickets to 0 so no badge shows initially
    const [unreadTickets, setUnreadTickets] = useState<number>(0);

    // Fetch actual unread tickets count on mount and poll every 10 seconds
    useEffect(() => {
        const fetchUnreadTickets = async () => {
            try {
                const res = await fetch('/api/admin/tickets/unread-count', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setUnreadTickets(data.unreadCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch unread tickets:", error);
            }
        };

        fetchUnreadTickets(); // Initial check
        const interval = setInterval(fetchUnreadTickets, 10000); // Poll live every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const navLinks = [
        { name: 'Revenue and Analytics', href: '/admin/analytics' },
        { name: 'Validation Report', href: '/admin' },
        { name: 'User Management', href: '/admin/users' },
        { name: 'Top Up Credits', href: '/admin/topup' },
        { name: 'Support Tickets', href: '/admin/tickets', badge: unreadTickets },
        { name: 'System Health', href: '/admin/health' }, 
    ];

    return (
        <aside className="w-64 bg-white border-r border-zinc-200 flex-col hidden md:flex h-screen sticky top-0 font-sans">
            
            <div className="p-6 border-b border-zinc-100">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900">Admin Panel</h1>
                <p className="text-sm font-medium text-zinc-500 mt-1 truncate">{email}</p>
            </div>
            
            <div className="flex-1 py-6 space-y-2 overflow-y-auto">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    
                    return (
                        <Link 
                            key={link.name} 
                            href={link.href} 
                            className="block px-4"
                        >
                            <div className={`px-4 py-3.5 rounded-r-lg font-bold text-base transition-all duration-200 flex items-center justify-between ${
                                isActive 
                                ? 'bg-red-50 text-red-600 border-l-[3px] border-red-600' 
                                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border-l-[3px] border-transparent'
                            }`}>
                                <span>{link.name}</span>

                                {/* BADGE ONLY APPEARS WHEN UNREAD TICKETS > 0 */}
                                {link.badge !== undefined && link.badge > 0 && (
                                    <span className="min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-xs font-black flex items-center justify-center rounded-full shadow-sm animate-in fade-in zoom-in">
                                        {link.badge}
                                    </span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>

            <div className="p-6 border-t border-zinc-100 bg-white">
                <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 py-3 border border-red-600 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-colors">
                    Exit Dashboard
                </Link>
            </div>
        </aside>
    );
}