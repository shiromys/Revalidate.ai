import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

const TTL_SECONDS = 86400; // "a retried reply is never sent to the user twice" — keep for 24h, matching the results:{jobId} TTL convention used elsewhere in this codebase

interface StoredResponse {
  status: number;
  body: unknown;
}

function redisKey(idempotencyKey: string, path: string): string {
  return `nexus:idempotency:${path}:${idempotencyKey}`;
}

/**
 * Wraps a POST/PATCH handler with Idempotency-Key support (spec section 6,
 * "Safe retries"). If the same key was already used successfully for this
 * path, returns the cached response instead of re-running `handler` — e.g.
 * so a retried POST /tickets/{id}/messages never double-sends an email
 * reply to the user.
 *
 * If no Idempotency-Key header is sent, the call just runs normally with
 * no caching — the header is a safety net for retries, not a requirement.
 */
export async function withIdempotency(
  req: Request,
  path: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const idempotencyKey = req.headers.get('idempotency-key');
  if (!idempotencyKey) {
    return handler();
  }

  const key = redisKey(idempotencyKey, path);
  const cached = await redis.get<StoredResponse>(key);
  if (cached) {
    return NextResponse.json(cached.body as object, { status: cached.status });
  }

  const response = await handler();

  // Only cache successful (2xx) responses — a failed attempt should be
  // retryable with the same key, not permanently remembered as a failure.
  if (response.status >= 200 && response.status < 300) {
    const body = await response.clone().json().catch(() => null);
    await redis.set(key, { status: response.status, body }, { ex: TTL_SECONDS, nx: true });
  }

  return response;
}