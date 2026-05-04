import { supabase } from '@/lib/supabase';

// Self-service account deletion (UU PDP Pasal 8 right to erasure).
// Calls SECURITY DEFINER RPC delete_account() which:
//   - profile.deleted_at = now() (soft delete)
//   - couple status='unlinked' kalau aktif
//   - cascade soft-delete cycles + daily_logs di couple ini
//   - delete pending invitations
//
// Hard delete = manual followup ≥30 hari (pg_cron Phase 4 polish atau admin script).
// auth.users entry tetap exists — tidak boleh di-delete dari client (butuh service_role).
export const deleteAccount = async () => {
  const { error } = await supabase.rpc('delete_account' as never);
  if (error) throw error;
};
