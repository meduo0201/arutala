import { z } from 'zod';
import { isValidUsername } from '@/features/auth/lib/username';

const usernameField = z
  .string()
  .trim()
  .min(3, '账号至少 3 个字符。')
  .max(32, '账号最多 32 个字符。')
  .refine((value) => !value.includes('@'), {
    message: '请输入英文账号，不要使用邮箱。',
  })
  .refine((value) => isValidUsername(value), {
    message: '账号须以英文字母开头，只能包含字母、数字或下划线。',
  });

export const loginSchema = z.object({
  username: usernameField,
  password: z.string().min(1, '请填写密码。'),
});

const MIN_SIGNUP_AGE = 18;
const yearsBetween = (start: Date, end: Date): number => {
  let years = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && end.getDate() < start.getDate())
  ) {
    years--;
  }
  return years;
};

export const signupSchema = z
  .object({
    username: usernameField,
    password: z.string().min(6, '密码至少 6 位。'),
    confirmPassword: z.string().min(1, '请再次输入密码。'),
    dateOfBirth: z
      .string()
      .min(1, '请填写出生日期（需年满 18 岁）。')
      .refine(
        (val) => {
          const dob = new Date(val);
          if (Number.isNaN(dob.getTime())) return false;
          return yearsBetween(dob, new Date()) >= MIN_SIGNUP_AGE;
        },
        { message: '注册需年满 18 岁。' },
      ),
    consentCoreProcessing: z.boolean().refine((v) => v === true, {
      message: '必须勾选健康数据处理同意。',
    }),
    consentCrossBorder: z.boolean().refine((v) => v === true, {
      message: '必须勾选跨境传输同意。',
    }),
    consentPartnerSharing: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码不一致。',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
