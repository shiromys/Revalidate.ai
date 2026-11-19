/**
 * Maps this app's internal DB rows onto the exact field names the Nexus
 * spec requires (section 4). Extra internal fields are fine to include —
 * the spec allows "extra fields" — but the required fields below must
 * never be renamed or dropped.
 */

export interface NexusTicket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channel: 'email' | 'in_app' | 'form' | 'chat';
  user_id: string | null;
  user_email: string;
  assignee: string | null;
  created_at: string;
  updated_at: string;
  last_message_preview: string;
}

export interface NexusMessage {
  id: string;
  ticket_id: string;
  type: 'user' | 'reply' | 'note';
  author: string;
  body_text: string;
  body_html: string | null;
  attachments: { name: string; size: number; url: string }[];
  created_at: string;
}

export interface NexusUser {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  account_status: 'active' | 'suspended' | 'trial' | 'cancelled';
  created_at: string;
  last_active_at: string | null;
  admin_url: string;
}

// Row shapes as read from Supabase — kept loose (unknown-ish) because
// Supabase's JS client doesn't give us generated types in this project.
type SupportTicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  user_id: string | null;
  email: string;
  assignee: string | null;
  created_at: string;
  updated_at: string;
  message: string;
};

type SupportMessageRow = {
  id: string;
  ticket_id: string;
  type: string;
  author: string;
  body_text: string;
  body_html: string | null;
  attachments: unknown;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  wallet_credits: number | null;
  monthly_basic_used: number | null;
  is_suspended: boolean | null;
  created_at: string;
};

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.revalidate.ai').replace(/\/$/, '');
}

export function toNexusTicket(row: SupportTicketRow, lastMessagePreview: string): NexusTicket {
  return {
    id: row.id,
    subject: row.subject,
    status: (row.status as NexusTicket['status']) ?? 'open',
    priority: (row.priority as NexusTicket['priority']) ?? 'normal',
    channel: (row.channel as NexusTicket['channel']) ?? 'form',
    user_id: row.user_id,
    user_email: row.email,
    assignee: row.assignee,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_preview: lastMessagePreview.slice(0, 200),
  };
}

export function toNexusMessage(row: SupportMessageRow): NexusMessage {
  const attachments = Array.isArray(row.attachments) ? (row.attachments as NexusMessage['attachments']) : [];
  return {
    id: row.id,
    ticket_id: row.ticket_id,
    type: row.type as NexusMessage['type'],
    author: row.author,
    body_text: row.body_text,
    body_html: row.body_html,
    attachments,
    created_at: row.created_at,
  };
}

/**
 * Revalidate.ai has no subscription tiers today — billing is pay-as-you-go
 * wallet credits plus a monthly free allowance (see lib/credits.ts). There
 * is no "plan" column to read, so this derives a label the spec's `plan`
 * field can hold without inventing a tier system that doesn't exist here.
 * `hasPurchased` should be true if the user has at least one completed
 * Stripe transaction (see users/[id]/route.ts, which looks this up).
 */
export function derivePlanLabel(hasPurchased: boolean): string {
  return hasPurchased ? 'Pay-as-you-go (credits purchased)' : 'Free tier';
}

export function toNexusUser(
  row: ProfileRow,
  opts: { lastActiveAt: string | null; hasPurchased: boolean }
): NexusUser {
  return {
    id: row.id,
    name: null, // not collected at signup in this app
    email: row.email,
    plan: derivePlanLabel(opts.hasPurchased),
    account_status: row.is_suspended ? 'suspended' : 'active',
    created_at: row.created_at,
    last_active_at: opts.lastActiveAt,
    admin_url: `${getAppUrl()}/admin/users?search=${encodeURIComponent(row.email)}`,
  };
}