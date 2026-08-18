'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logUserActivity } from '@/lib/supabase/admin'

/**
 * ZOD SCHEMAS FOR STRICT INPUT SANITIZATION
 */
const emailSchema = z.string().email("Please enter a valid email address.").trim().toLowerCase();
const passwordSchema = z.string().min(6, "Password must be at least 6 characters.");

/**
 * TASK: Disposable domain blocklist
 * Set data structure for O(1) instant checking.
 */
const BANNED_DOMAINS_SET = new Set([
  'mailinator.com', 
  'guerrillamail.com', 
  'tempmail.com', 
  '10minutemail.com',
  '10minutemail.net',
  'temp-mail.org',
  'throwawaymail.com',
  'getnada.com',
  'nada.ltd',
  'dispostable.com',
  'yopmail.com',
  'sharklasers.com',
  'maildrop.cc',
  'trashmail.com',
  'fakemail.net',
  'mohmal.com',
  'emailondeck.com',
  'tempmailaddress.com',
  'burnermail.io',
  'dropmail.me',
  'yandex.com',
  'inboxalias.com'
]);

/**
 * SIGN UP
 * Workflow: Sanitize -> Fast Domain Check -> Register -> Check Identity
 */
export async function signUp(formData: FormData) {
  // 1. Zod Sanitization & Format Validation
  const parsedEmail = emailSchema.safeParse(formData.get('email') as string);
  const parsedPassword = passwordSchema.safeParse(formData.get('password') as string);

  if (!parsedEmail.success) {
    const errMsg = parsedEmail.error?.issues?.[0]?.message || "Invalid email provided.";
    return { success: false, error: errMsg };
  }
  if (!parsedPassword.success) {
    const errMsg = parsedPassword.error?.issues?.[0]?.message || "Invalid password provided.";
    return { success: false, error: errMsg };
  }

  const email = parsedEmail.data;
  const password = parsedPassword.data;

  // 2. Instant O(1) Disposable Domain Check
  const domain = email.split('@')[1];
  if (domain) {
    const isBanned = BANNED_DOMAINS_SET.has(domain);
    if (isBanned) {
      return { success: false, error: "This email provider is not allowed. Please use a permanent service like Gmail or Outlook." };
    }
  }

  // 3. Signup with email verification
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://revalidate.ai';

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (signUpError) {
    console.error("🚨 AUTH ERROR DETAILS:", signUpError);
    return { success: false, error: "Failed to create account. Please try again." };
  }

  // 4. CHECK IF USER ALREADY EXISTS
  // Supabase returns an empty identities array if the email is already registered
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    return { success: false, error: "Account is already created. Please try to login." };
  }
  
  return { success: true };
}

/**
 * LOGIN (Unified Routing)
 */
export async function login(formData: FormData) {
  const parsedEmail = emailSchema.safeParse(formData.get('email') as string);
  const password = formData.get('password') as string;

  if (!parsedEmail.success || !password) {
    redirect('/auth/login?error=Invalid email or password.');
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ 
    email: parsedEmail.data, 
    password 
  });

  if (error) {
    console.error("🚨 LOGIN ERROR:", error.message);
    redirect('/auth/login?error=Invalid email or password.');
  }

  // Non-blocking log activity (Fire and forget)
  if (data?.user?.email) {
    void logUserActivity(data.user.id, data.user.email, 'login').catch((err) => {
      console.error("Failed to log activity:", err);
    });
  }
  
  revalidatePath('/', 'layout');
  redirect('/dashboard'); 
}

/**
 * FORGOT PASSWORD (OTP FLOW)
 */
export async function forgotPassword(formData: FormData) {
  const parsedEmail = emailSchema.safeParse(formData.get('email') as string);
  
  if (!parsedEmail.success) {
    const errMsg = parsedEmail.error?.issues?.[0]?.message || "Invalid email.";
    redirect(`/auth/forgot-password?error=${encodeURIComponent(errMsg)}`);
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://revalidate.ai';

  const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
    redirectTo: `${appUrl}/auth/verify-otp`,
  });

  if (error) {
    console.error("🚨 FORGOT PASSWORD ERROR:", error.message);
    redirect('/auth/forgot-password?error=If an account exists, a reset link has been sent.');
  }
  
  redirect(`/auth/verify-otp?email=${encodeURIComponent(parsedEmail.data)}`);
}

/**
 * UPDATE PASSWORD
 */
export async function updatePassword(formData: FormData) {
  const parsedPassword = passwordSchema.safeParse(formData.get('password') as string);
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!parsedPassword.success) {
    const errMsg = parsedPassword.error?.issues?.[0]?.message || "Invalid password.";
    redirect(`/auth/reset-password?error=${encodeURIComponent(errMsg)}`);
  }

  if (parsedPassword.data !== confirmPassword) {
    redirect('/auth/reset-password?error=Passwords do not match.');
  }

  const supabase = createClient();
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsedPassword.data,
  });

  if (updateError) {
    console.error("🚨 UPDATE PASSWORD ERROR:", updateError.message);
    redirect('/auth/reset-password?error=Failed to update password. Your session may have expired.');
  }
  
  await supabase.auth.signOut({ scope: 'global' });
  
  revalidatePath('/', 'layout');
  redirect('/auth/login?message=Security verified. Please sign in with your new password.');
}