'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin, logUserActivity } from '@/lib/supabase/admin' 
import { revalidatePath } from 'next/cache'
import { validateEmailLogic } from '@/lib/email-validator'

/**
 * PROCESS VALIDATION (Day 6 Engine + Analytics Logging)
 */
export async function processEmailValidation(userId: string, email: string, mode: 'basic' | 'full') {
  const supabase = createClient()

  // 1. SECURITY CHECK
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user || user.id !== userId) {
    return { success: false, error: "Unauthorized: Invalid session." }
  }

  // 2. FETCH CURRENT PROFILE
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('wallet_credits, monthly_basic_used')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) {
    return { success: false, error: "Could not retrieve user profile." }
  }

  // 3. CREDIT DEDUCTION LOGIC
  try {
    if (mode === 'full') {
      const currentCredits = profile.wallet_credits ?? 0;
      if (currentCredits <= 0) {
        return { success: false, error: "Limit: Out of Full Credits. Please upgrade." }
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_credits: currentCredits - 1 })
        .eq('id', userId)
      if (updateError) throw updateError;
    } else {
      const currentUsed = profile.monthly_basic_used ?? 0;
      if (currentUsed >= 100) {
        return { success: false, error: "Limit: Monthly Basic Limit Reached (100/100)." }
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ monthly_basic_used: currentUsed + 1 })
        .eq('id', userId)
      if (updateError) throw updateError;
    }

    // 4. REAL VALIDATION ENGINE 
    const validationReport = await validateEmailLogic(email);

    // 5. SECURE ADMIN LOGGING
    const { error: dbError } = await supabaseAdmin
      .from('validation_results')
      .insert([
        {
          user_id: userId, 
          email: email,
          status: validationReport.isValid ? 'valid' : 'invalid',
          
          // Map checks to their respective columns (TRUE always means PASSED now)
          syntax_valid: validationReport.details.syntax,
          mx_valid: validationReport.details.mx,
          not_disposable: validationReport.details.disposable, 
          not_role_based: !validationReport.details.role, // Inverted so true = passed
          
          confidence: validationReport.score,
          smtp_valid: null 
        }
      ])

    if (dbError) {
      console.error("🚨 Admin DB Save Failed:", dbError.message)
    }

    // 6. ACTIVITY LOGGING
    if (user.email) {
      await logUserActivity(userId, user.email, 'single_email');
    }

    // 7. REVALIDATION
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/single') 
    
    return { 
      success: true, 
      data: validationReport 
    }

  } catch (dbError: unknown) {
    const errorMessage = dbError instanceof Error ? dbError.message : "Unknown error";
    console.error("Validation Process Failed:", errorMessage)
    return { success: false, error: "Process failed. Check RLS or Network." }
  }
}