import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FlowIntensityPicker } from '@/features/daily-logs/components/flow-intensity-picker';
import { MoodButton } from '@/features/daily-logs/components/mood-button';
import { SexualActivitySection } from '@/features/daily-logs/components/sexual-activity-section';
import { SymptomChip } from '@/features/daily-logs/components/symptom-chip';
import {
  useMoodCatalog,
  useSymptomCatalog,
} from '@/features/daily-logs/hooks/use-catalogs';
import {
  useDeleteDailyLog,
  useUpsertDailyLog,
} from '@/features/daily-logs/hooks/use-daily-log-mutations';
import { useDailyLogByDate } from '@/features/daily-logs/hooks/use-daily-logs';
import {
  dailyLogFormSchema,
  type DailyLogFormInput,
} from '@/features/daily-logs/schemas';
import {
  EMPTY_SEXUAL_ACTIVITY,
  type FlowIntensity,
  type SexualActivityPayload,
} from '@/features/daily-logs/types';
import { useE2eeStore } from '@/features/e2ee/store';
import { encrypt } from '@/lib/crypto';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

interface DailyLogFormProps {
  /** YYYY-MM-DD */
  logDate: string;
  /** Active cycle ID untuk associate log dengan cycle (optional). */
  cycleId?: string | null | undefined;
  /** Called pas save sukses—parent bisa close sheet kalau mau. */
  onSaved?: () => void;
}

// Form input single daily log: flow + symptoms + moods + notes.
// Auto-load existing entry kalau ada, else empty form.
export const DailyLogForm = ({ logDate, cycleId, onSaved }: DailyLogFormProps) => {
  const { t } = useTranslation();
  const existing = useDailyLogByDate(logDate);
  const symptoms = useSymptomCatalog();
  const moods = useMoodCatalog();
  const upsert = useUpsertDailyLog();
  const del = useDeleteDailyLog();

  // E2EE-gated sexual activity state — separate from RHF form (gak ada di
  // dailyLogFormSchema biar form tetap clean + plaintext-only).
  const e2eeKey = useE2eeStore((s) => s.key);
  const e2eeStatus = useE2eeStore((s) => s.status);
  const [sexualActivity, setSexualActivity] = useState<SexualActivityPayload>(
    EMPTY_SEXUAL_ACTIVITY,
  );

  const form = useForm<DailyLogFormInput>({
    resolver: zodResolver(dailyLogFormSchema),
    defaultValues: {
      log_date: logDate,
      flow_intensity: null,
      symptoms: [],
      moods: [],
      notes: '',
    },
  });

  // Re-init form pas existing data masuk OR logDate berubah (sheet open beda hari).
  useEffect(() => {
    if (existing.isLoading) return;
    form.reset({
      log_date: logDate,
      flow_intensity: existing.data?.flow_intensity ?? null,
      symptoms: existing.data?.symptoms ?? [],
      moods: existing.data?.moods ?? [],
      notes: existing.data?.notes ?? '',
    });
    // Reset sexual activity state — section component akan hydrate dari
    // ciphertext kalau e2ee unlocked.
    setSexualActivity(EMPTY_SEXUAL_ACTIVITY);
  }, [logDate, existing.data, existing.isLoading, form]);

  const onSubmit = async (values: DailyLogFormInput) => {
    // Compute encrypted payload kalau e2ee unlocked.
    // - Kalau status != unlocked: pass undefined (gak update field).
    // - Kalau active=false dan ada existing ciphertext: clear (set null).
    // - Kalau active=true: encrypt JSON.stringify(payload).
    let sexualActivityEncrypted: string | null | undefined = undefined;
    if (e2eeStatus === 'unlocked' && e2eeKey) {
      if (sexualActivity.active) {
        sexualActivityEncrypted = await encrypt(
          JSON.stringify(sexualActivity),
          e2eeKey,
        );
      } else if (existing.data?.sexual_activity_encrypted) {
        // User toggled off — clear stored ciphertext.
        sexualActivityEncrypted = null;
      }
    }

    upsert.mutate(
      {
        ...values,
        cycle_id: cycleId,
        sexual_activity_encrypted: sexualActivityEncrypted,
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  };

  const handleDelete = () => {
    if (!existing.data) return;
    if (!window.confirm(t('daily-log.delete-confirm'))) return;
    del.mutate(existing.data.id, {
      onSuccess: () => {
        form.reset({
          log_date: logDate,
          flow_intensity: null,
          symptoms: [],
          moods: [],
          notes: '',
        });
        onSaved?.();
      },
    });
  };

  if (existing.isLoading || symptoms.isLoading || moods.isLoading) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {t('common.loading')}
      </p>
    );
  }

  const hasExisting = !!existing.data;
  const isPending = upsert.isPending || del.isPending;
  const apiError = upsert.error || del.error;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Flow intensity */}
      <Controller
        control={form.control}
        name="flow_intensity"
        render={({ field }) => (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t('daily-log.section.flow')}</h3>
            <FlowIntensityPicker
              value={field.value as FlowIntensity | null | undefined}
              onChange={field.onChange}
            />
          </div>
        )}
      />

      {/* Symptoms (chips, multi-select) */}
      <Controller
        control={form.control}
        name="symptoms"
        render={({ field }) => (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {t('daily-log.section.symptoms')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {symptoms.data?.map((s) => (
                <SymptomChip
                  key={s.key}
                  symptom={s}
                  selected={field.value?.includes(s.key) ?? false}
                  onToggle={(key) => {
                    const set = new Set(field.value ?? []);
                    if (set.has(key)) set.delete(key);
                    else set.add(key);
                    field.onChange(Array.from(set));
                  }}
                />
              ))}
            </div>
          </div>
        )}
      />

      {/* Moods (emoji buttons, multi-select) */}
      <Controller
        control={form.control}
        name="moods"
        render={({ field }) => (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t('daily-log.section.moods')}</h3>
            <div className="flex flex-wrap gap-2">
              {moods.data?.map((m) => (
                <MoodButton
                  key={m.key}
                  mood={m}
                  selected={field.value?.includes(m.key) ?? false}
                  onToggle={(key) => {
                    const set = new Set(field.value ?? []);
                    if (set.has(key)) set.delete(key);
                    else set.add(key);
                    field.onChange(Array.from(set));
                  }}
                />
              ))}
            </div>
          </div>
        )}
      />

      {/* Notes */}
      <Controller
        control={form.control}
        name="notes"
        render={({ field }) => (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t('daily-log.section.notes')}</h3>
            <Textarea
              rows={3}
              placeholder={t('daily-log.notes.placeholder')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              {...field}
            />
          </div>
        )}
      />

      {/* Sexual activity — E2EE-gated section (Phase 4 Track B5) */}
      <SexualActivitySection
        encryptedFromServer={existing.data?.sexual_activity_encrypted ?? null}
        value={sexualActivity}
        onChange={setSexualActivity}
      />

      {apiError && (
        <p className="text-sm text-destructive" role="alert">
          {formatUserError(apiError, t('toast.error.generic'))}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        {hasExisting && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {t('daily-log.delete')}
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="flex-1">
          {upsert.isPending ? t('daily-log.saving') : t('daily-log.save')}
        </Button>
      </div>
    </form>
  );
};
