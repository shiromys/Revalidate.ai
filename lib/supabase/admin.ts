import { createClient } from '@supabase/supabase-js'

// WARNING: NEVER import this file into a Client Component ('use client')
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * HELPER: Log User Activity
 * Uses supabaseAdmin to ensure logs are ALWAYS written, 
 * even if the user's standard session is missing or being destroyed.
 */
export async function logUserActivity(
  userId: string, 
  email: string, 
  activity: 'login' | 'logout' | 'single_email' | 'bulk_email'
) {
  try {
    const { error } = await supabaseAdmin.from('user_activities').insert({
      user_id: userId,
      email: email,
      activity: activity,
    });

    if (error) {
      console.error("🚨 Supabase Error inserting activity:", error.message);
    }
  } catch (error) {
    console.error("🚨 Failed to log activity:", error);
  }
}