-- Migration 0023: skip first-run personal info / couple gate
-- =============================================================================
-- New accounts should enter the app after username + password only.
-- date_of_birth stays nullable and is no longer written at signup.
-- Default role = tracker, is_solo = true so home/calendar/insights are usable
-- without role onboarding or couple linking.
-- =============================================================================

alter table public.profiles
  alter column is_solo set default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, display_name, role, is_solo)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    'tracker',
    true
  );
  return new;
end;
$function$;
