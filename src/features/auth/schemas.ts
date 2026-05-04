import { z } from 'zod';

// Validation schemas untuk auth forms. Reused di API mutations + form resolvers.
// Error messages Bahasa Indonesia (gen-Z friendly per CLAUDE.md tone).

export const loginSchema = z.object({
  email: z.string().email('Format email belum valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

// Age-gate per UU PDP Pasal 25 — pemrosesan data anak butuh consent ortu/wali,
// untuk simplicity Arutala block <18.
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
    email: z.string().email('Format email belum valid.'),
    displayName: z
      .string()
      .min(2, 'Nama minimal 2 karakter.')
      .max(40, 'Nama maks 40 karakter.'),
    password: z
      .string()
      .min(12, 'Password minimal 12 karakter.')
      .regex(/[a-z]/, 'Password butuh huruf kecil.')
      .regex(/[A-Z]/, 'Password butuh huruf besar.')
      .regex(/\d/, 'Password butuh angka.')
      .regex(/[^a-zA-Z0-9]/, 'Password butuh simbol (mis. !@#$).'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
    dateOfBirth: z
      .string()
      .min(1, 'Tanggal lahir wajib diisi (verifikasi umur ≥18).')
      .refine(
        (val) => {
          const dob = new Date(val);
          if (Number.isNaN(dob.getTime())) return false;
          return yearsBetween(dob, new Date()) >= MIN_SIGNUP_AGE;
        },
        { message: 'Umur minimal 18 tahun untuk daftar.' },
      ),
    consentCoreProcessing: z.boolean().refine((v) => v === true, {
      message: 'Persetujuan eksplisit data kesehatan wajib di-centang.',
    }),
    consentCrossBorder: z.boolean().refine((v) => v === true, {
      message: 'Persetujuan transfer data ke luar negeri wajib di-centang.',
    }),
    consentPartnerSharing: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password gak sama.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
