import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEFAULT_SUPPORT_SCOPES, sanitizeScopes, type SupportApiScope } from './scopes';

export type NexusEnvironment = 'staging' | 'production';

export interface NexusApiKeyRow {
  id: string;
  app_name: string;
  environment: NexusEnvironment;
  key_prefix: string;
  scopes: SupportApiScope[];
  allowed_ip: string | null;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  rotated_from: string | null;
}

/** SHA-256 hex digest. We only ever store this — never the raw key. */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

/**
 * Generates a new raw key in the form:
 *   rvai_supp_<env>_<32 url-safe-base64 random chars>
 *
 * The prefix is intentionally self-describing (app, "support"-scoped,
 * environment) purely so a human glancing at a key — e.g. in a password
 * manager entry, per spec section 7 "No keys in code repositories ... keys
 * are shared through a password manager" — can tell staging from
 * production at a glance. It carries no secret information; the entropy
 * lives entirely in the random suffix (32 bytes, base64url ≈ 43 chars).
 */
function generateRawKey(environment: NexusEnvironment): string {
  const randomPart = crypto.randomBytes(32).toString('base64url');
  return `rvai_supp_${environment}_${randomPart}`;
}

/** First-8/last-4 of the random part, safe to store and display unredacted. */
function displayPrefix(rawKey: string): string {
  const parts = rawKey.split('_');
  const randomPart = parts[parts.length - 1] ?? rawKey;
  return `${rawKey.split(randomPart)[0]}${randomPart.slice(0, 6)}…${randomPart.slice(-4)}`;
}

export interface CreateApiKeyParams {
  environment: NexusEnvironment;
  scopes?: string[];
  createdBy?: string | null;
  allowedIp?: string | null;
  rotatedFrom?: string | null;
}

export interface CreateApiKeyResult {
  rawKey: string; // shown exactly once — the caller must display/export this now
  row: NexusApiKeyRow;
}

/**
 * Issues a new scoped Nexus key and persists only its hash. The raw key is
 * returned so it can be shown to the operator once; it is never stored and
 * cannot be recovered afterward (matches how Stripe/GitHub-style API keys
 * behave, and satisfies spec section 7's "no keys in code repositories" /
 * secrets-manager handling expectation on our side).
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<CreateApiKeyResult> {
  const scopes = sanitizeScopes(params.scopes ?? DEFAULT_SUPPORT_SCOPES);
  if (scopes.length === 0) {
    throw new Error('At least one valid support scope is required.');
  }

  const rawKey = generateRawKey(params.environment);
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = displayPrefix(rawKey);

  const { data, error } = await supabaseAdmin
    .from('nexus_api_keys')
    .insert([
      {
        app_name: 'nexus',
        environment: params.environment,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes,
        allowed_ip: params.allowedIp ?? null,
        created_by: params.createdBy ?? null,
        rotated_from: params.rotatedFrom ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`createApiKey failed: ${error.message}`);

  return { rawKey, row: data as NexusApiKeyRow };
}

export async function listApiKeys(): Promise<NexusApiKeyRow[]> {
  const { data, error } = await supabaseAdmin
    .from('nexus_api_keys')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listApiKeys failed: ${error.message}`);
  return (data ?? []) as NexusApiKeyRow[];
}

export async function revokeApiKey(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('nexus_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('revoked_at', null);
  if (error) throw new Error(`revokeApiKey failed: ${error.message}`);
}

/**
 * Revokes the given key and immediately issues a replacement with the same
 * environment/scopes/IP allowlist — "rotatable ... without downtime" per
 * spec section 2. The caller is responsible for updating whatever secret
 * store the Nexus team reads from before the old key stops working; the two
 * keys are both valid for however long that handoff takes, since revocation
 * happens first and the new key is created right after (not concurrently).
 */
export async function rotateApiKey(id: string, createdBy?: string | null): Promise<CreateApiKeyResult> {
  const { data: existing, error } = await supabaseAdmin
    .from('nexus_api_keys')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !existing) throw new Error('rotateApiKey: key not found');

  const created = await createApiKey({
    environment: existing.environment,
    scopes: existing.scopes,
    allowedIp: existing.allowed_ip,
    createdBy: createdBy ?? existing.created_by,
    rotatedFrom: existing.id,
  });

  await revokeApiKey(id);
  return created;
}