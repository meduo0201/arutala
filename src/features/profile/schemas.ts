import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Nama minimal 2 karakter.')
    .max(40, 'Nama maks 40 karakter.'),
  // Emoji unicode bisa multi-codepoint (skin tone modifier, ZWJ sequences). Allow
  // up to 8 chars buat handle compound emoji. Empty string OK = no avatar (fallback 👤).
  avatar_emoji: z.string().max(8, 'Maks 8 karakter (emoji aja).').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
