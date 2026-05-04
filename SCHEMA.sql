-- ============================================================================
-- Arutala schema — Supabase Postgres
-- Apply with: supabase db push (after pnpm supabase init)
-- Or: paste in Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES (extends auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role_label text check (role_label in ('tracker','partner')) default 'tracker',
  avatar_emoji text default '😊',
  timezone text default 'Asia/Jakarta',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- COUPLES (2-user partnership)
-- ============================================================================
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('pending','active','unlinked')) default 'pending',
  created_at timestamptz default now(),
  activated_at timestamptz,
  check (user_a_id <> user_b_id),
  unique(user_a_id, user_b_id)
);

create index idx_couples_user_a on public.couples(user_a_id);
create index idx_couples_user_b on public.couples(user_b_id);

-- ============================================================================
-- INVITATIONS (couple linking via 6-char code)
-- ============================================================================
create table public.invitations (
  code text primary key,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index idx_invitations_inviter on public.invitations(inviter_id);

-- Generate 6-char alphanumeric code (no ambiguous chars: 0/O, 1/I/L)
create or replace function public.generate_invitation_code()
returns text language plpgsql as $$
declare
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
  end loop;
  return code;
end;
$$;

-- Atomic RPC: create couple + invitation
create or replace function public.create_invitation()
returns text language plpgsql security definer as $$
declare
  v_couple_id uuid;
  v_code text;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- prevent duplicate pending couple
  if exists (
    select 1 from public.couples
    where user_a_id = v_user_id and status = 'pending'
  ) then
    raise exception 'Sudah ada invitation aktif. Cancel dulu sebelum bikin baru.';
  end if;

  insert into public.couples (user_a_id, status)
  values (v_user_id, 'pending')
  returning id into v_couple_id;

  -- retry generate code on collision
  loop
    v_code := public.generate_invitation_code();
    begin
      insert into public.invitations (code, inviter_id, couple_id)
      values (v_code, v_user_id, v_couple_id);
      exit;
    exception when unique_violation then
      -- retry
    end;
  end loop;

  return v_code;
end;
$$;

-- Atomic RPC: accept invitation (split error messages untuk user feedback jelas)
create or replace function public.accept_invitation(p_code text)
returns uuid language plpgsql security definer as $$
declare
  v_invitation public.invitations%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invitation from public.invitations where code = p_code;

  if not found then
    raise exception 'Code tidak ditemukan. Cek lagi penulisannya.';
  end if;

  if v_invitation.accepted_at is not null then
    raise exception 'Code sudah pernah dipakai.';
  end if;

  if v_invitation.expires_at <= now() then
    raise exception 'Code sudah expired (>7 hari). Minta pasangan bikin code baru.';
  end if;

  if v_invitation.inviter_id = v_user_id then
    raise exception 'Tidak bisa accept invitation sendiri.';
  end if;

  update public.couples
    set user_b_id = v_user_id,
        status = 'active',
        activated_at = now()
    where id = v_invitation.couple_id;

  update public.invitations
    set accepted_at = now(),
        accepted_by = v_user_id
    where code = p_code;

  return v_invitation.couple_id;
end;
$$;

-- Cancel pending couple+invitation owned by current user (cascade delete).
-- Dipake kalau user mau bikin code baru atau abandon flow.
create or replace function public.cancel_invitation()
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Pending couples solely owned by user_a_id (inviter). ON DELETE CASCADE
  -- pada invitations.couple_id auto-cleanup invitation row.
  delete from public.couples
  where user_a_id = v_user_id
    and status = 'pending';
end;
$$;

-- Helper: get current user's active couple
create or replace function public.current_couple_id()
returns uuid language sql stable security definer as $$
  select id from public.couples
  where (user_a_id = (select auth.uid()) or user_b_id = (select auth.uid()))
    and status = 'active'
  limit 1;
$$;

-- ============================================================================
-- CYCLES
-- ============================================================================
create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  start_date date not null,
  end_date date,
  cycle_length int,
  predicted_next_start date,
  predicted_ovulation date,
  predicted_fertile_start date,
  predicted_fertile_end date,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  check (end_date is null or end_date >= start_date)
);

