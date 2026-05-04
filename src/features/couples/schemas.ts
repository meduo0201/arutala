import { z } from 'zod';

// Invitation code format: 6 chars dari `23456789ABCDEFGHJKMNPQRSTUVWXYZ`
// (no ambiguous: 0/O, 1/I/L). Defined di SCHEMA.sql `generate_invitation_code()`.
const INVITATION_CHARS = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;

export const acceptInvitationSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, 'Code harus 6 karakter.')
    .regex(
      INVITATION_CHARS,
      'Code cuma boleh huruf besar A-Z (kecuali I, L, O) dan angka 2-9.',
    ),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
