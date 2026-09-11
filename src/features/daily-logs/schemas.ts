import { z } from 'zod';
import { FLOW_INTENSITY_VALUES } from '@/features/daily-logs/types';

// Form schema buat input single daily log. log_date wajib (1 log per couple per
// hari—DB UNIQUE constraint), field lain optional.

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式须为 YYYY-MM-DD。');

export const dailyLogFormSchema = z.object({
  log_date: isoDate,
  flow_intensity: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .nullable()
    .optional(),
  symptoms: z.array(z.string()).default([]),
  moods: z.array(z.string()).default([]),
  notes: z.string().max(2000, '笔记过长（最多 2000 字）。').optional(),
});

export type DailyLogFormInput = z.infer<typeof dailyLogFormSchema>;

// Sanity guard untuk catalog tabs valid value
export const isValidFlowIntensity = (
  v: number | null | undefined,
): v is (typeof FLOW_INTENSITY_VALUES)[number] | null =>
  v === null || v === undefined || FLOW_INTENSITY_VALUES.includes(v as 0 | 1 | 2 | 3 | 4);
