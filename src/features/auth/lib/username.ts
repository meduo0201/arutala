// Supabase Auth still requires an email identity. The UI never collects one:
// username `alice` maps to a fixed synthetic mailbox that is never shown.

export const SYNTHETIC_EMAIL_DOMAIN = 'users.local';

const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,31}$/;

export const normalizeUsername = (username: string): string =>
  username.trim().toLowerCase();

export const isValidUsername = (username: string): boolean =>
  USERNAME_PATTERN.test(username.trim());

export const toSyntheticEmail = (username: string): string =>
  `${normalizeUsername(username)}@${SYNTHETIC_EMAIL_DOMAIN}`;

/** Local-part only — never surface `@users.local` (or any mailbox) in the UI. */
export const usernameFromAuthEmail = (
  email: string | undefined | null,
): string => {
  if (!email) return '';
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;
  return email.slice(0, at);
};
