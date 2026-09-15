import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteDailyLog,
  upsertDailyLog,
} from '@/features/daily-logs/api/daily-logs';
import { dailyLogInvalidationTargets } from '@/features/daily-logs/hooks/use-daily-logs';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCouple } from '@/features/couples/hooks/use-couple';
import type { DailyLogFormInput } from '@/features/daily-logs/schemas';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

// Helper: invalidate all daily-logs queries setelah mutation.
const useInvalidateDailyLogs = () => {
  const queryClient = useQueryClient();
  const { data: couple } = useCouple();
  const coupleId = couple?.id;

  return (logDate?: string) => {
    if (!coupleId) return;
    const keys = dailyLogInvalidationTargets(coupleId, logDate);
    void queryClient.invalidateQueries({ queryKey: keys.list });
    void queryClient.invalidateQueries({ queryKey: keys.byDate });
  };
};

/**
 * Upsert daily log. Single mutation handles both add + edit (DB upsert pakai
 * UNIQUE(couple_id, log_date)). Component panggil ini dari day-detail-sheet form.
 */
export const useUpsertDailyLog = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: couple } = useCouple();
  const invalidate = useInvalidateDailyLogs();

  return useMutation({
    mutationFn: (
      input: DailyLogFormInput & {
        cycle_id?: string | null | undefined;
        /** Pre-encrypted (caller responsible) — undefined = leave unchanged. */
        sexual_activity_encrypted?: string | null | undefined;
      },
    ) => {
      if (!user || !couple) {
        throw new Error('还不能记录，请刷新页面后再试。');
      }
      return upsertDailyLog({
        couple_id: couple.id,
        cycle_id: input.cycle_id,
        log_date: input.log_date,
        flow_intensity: input.flow_intensity,
        symptoms: input.symptoms,
        moods: input.moods,
        notes: input.notes,
        logged_by: user.id,
        sexual_activity_encrypted: input.sexual_activity_encrypted,
      });
    },
    onSuccess: (data) => {
      invalidate(data.log_date);
      toast.success(t('toast.daily-log.saved'));
    },
    onError: (error) => {
      toast.error(formatUserError(error, t('toast.error.generic')));
    },
  });
};

/** Soft delete via RPC. */
export const useDeleteDailyLog = () => {
  const { t } = useTranslation();
  const invalidate = useInvalidateDailyLogs();

  return useMutation({
    mutationFn: deleteDailyLog,
    onSuccess: () => {
      invalidate();
      toast.success(t('toast.daily-log.deleted'));
    },
    onError: (error) => {
      toast.error(formatUserError(error, t('toast.error.generic')));
    },
  });
};
