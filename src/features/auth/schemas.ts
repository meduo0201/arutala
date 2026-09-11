import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确。'),
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
    email: z.string().email('邮箱格式不正确。'),
    displayName: z
      .string()
      .min(2, '昵称至少 2 个字符。')
      .max(40, '昵称最多 40 个字符。'),
    password: z
      .string()
      .min(12, '密码至少 12 位。')
      .regex(/[a-z]/, '密码需要包含小写字母。')
      .regex(/[A-Z]/, '密码需要包含大写字母。')
      .regex(/\d/, '密码需要包含数字。')
      .regex(/[^a-zA-Z0-9]/, '密码需要包含符号（如 !@#$）。'),
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
