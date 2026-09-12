import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, '请填写账号名称。')
    .max(40, '账号名称最多 40 个字符。'),
  // Emoji unicode bisa multi-codepoint (skin tone modifier, ZWJ sequences). Allow
  // up to 8 chars buat handle compound emoji. Empty string OK = no avatar (fallback 👤).
  avatar_emoji: z.string().max(8, '最多 8 个字符（请用表情）。').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
