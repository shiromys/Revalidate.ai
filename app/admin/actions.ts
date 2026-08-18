'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// --- ZOD SCHEMAS FOR INPUT SANITIZATION ---
const emailSchema = z.string().email("Invalid email format").trim().toLowerCase()
const amountSchema = z.number().min(0, "Amount cannot be negative")
const userIdSchema = z.string().min(5, "Invalid User ID format")

/**
 * SECURITY GUARD: Double-checks that the person calling this function 
 * is actually in the 'admins' table before running any deletes.
 */
async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return false
  
  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle()
    
  return !!adminRecord
}

/**
 * ACTION: Completely delete a user account
 */
export async function deleteUserAccount(userId: string) {
  try {
    // 1. Zod Sanitization
    const parsedId = userIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid input" }
    }

    // 2. Auth Check (Already perfectly implemented!)
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { success: false, error: "Unauthorized access. Admins only." }

    // 3. Delete the user's profile first to prevent database reference errors
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', parsedId.data)
    if (profileError) {
      console.error("🚨 DB Delete Profile Error:", profileError)
      return { success: false, error: "Failed to delete user profile due to a system error." }
    }

    // 4. Delete the user entirely from the Supabase Authentication system
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(parsedId.data)
    if (authError) {
      console.error("🚨 DB Auth Delete Error:", authError)
      return { success: false, error: "Failed to delete authentication record due to a system error." }
    }

    // 5. Refresh the admin page to show the updated list
    revalidatePath('/admin')
    revalidatePath('/admin/users')
    return { success: true }
    
  } catch (error) { 
    // Generic fallback error (No stack traces leak!)
    console.error("🚨 Fatal Admin Action Error:", error)
    return { success: false, error: "An unexpected error occurred while deleting the user." }
  }
}

/**
 * ACTION: Add or Deduct Credits from a specific user by email
 */
export async function manageUserCredits(email: string, amount: number, actionType: 'add' | 'deduct') {
  try { 
    // 1. Zod Sanitization
    const parsedEmail = emailSchema.safeParse(email);
    const parsedAmount = amountSchema.safeParse(amount);
    
    if (!parsedEmail.success) return { success: false, error: parsedEmail.error.issues[0]?.message };
    if (!parsedAmount.success) return { success: false, error: parsedAmount.error.issues[0]?.message };

    // 2. Auth Check
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { success: false, error: "Unauthorized access. Admins only." }

    // 3. Find the user's profile using their sanitized email
    const { data: userProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, wallet_credits')
      .ilike('email', parsedEmail.data)
      .maybeSingle()

    if (fetchError) {
      console.error("🚨 DB Fetch Error:", fetchError)
      return { success: false, error: "System error while locating user profile." }
    }
    if (!userProfile) {
      return { success: false, error: "Could not find a user with that email address." }
    }

    // 4. Calculate the new balance 
    const currentBalance = userProfile.wallet_credits || 0
    let newBalance = currentBalance
    const safeAmount = parsedAmount.data;

    if (actionType === 'add') {
      newBalance += safeAmount
    } else if (actionType === 'deduct') {
      newBalance -= safeAmount
      // Prevent balances from dropping below 0
      if (newBalance < 0) newBalance = 0 
    }

    // 5. Update the database with the new balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ wallet_credits: newBalance })
      .eq('id', userProfile.id) 

    if (updateError) {
      console.error("🚨 DB Update Error:", updateError)
      return { success: false, error: "Failed to update credits due to a system error." }
    }

    // 6. Refresh the data so the UI updates automatically
    revalidatePath('/admin')
    revalidatePath('/admin/topup')
    
    return { success: true, newBalance }
  } catch (error) {
    console.error("🚨 Fatal Credit Management Error:", error)
    return { success: false, error: "An unexpected error occurred while managing credits." }
  }
}

/**
 * ACTION: Form-action wrapper for deleting and banning a user
 * Connects the Client Component Modal to your secure deletion logic
 */
export async function deleteAndBanUser(formData: FormData) {
  const userId = formData.get('userId') as string;
  
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  // Reuse the existing secure delete function
  const result = await deleteUserAccount(userId);
  
  return result;
}

/**
 * ACTION: Elevate a regular user to Admin status
 * Connects the Client Component Modal to the database profile table
 */
export async function promoteUserToAdmin(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // 1. Zod Sanitization
    const parsedId = userIdSchema.safeParse(userId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid input" }
    }

    // 2. Auth Check
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return { success: false, error: "Unauthorized access. Admins only." };
    }

    // 3. Update the user's profile to elevate them to admin status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', parsedId.data);

    if (updateError) {
      console.error("🚨 DB Update Admin Status Error:", updateError);
      return { success: false, error: "Failed to elevate user to admin." };
    }

    // 4. Refresh the page data instantly
    revalidatePath('/admin/users');
    return { success: true };

  } catch (error) {
    console.error("🚨 Fatal Admin Promotion Error:", error);
    return { success: false, error: "An unexpected error occurred while promoting the user." };
  }
}