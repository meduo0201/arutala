-- Migration 0014: pg_cron config update (Phase 4 Track C5 follow-up)
-- =============================================================================
-- Migration 0013 used `current_setting('app.send_push_url')` + `app.service_role_key`
-- via `alter database postgres set ...`. Supabase Mgmt API role tidak punya
-- privilege ALTER DATABASE → use Vault (`supabase_vault` extension) instead.
--
-- Pattern (per Supabase docs):
--   1. Insert secret ke vault.secrets (encrypted at rest)
--   2. Function reads via vault.decrypted_secrets view
--   3. Service role key tidak ke-expose ke logs / pg_db_role_setting
--
-- URL hardcoded — bukan secret (project URL public info).
-- =============================================================================

-- Recreate schedule_period_reminders untuk read dari vault (bukan current_setting)
create or replace function public.schedule_period_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_couple record;
  -- TODO: replace <YOUR_PROJECT_REF> with your Supabase project ref or read
  --       from a vault secret (preferred). Hardcoded for clarity here.
  v_func_url text := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-push';
  v_service_key text;
  v_payload jsonb;
begin
  -- Read service role key from vault (encrypted secret)
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if v_service_key is null then
    raise notice 'service_role_key not found in vault. Insert via:';
    raise notice '  select vault.create_secret(''<JWT>'', ''service_role_key'');';
    return;
  end if;

  for v_couple in
    select couple_id from public.predicted_next_starts()
    where predicted_start = current_date + interval '1 day'
  loop
    v_payload := jsonb_build_object(
      'couple_id', v_couple.couple_id,
      'title', 'Arutala 💚',
      'body', 'Haid berikutnya besok ya~ Siapin pads/cup-mu',
      'url', '/',
      'tag', 'period-reminder'
    );

    perform net.http_post(
      url := v_func_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := v_payload
    );
  end loop;
end;
$function$;

revoke execute on function public.schedule_period_reminders() from public, anon, authenticated;
