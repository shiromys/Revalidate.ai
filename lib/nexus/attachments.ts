import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Spec section 7: "Attachments: links must be signed and expire within 15 minutes."
 *
 * This app does not currently let a user or admin attach a file to a
 * support ticket — the contact form and the admin reply box are text
 * only, so `support_messages.attachments` is always `[]` today (see
 * lib/nexus/mappers.ts toNexusMessage). There is therefore nothing
 * insecure to fix yet: an empty attachments array trivially satisfies
 * "signed and expire within 15 minutes" because no unsigned link exists.
 *
 * This helper exists so that the moment ticket attachments ARE added
 * (e.g. a file upload on the contact form, or an admin attaching a
 * screenshot to a reply), there is exactly one, already-correct way to
 * turn a stored file into the `url` field in the Message shape — nobody
 * has to remember the 15-minute rule, because it's hardcoded here rather
 * than left to whoever builds that feature later.
 *
 * Usage once attachments exist (e.g. a 'ticket-attachments' Supabase
 * Storage bucket):
 *   const url = await createSignedAttachmentUrl('ticket-attachments', storagePath);
 */
const ATTACHMENT_URL_TTL_SECONDS = 15 * 60; // hard-coded to the spec's 15-minute ceiling — do not raise this

export async function createSignedAttachmentUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, ATTACHMENT_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed attachment URL: ${error?.message ?? 'unknown error'}`);
  }
  return data.signedUrl;
}