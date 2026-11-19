/**
 * Scopes a Nexus (Application Nexus) API key may hold.
 *
 * Per the integration spec, section 2: the key is "scoped to support only ...
 * can read tickets, messages and basic user info, and can post replies and
 * change ticket status. It cannot delete users, change billing, change
 * plans or read passwords and payment details."
 *
 * This list is the enforcement point for that boundary: lib/nexus/auth.ts
 * rejects any scope not in SUPPORT_API_SCOPES even if it somehow ended up
 * in the database, and no endpoint under /api/support/v1 ever checks a
 * scope outside this set. There is deliberately no 'billing:*', 'users:delete'
 * or 'plans:*' scope defined anywhere in this file.
 */
export const SUPPORT_API_SCOPES = [
  'tickets:read',
  'tickets:write', // status/priority/assignee changes (PATCH /tickets/{id})
  'messages:write', // POST /tickets/{id}/messages (reply or internal note)
  'users:read', // GET /users, GET /users/{id}, GET /users/{id}/tickets, GET /users/{id}/activity
  'users:write', // POST /users/{id}/actions — resend_verification / send_password_reset ONLY
  'health:read',
] as const;

export type SupportApiScope = (typeof SUPPORT_API_SCOPES)[number];

/** The default scope set issued to a new Nexus key — everything required (section 1) plus optional endpoints. */
export const DEFAULT_SUPPORT_SCOPES: SupportApiScope[] = [
  'tickets:read',
  'tickets:write',
  'messages:write',
  'users:read',
  'health:read',
];

export function isSupportApiScope(value: string): value is SupportApiScope {
  return (SUPPORT_API_SCOPES as readonly string[]).includes(value);
}

export function sanitizeScopes(requested: string[]): SupportApiScope[] {
  const unique = new Set(requested.filter(isSupportApiScope));
  return Array.from(unique);
}