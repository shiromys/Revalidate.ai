'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createApiKey, revokeApiKey, rotateApiKey } from '@/lib/nexus/apiKeys'
import { DEFAULT_SUPPORT_SCOPES, sanitizeScopes } from '@/lib/nexus/scopes'

// Same guard used by every other /admin/* server action in this app
// (app/admin/actions.ts, app/admin/tickets/actions.ts).
async function verifyAdmin(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return null

  const { data: adminRecord } = await supabaseAdmin
    .from('admins')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle()

  return adminRecord ? user.email : null
}

const createSchema = z.object({
  environment: z.enum(['staging', 'production']),
  scopes: z.array(z.string()).optional(),
  allowedIp: z.string().trim().optional().nullable(),
})

/**
 * Issues a new Nexus support-API key. The raw key is returned to the
 * caller ONCE — it is never persisted and this action never logs it.
 * Per spec section 7 ("Staging first"): production keys can be issued
 * here, but the spec says not to hand one over until staging has passed
 * testing — that's a process step for the operator, not something this
 * action enforces.
 */
export async function createNexusApiKey(formData: FormData) {
  const adminEmail = await verifyAdmin()
  if (!adminEmail) return { success: false as const, error: 'Unauthorized access. Admins only.' }

  const rawScopes = formData.getAll('scopes').map(String)
  const parsed = createSchema.safeParse({
    environment: formData.get('environment'),
    scopes: rawScopes.length > 0 ? rawScopes : undefined,
    allowedIp: (formData.get('allowedIp') as string | null) || null,
  })
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || 'Invalid input.' }
  }

  const scopes = sanitizeScopes(parsed.data.scopes ?? DEFAULT_SUPPORT_SCOPES)
  if (scopes.length === 0) {
    return { success: false as const, error: 'Select at least one valid support scope.' }
  }

  try {
    const { rawKey, row } = await createApiKey({
      environment: parsed.data.environment,
      scopes,
      allowedIp: parsed.data.allowedIp,
      createdBy: adminEmail,
    })

    revalidatePath('/admin/api-keys')
    return { success: true as const, rawKey, keyId: row.id, prefix: row.key_prefix }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create API key.'
    console.error('🚨 createNexusApiKey error:', message)
    return { success: false as const, error: message }
  }
}

export async function revokeNexusApiKey(formData: FormData) {
  const adminEmail = await verifyAdmin()
  if (!adminEmail) return { success: false as const, error: 'Unauthorized access. Admins only.' }

  const keyId = formData.get('keyId') as string
  if (!keyId) return { success: false as const, error: 'Missing key id.' }

  try {
    await revokeApiKey(keyId)
    revalidatePath('/admin/api-keys')
    return { success: true as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to revoke API key.'
    console.error('🚨 revokeNexusApiKey error:', message)
    return { success: false as const, error: message }
  }
}

export async function rotateNexusApiKey(formData: FormData) {
  const adminEmail = await verifyAdmin()
  if (!adminEmail) return { success: false as const, error: 'Unauthorized access. Admins only.' }

  const keyId = formData.get('keyId') as string
  if (!keyId) return { success: false as const, error: 'Missing key id.' }

  try {
    const { rawKey, row } = await rotateApiKey(keyId, adminEmail)
    revalidatePath('/admin/api-keys')
    return { success: true as const, rawKey, keyId: row.id, prefix: row.key_prefix }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to rotate API key.'
    console.error('🚨 rotateNexusApiKey error:', message)
    return { success: false as const, error: message }
  }
}
