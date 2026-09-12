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

// Match Supabase Auth min length only. No complexity / breach / charset rules.
const passwordField = z.string().min(6, '密码至少 6 位。');

export const signupSchema = z
  .object({
    username: usernameField,
    password: passwordField,
    confirmPassword: z.string().min(1, '请再次输入密码。'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码不一致。',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
