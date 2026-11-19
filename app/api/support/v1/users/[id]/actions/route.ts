import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { withNexusAuth } from '@/lib/nexus/auth';
import { withIdempotency } from '@/lib/nexus/idempotency';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NexusErrors } from '@/lib/nexus/errors';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  action: z.enum(['resend_verification', 'send_password_reset']),
});

/**
 * POST /api/support/v1/users/{id}/actions (optional per spec section 3)
 * "Light admin actions such as resend_verification or send_password_reset."
 *
 * Deliberately the only two actions implemented — anything that could
 * change billing, plan, or delete the account belongs to this app's own
 * admin panel, not a Nexus-scoped key (spec section 2 and section 7).
 * Uses the same Supabase auth flows as app/auth/actions.ts (forgotPassword),
 * so the resulting emails match what the app already sends.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withNexusAuth(req, 'users:write', async () => {
    return withIdempotency(req, `users/${params.id}/actions`, async () => {
      const body = await req.json().catch(() => null);
      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return NexusErrors.badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('id', params.id)
        .maybeSingle();

      if (profileError) {
        console.error('🚨 Nexus POST /users/:id/actions profile error:', profileError.message);
        return NexusErrors.serverError();
      }
      if (!profile) return NexusErrors.notFound('User not found.');

      // Uses the anon-key client (not the service-role admin client) because
      // these are the same public auth flows a logged-out user triggers
      // themselves — generateLink isn't needed, and resetPasswordForEmail /
      // resend already send the actual email via Supabase's configured
      // email provider.
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://revalidate.ai').replace(/\/$/, '');

      if (parsed.data.action === 'send_password_reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
          redirectTo: `${appUrl}/auth/verify-otp`,
        });
        if (error) {
          console.error('🚨 Nexus send_password_reset error:', error.message);
          return NexusErrors.serverError('Failed to send password reset email.');
        }
      } else {
        const { error } = await supabase.auth.resend({ type: 'signup', email: profile.email });
        if (error) {
          console.error('🚨 Nexus resend_verification error:', error.message);
          return NexusErrors.serverError('Failed to resend verification email.');
        }
      }

      return NextResponse.json({ success: true, action: parsed.data.action, user_id: profile.id });
    });
  });
}