create index idx_cycles_couple_date on public.cycles(couple_id, start_date desc)
  where deleted_at is null;

-- ============================================================================
-- DAILY LOGS
-- ============================================================================
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  cycle_id uuid references public.cycles(id) on delete set null,
  log_date date not null,
  flow_intensity smallint check (flow_intensity between 0 and 4),
  symptoms text[] default '{}',
  moods text[] default '{}',
  notes text,
  -- Phase 4 E2EE: encrypted_payload TEXT (base64) berisi JSON terenkripsi
  encrypted_payload text,
  bbt numeric(4,2),
  weight numeric(5,2),
  sleep_hours numeric(3,1),
  water_intake_ml int,
  logged_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(couple_id, log_date)
);

create index idx_logs_couple_date on public.daily_logs(couple_id, log_date desc)
  where deleted_at is null;
create index idx_logs_symptoms_gin on public.daily_logs using gin(symptoms);
create index idx_logs_moods_gin on public.daily_logs using gin(moods);

-- ============================================================================
-- CATALOGS
-- ============================================================================
create table public.symptom_catalog (
  key text primary key,
  label_id text not null,
  label_en text not null,
  emoji text,
  category text check (category in ('physical','digestive','skin','energy','other')) default 'physical',
  display_order int default 0
);

create table public.mood_catalog (
  key text primary key,
  label_id text not null,
  label_en text not null,
  emoji text not null,
  valence smallint check (valence between -2 and 2) default 0,
  display_order int default 0
);

-- ============================================================================
-- SEED DATA
-- ============================================================================
insert into public.symptom_catalog (key, label_id, label_en, emoji, category, display_order) values
  ('cramps', 'Kram perut', 'Cramps', '😣', 'physical', 1),
  ('headache', 'Sakit kepala', 'Headache', '🤕', 'physical', 2),
  ('back_pain', 'Sakit punggung', 'Back pain', '🦴', 'physical', 3),
  ('breast_tenderness', 'Nyeri payudara', 'Breast tenderness', '💢', 'physical', 4),
  ('bloating', 'Kembung', 'Bloating', '🎈', 'digestive', 5),
  ('nausea', 'Mual', 'Nausea', '🤢', 'digestive', 6),
  ('diarrhea', 'Diare', 'Diarrhea', '💩', 'digestive', 7),
  ('constipation', 'Sembelit', 'Constipation', '🚫', 'digestive', 8),
  ('acne', 'Jerawat', 'Acne', '🔴', 'skin', 9),
  ('oily_skin', 'Kulit berminyak', 'Oily skin', '✨', 'skin', 10),
  ('fatigue', 'Lelah', 'Fatigue', '😴', 'energy', 11),
  ('insomnia', 'Susah tidur', 'Insomnia', '🌙', 'energy', 12),
  ('food_cravings', 'Ngidam', 'Food cravings', '🍫', 'other', 13),
  ('low_libido', 'Libido rendah', 'Low libido', '💤', 'other', 14),
  ('high_libido', 'Libido tinggi', 'High libido', '💖', 'other', 15);

insert into public.mood_catalog (key, label_id, label_en, emoji, valence, display_order) values
  ('happy', 'Senang', 'Happy', '😊', 2, 1),
  ('calm', 'Tenang', 'Calm', '😌', 1, 2),
  ('energetic', 'Bersemangat', 'Energetic', '⚡', 1, 3),
  ('tired', 'Capek', 'Tired', '😪', -1, 4),
  ('sad', 'Sedih', 'Sad', '😢', -2, 5),
  ('anxious', 'Cemas', 'Anxious', '😰', -1, 6),
  ('irritable', 'Mudah marah', 'Irritable', '😤', -1, 7),
  ('emotional', 'Emosional', 'Emotional', '🥺', -1, 8),
  ('confident', 'Pede', 'Confident', '😎', 2, 9),
  ('overwhelmed', 'Kewalahan', 'Overwhelmed', '🤯', -2, 10);

