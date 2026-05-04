import { z } from 'zod';

// ISO date YYYY-MM-DD. Forms pakai HTML <input type="date"> yang return format ini.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.');

export const startCycleSchema = z.object({
  start_date: isoDate,
  notes: z.string().max(500, 'Catatan terlalu panjang (maks 500 karakter).').optional(),
});

export const endCycleSchema = z.object({
  cycle_id: z.string().uuid(),
  end_date: isoDate,
});

export const updateCycleSchema = z
  .object({
    cycle_id: z.string().uuid(),
    start_date: isoDate,
    end_date: isoDate.nullable(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => !data.end_date || data.end_date >= data.start_date,
    {
      message: 'Tanggal selesai gak boleh lebih awal dari tanggal mulai.',
      path: ['end_date'],
    },
  );

export type StartCycleInput = z.infer<typeof startCycleSchema>;
export type EndCycleInput = z.infer<typeof endCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
