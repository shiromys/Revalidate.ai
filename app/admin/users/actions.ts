'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function deleteAndBanUser(formData: FormData) {
    const userId = formData.get('userId') as string;
    const email = formData.get('email') as string;

    if (!userId || !email) return;

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    try {
        // 1. Delete from public profiles (Ensures they immediately disappear from your dashboard)
        await adminSupabase.from('profiles').delete().eq('id', userId);

        // 2. Delete user from Supabase Auth (This force-logs them out and destroys their login credentials)
        await adminSupabase.auth.admin.deleteUser(userId);

        // 3. Add their email to the banned list so they can never sign up again
        await adminSupabase.from('banned_emails').insert([{ email }]);

        // 4. Tell Next.js to instantly refresh the table UI
        revalidatePath('/admin/users');
        
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}