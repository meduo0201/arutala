export const ACCOUNT_SOFT_DELETED_MESSAGE =
  '账号已注销，30 天后将永久删除，无法自助恢复。';

export const isProfileSoftDeleted = (
  profile: { deleted_at?: string | null } | null | undefined,
): boolean => Boolean(profile?.deleted_at);
