import { z } from 'zod';

// Invitation code format: 6 chars dari `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
// (no ambiguous: 0/O, 1/I/L). Defined di SCHEMA.sql `generate_invitation_code()`.
const INVITATION_CHARS = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export const acceptInvitationSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, '邀请码须为 6 位。')
    .regex(
      INVITATION_CHARS,
      '邀请码只能使用大写字母 A–Z（不含 I、L、O）和数字 2–9。',
    ),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
