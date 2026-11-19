import { NextResponse } from 'next/server';

/**
 * Standard error envelope required by spec section 6:
 *   {"error": {"code": "...", "message": "..."}}
 */
export function nexusError(status: number, code: string, message: string, extraHeaders?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers: extraHeaders });
}

export const NexusErrors = {
  badRequest: (message: string) => nexusError(400, 'bad_request', message),
  unauthorized: (message = 'Bad or missing API key.') => nexusError(401, 'unauthorized', message),
  forbidden: (message = 'This key does not have the required scope.') => nexusError(403, 'forbidden', message),
  notFound: (message = 'Resource not found.') => nexusError(404, 'not_found', message),
  rateLimited: (retryAfterSeconds: number) =>
    nexusError(429, 'rate_limited', 'Too many requests.', { 'Retry-After': String(retryAfterSeconds) }),
  serverError: (message = 'Internal server error.') => nexusError(500, 'server_error', message),
};