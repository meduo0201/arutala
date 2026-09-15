import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readMigration = (name: string): string =>
  readFileSync(resolve(process.cwd(), 'supabase/migrations', name), 'utf8');

describe('F01 predicted_next_starts ACL migration', () => {
  const sql = readMigration('0025_revoke_predicted_next_starts_acl.sql');

  it('revokes execute from public/anon/authenticated', () => {
    expect(sql).toMatch(
      /revoke all on function public\.predicted_next_starts\(\) from public/i,
    );
    expect(sql).toMatch(
      /revoke all on function public\.predicted_next_starts\(\) from anon/i,
    );
    expect(sql).toMatch(
      /revoke all on function public\.predicted_next_starts\(\) from authenticated/i,
    );
  });

  it('grants execute only to service_role', () => {
    expect(sql).toMatch(
      /grant execute on function public\.predicted_next_starts\(\) to service_role/i,
    );
    expect(sql).not.toMatch(
      /grant execute on function public\.predicted_next_starts\(\) to (public|anon|authenticated)/i,
    );
  });
});

describe('F03 couples direct UPDATE migration', () => {
  const sql = readMigration('0026_revoke_couples_direct_update.sql');

  it('drops the member UPDATE policy and revokes authenticated UPDATE', () => {
    expect(sql).toMatch(/drop policy if exists "Members update own couple"/i);
    expect(sql).toMatch(
      /revoke update on table public\.couples from authenticated/i,
    );
    expect(sql).toMatch(
      /grant select on table public\.couples to authenticated/i,
    );
  });
});

describe('F10 same-day restore migration', () => {
  const sql = readMigration('0027_daily_log_same_day_restore.sql');

  it('uses a partial unique index plus restore RPC', () => {
    expect(sql).toMatch(/drop constraint if exists daily_logs_couple_id_log_date_key/i);
    expect(sql).toMatch(/where deleted_at is null/i);
    expect(sql).toMatch(/create or replace function public\.upsert_daily_log/i);
    expect(sql).toMatch(/deleted_at = null/i);
  });
});
