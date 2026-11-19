/**
 * Simple keyset pagination on `created_at desc` per spec section 6:
 * "list endpoints return items, plus next_cursor when more results exist.
 * Default page size 50, maximum 100."
 *
 * The cursor is just the ISO created_at of the last row returned, base64-
 * encoded so it's an opaque token to the caller (the spec doesn't require
 * opacity, but it avoids callers depending on the cursor's internal shape).
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export function parseLimit(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : DEFAULT_PAGE_SIZE;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(n, MAX_PAGE_SIZE);
}

export function encodeCursor(createdAt: string): string {
  return Buffer.from(createdAt, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string | null): string | null {
  if (!cursor) return null;
  try {
    return Buffer.from(cursor, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}