import { LogOut, LayoutDashboard, Layers, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen">
      <div className="p-6 text-xl font-black tracking-tighter text-[#1E3A8A]">REVALIDATE.AI</div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {/* Main Dashboard Link */}
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm bg-[#1E3A8A] text-white">
          <LayoutDashboard size={18}/> Dashboard
        </Link>

        {/* Updated Links to match explicit folder structure */}
        <Link href="/dashboard/bulk" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition">
          <Layers size={18}/> Bulk Upload
        </Link>
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition">
          <Settings size={18}/> Settings
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-100">
        {/* RECTIFIED: Action now includes /auth/ because you removed the parentheses () */}
        <form action="/auth/signout" method="post">
          <button 
            type="submit" 
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={18} /> 
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}