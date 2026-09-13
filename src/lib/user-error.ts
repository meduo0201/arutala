const CJK = /[\u4e00-\u9fff]/;

const AUTH_INVALID = '账号或密码错误';
const AUTH_TAKEN = '该账号已注册';

const CODE_MAPPINGS: Readonly<Record<string, string>> = {
  invalid_credentials: AUTH_INVALID,
  invalid_login_credentials: AUTH_INVALID,
  user_already_exists: AUTH_TAKEN,
  email_exists: AUTH_TAKEN,
  user_already_registered: AUTH_TAKEN,
  email_not_confirmed: '账号尚未激活，请稍后再试。',
  weak_password: '密码至少 6 位。',
  signup_disabled: '暂时无法注册，请稍后再试。',
  over_email_send_rate_limit: '操作太频繁，请稍后再试。',
  over_request_rate_limit: '操作太频繁，请稍后再试。',
  captcha_failed: '验证未通过，请重试。',
};

const MAPPINGS: ReadonlyArray<readonly [RegExp, string]> = [
  [/invalid login credentials/i, AUTH_INVALID],
  [/invalid credentials/i, AUTH_INVALID],
  [/email not confirmed/i, '账号尚未激活，请稍后再试。'],
  [/user already registered/i, AUTH_TAKEN],
  [/already registered/i, AUTH_TAKEN],
  [/password should be at least/i, '密码至少 6 位。'],
  [/signup (is )?disabled/i, '暂时无法注册，请稍后再试。'],
  [/email rate limit|over_email_send_rate_limit/i, '操作太频繁，请稍后再试。'],
  [/rate limit|too many requests|over_request_rate_limit/i, '操作太频繁，请稍后再试。'],
  [/captcha/i, '验证未通过，请重试。'],
  [/failed to fetch|networkerror|load failed|network request failed/i, '网络异常，请检查连接后重试。'],
  [/jwt expired|invalid jwt|session expired/i, '登录已过期，请重新登录。'],
  [/not authenticated|auth session missing/i, '请先登录。'],
  [/permission denied|row-level security|violates row-level|rls/i, '没有权限完成此操作。'],
  [/duplicate key|unique constraint|already exists/i, '这条记录已存在。'],
  [/useStartPeriod|useUpsertDailyLog|useActiveCycle|useCycles|useDailyLog/i, '还不能记录，请刷新页面后再试。'],
  [/requires authenticated user \+ active couple/i, '还不能记录，请刷新页面后再试。'],
  [/called without/i, '页面还没准备好，请稍后重试。'],
  [/sudah ada invitation/i, '已有未使用的邀请码，请先取消再生成。'],
  [/code tidak ditemukan/i, '邀请码不存在，请检查后重试。'],
  [/code sudah pernah/i, '这个邀请码已经用过了。'],
  [/code sudah expired/i, '邀请码已过期，请让对方重新生成。'],
  [/tidak bisa accept/i, '不能使用自己的邀请码。'],
  [/gak ada pasangan/i, '当前没有可解除的伴侣关联。'],
  [/vapid key not configured/i, '推送暂未开通。'],
  [/notification permission denied/i, '通知权限被拒绝。'],
  [/subscription missing/i, '推送订阅不完整，请重试。'],
  [/tidak tersedia/i, '当前浏览器不支持此功能。'],
  [/failed to load turnstile/i, '验证组件加载失败，请刷新后重试。'],
  [/passphrase empty/i, '请填写口令。'],
  [/verifier mismatch/i, '口令不正确，请重试。'],
  [/malformed ciphertext|unsupported encryption/i, '加密数据无法读取。'],
];

export const extractErrorMessage = (error: unknown): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
};

export const extractErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object' || !('code' in error)) return '';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
};

/** Map API / auth / Postgres errors to a user-visible Simplified Chinese string. */
export const formatUserError = (
  error: unknown,
  fallback = '出错了，请再试一次。',
): string => {
  const code = extractErrorCode(error);
  if (code && CODE_MAPPINGS[code]) return CODE_MAPPINGS[code];

  const raw = extractErrorMessage(error).trim();
  if (!raw) return fallback;
  if (CJK.test(raw)) return raw;
  if (CODE_MAPPINGS[raw]) return CODE_MAPPINGS[raw];
  for (const [pattern, zh] of MAPPINGS) {
    if (pattern.test(raw)) return zh;
  }
  return fallback;
};