-- ============================================================================
-- updated_at AUTO TRIGGER
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_cycles_updated_at before update on public.cycles
  for each row execute function public.set_updated_at();
create trigger trg_logs_updated_at before update on public.daily_logs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- profiles
alter table public.profiles enable row level security;

create policy "Users see own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "Users see partner profile" on public.profiles
  for select to authenticated
  using (id in (
    select case
      when user_a_id = (select auth.uid()) then user_b_id
      else user_a_id
    end
    from public.couples
    where (user_a_id = (select auth.uid()) or user_b_id = (select auth.uid()))
      and status = 'active'
  ));

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- couples
alter table public.couples enable row level security;

create policy "Members read own couple" on public.couples
  for select to authenticated
  using (user_a_id = (select auth.uid()) or user_b_id = (select auth.uid()));

create policy "Members update own couple" on public.couples
  for update to authenticated
  using (user_a_id = (select auth.uid()) or user_b_id = (select auth.uid()));

-- invitations (read-only via RLS; mutate via SECURITY DEFINER RPC)
alter table public.invitations enable row level security;

create policy "Inviter reads own invitations" on public.invitations
  for select to authenticated
  using (inviter_id = (select auth.uid()));

-- cycles
alter table public.cycles enable row level security;

create policy "Couple members read cycles" on public.cycles
  for select to authenticated
  using (couple_id = public.current_couple_id() and deleted_at is null);

create policy "Couple members insert cycles" on public.cycles
  for insert to authenticated
  with check (
    couple_id = public.current_couple_id()
    and created_by = (select auth.uid())
  );

create policy "Couple members update cycles" on public.cycles
  for update to authenticated
  using (couple_id = public.current_couple_id());

create policy "Couple members delete cycles" on public.cycles
  for delete to authenticated
  using (couple_id = public.current_couple_id());

-- daily_logs
alter table public.daily_logs enable row level security;

create policy "Couple members read logs" on public.daily_logs
  for select to authenticated
  using (couple_id = public.current_couple_id() and deleted_at is null);

create policy "Couple members insert logs" on public.daily_logs
  for insert to authenticated
  with check (
    couple_id = public.current_couple_id()
    and logged_by = (select auth.uid())
  );

create policy "Couple members update logs" on public.daily_logs
  for update to authenticated
  using (couple_id = public.current_couple_id());

create policy "Couple members delete logs" on public.daily_logs
  for delete to authenticated
  using (couple_id = public.current_couple_id());

-- catalogs (read-only for all authenticated)
alter table public.symptom_catalog enable row level security;
alter table public.mood_catalog enable row level security;

create policy "Authenticated read symptoms" on public.symptom_catalog
  for select to authenticated using (true);

create policy "Authenticated read moods" on public.mood_catalog
  for select to authenticated using (true);

-- ============================================================================
-- ROLE GRANTS (required when "Automatically expose new tables" is OFF)
-- ============================================================================
-- RLS policies gate per-row, tapi PostgREST cek role-level GRANT dulu sebelum
-- RLS jalan. Tanpa GRANT eksplisit, semua query → 403 "permission denied".
grant usage on schema public to authenticated;
grant usage on schema public to anon;

grant select, update on public.profiles to authenticated;
grant select, update on public.couples to authenticated;
grant select on public.invitations to authenticated;
grant select, insert, update, delete on public.cycles to authenticated;
grant select, insert, update, delete on public.daily_logs to authenticated;
grant select on public.symptom_catalog to authenticated;
grant select on public.mood_catalog to authenticated;

grant execute on function public.create_invitation() to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.cancel_invitation() to authenticated;
grant execute on function public.current_couple_id() to authenticated;

-- ============================================================================
-- REALTIME PUBLICATIONS
-- ============================================================================
alter publication supabase_realtime add table public.cycles;
alter publication supabase_realtime add table public.daily_logs;
