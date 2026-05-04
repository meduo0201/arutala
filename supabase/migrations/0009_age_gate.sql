-- Migration 0009: age-gate field di profiles (Phase 4 Track A5)
-- =============================================================================
-- Per UU PDP Pasal 25: pemrosesan data pribadi anak (<18 tahun) butuh
-- persetujuan orang tua/wali. Untuk Arutala (period tracker untuk pasangan),
-- audience adalah dewasa, jadi block signup <18.
--
-- Trade-off:
--   - Add `date_of_birth` ke profiles → adds data field yang perlu proteksi.
--   - Vs not storing → bisa di-verify hanya saat signup tanpa audit trail.
-- Pilih: store full date_of_birth nullable. Existing rows keep null;
--   new signups required to provide it.
--
-- Validation:
--   - DB-side CHECK tidak bisa reference current_date dynamic — skip.
--   - App-side zod validate ≥18 di signup form.
--   - Audit trail: created_at - date_of_birth ≥ 18yr can be checked offline.
-- =============================================================================

-- Add nullable column (existing rows get NULL — backwards compatible).
alter table public.profiles
  add column if not exists date_of_birth date;

-- Update handle_new_user trigger function to pull date_of_birth dari
-- raw_user_meta_data (di-set oleh signup form via supabase.auth.signUp data{}).
-- Plus add `set search_path = ''` per audit F-002.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_dob date;
  v_dob_text text;
begin
  v_dob_text := new.raw_user_meta_data->>'date_of_birth';
  if v_dob_text is not null and v_dob_text <> '' then
    begin
      v_dob := v_dob_text::date;
    exception when others then
      v_dob := null;
    end;
  end if;

  insert into public.profiles (id, display_name, date_of_birth)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    v_dob
  );
  return new;
end;
$function$;
