import { supabaseAdmin } from '@/lib/supabase/admin';
/** Adds wallet credits atomically. Returns the new balance (null if the user doesn't exist). */
export async function addWalletCredits(userId: string, amount: number): Promise<number | null> {
  const { data, error } = await supabaseAdmin.rpc('add_wallet_credits', {
    p_user: userId,
    p_amount: amount,
  });
  if (error) throw new Error(`add_wallet_credits failed: ${error.message}`);
  return typeof data === 'number' ? data : null;
}
 
/** Takes `amount` wallet credits. Returns false if the user doesn't have enough. */
export async function spendWalletCredits(userId: string, amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  const { data, error } = await supabaseAdmin.rpc('spend_wallet_credits', {
    p_user: userId,
    p_amount: amount,
  });
  if (error) throw new Error(`spend_wallet_credits failed: ${error.message}`);
  return data === true;
}
 
/** Uses `amount` free-tier checks. Returns false if that would exceed `limit`. */
export async function spendBasicCredits(userId: string, amount: number, limit = 100): Promise<boolean> {
  if (amount <= 0) return true;
  const { data, error } = await supabaseAdmin.rpc('spend_basic_credits', {
    p_user: userId,
    p_amount: amount,
    p_limit: limit,
  });
  if (error) throw new Error(`spend_basic_credits failed: ${error.message}`);
  return data === true;
}