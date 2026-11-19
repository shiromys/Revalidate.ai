import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hashApiKey } from './apiKeys';
import { isSupportApiScope, type SupportApiScope } from './scopes';
import { NexusErrors, nexusError } from './errors';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Spec section 6: "allow at least 60 requests per minute for the Nexus key."
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.NEXUS_RATE_LIMIT_PER_MINUTE || '60', 10);

interface AuthContext {
  keyId: string;
  environment: 'staging' | 'production';
  scopes: SupportApiScope[];
  agent: string | null;
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/**
 * Spec section 7: "HTTPS only, with a valid certificate. No plain HTTP."
 *
 * Vercel/Next.js terminate TLS in front of the app, so the app itself
 * never sees a raw HTTP socket — but a misconfigured proxy or a direct
 * call to an internal HTTP origin would still reach this code over plain
 * HTTP without this check. `x-forwarded-proto` is the standard header set
 * by the TLS-terminating proxy; if it's present and says "http", the
 * request did not arrive over HTTPS. Skipped outside production so local
 * `next dev` (plain HTTP on localhost) keeps working.
 */
function isInsecureRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  const proto = req.headers.get('x-forwarded-proto');
  return proto !== null && proto !== 'https';
}

async function checkRateLimit(keyId: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const bucket = Math.floor(Date.now() / 60_000); // one bucket per minute
  const redisKey = `nexus:ratelimit:${keyId}:${bucket}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, 60);
  }
  if (count > RATE_LIMIT_PER_MINUTE) {
    const secondsIntoBucket = Math.floor((Date.now() % 60_000) / 1000);
    return { allowed: false, retryAfter: Math.max(1, 60 - secondsIntoBucket) };
  }
  return { allowed: true, retryAfter: 0 };
}

async function writeAuditLog(params: {
  apiKeyId: string | null;
  agent: string | null;
  method: string;
  path: string;
  statusCode: number;
  sourceIp: string | null;
}) {
  try {
    await supabaseAdmin.from('nexus_api_audit_log').insert([
      {
        api_key_id: params.apiKeyId,
        agent: params.agent,
        method: params.method,
        path: params.path,
        status_code: params.statusCode,
        source_ip: params.sourceIp,
      },
    ]);
  } catch (err) {
    // Audit logging must never take down the actual request.
    console.error('🚨 Nexus audit log write failed:', err);
  }
}

/**
 * Authenticates an /api/support/v1/* request against the nexus_api_keys table,
 * enforces the required scope, the optional per-key IP allowlist, and the
 * per-key rate limit — then runs `handler` and writes one audit-log row
 * covering the whole call (method, path, X-Nexus-Agent, final status),
 * per spec sections 2, 6 and 7.
 *
 * Pass `requiredScope: null` only for /health, which the spec requires to
 * work as a bare liveness check — it still requires a valid, non-revoked
 * key so it isn't a fully open endpoint.
 */
export async function withNexusAuth(
  req: NextRequest,
  requiredScope: SupportApiScope | null,
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const path = new URL(req.url).pathname;
  const method = req.method;
  const agent = req.headers.get('x-nexus-agent');
  const sourceIp = getClientIp(req);

  if (isInsecureRequest(req)) {
    await writeAuditLog({ apiKeyId: null, agent, method, path, statusCode: 400, sourceIp });
    return nexusError(400, 'https_required', 'This API only accepts HTTPS requests.');
  }

  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NexusErrors.unauthorized('Missing Authorization: Bearer <key> header.');
  }
  const rawKey = match[1].trim();
  const keyHash = hashApiKey(rawKey);

  const { data: keyRow, error } = await supabaseAdmin
    .from('nexus_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) {
    console.error('🚨 Nexus key lookup error:', error.message);
    return NexusErrors.serverError();
  }
  if (!keyRow) {
    await writeAuditLog({ apiKeyId: null, agent, method, path, statusCode: 401, sourceIp });
    return NexusErrors.unauthorized();
  }

  if (keyRow.allowed_ip && sourceIp && keyRow.allowed_ip !== sourceIp) {
    await writeAuditLog({ apiKeyId: keyRow.id, agent, method, path, statusCode: 403, sourceIp });
    return NexusErrors.forbidden('This key is not permitted from this IP address.');
  }

  const scopes: string[] = Array.isArray(keyRow.scopes) ? keyRow.scopes : [];
  const validScopes = scopes.filter(isSupportApiScope) as SupportApiScope[];
  if (requiredScope && !validScopes.includes(requiredScope)) {
    await writeAuditLog({ apiKeyId: keyRow.id, agent, method, path, statusCode: 403, sourceIp });
    return NexusErrors.forbidden(`This key is missing the required scope: ${requiredScope}.`);
  }

  const rateLimit = await checkRateLimit(keyRow.id);
  if (!rateLimit.allowed) {
    await writeAuditLog({ apiKeyId: keyRow.id, agent, method, path, statusCode: 429, sourceIp });
    return NexusErrors.rateLimited(rateLimit.retryAfter);
  }

  // Fire-and-forget last_used_at bump — never blocks or fails the request.
  supabaseAdmin
    .from('nexus_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(
      () => {},
      () => {}
    );

  let response: NextResponse;
  try {
    response = await handler({
      keyId: keyRow.id,
      environment: keyRow.environment,
      scopes: validScopes,
      agent,
    });
  } catch (err) {
    console.error('🚨 Nexus endpoint handler error:', err);
    await writeAuditLog({ apiKeyId: keyRow.id, agent, method, path, statusCode: 500, sourceIp });
    return NexusErrors.serverError();
  }

  await writeAuditLog({
    apiKeyId: keyRow.id,
    agent,
    method,
    path,
    statusCode: response.status,
    sourceIp,
  });

  return response;
}