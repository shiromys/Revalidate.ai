import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; 
import { supabaseAdmin } from '@/lib/supabase/admin';
import AdminSidebar from './AdminSidebar'; // <-- Import the new beautiful sidebar!

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) redirect('/auth/login');

  // SECURITY GUARD
  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle();

  if (!adminRecord) redirect('/dashboard'); 

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans selection:bg-red-200 selection:text-red-900">
      
      {/* We pass the live user email into the Client Component Sidebar */}
      <AdminSidebar email={user.email} />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
    </div>
  );
}