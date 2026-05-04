import { useEffect, useState } from 'react';
import { Lock, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import {
  EMPTY_SEXUAL_ACTIVITY,
  type SexualActivityPayload,
} from '@/features/daily-logs/types';
import { useE2eeStore } from '@/features/e2ee/store';
import { decrypt } from '@/lib/crypto';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface SexualActivitySectionProps {
  /** Existing encrypted payload from server (or null jika belum ada). */
  encryptedFromServer: string | null;
  /** Current form value (parent state). */
  value: SexualActivityPayload;
  onChange: (next: SexualActivityPayload) => void;
}

// Conditional render section di DailyLogForm. 4 states:
//   - not_setup: CTA setup E2EE di Settings
//   - locked: CTA unlock di Settings
//   - unlocked + encryptedFromServer null: empty form (active toggle off)
//   - unlocked + encryptedFromServer present: decrypt → populate form
//
// Parent (DailyLogForm) responsible:
//   - Hold value as state
//   - On submit, kalau active=true → encrypt + pass to upsertDailyLog
//   - Kalau active=false → clear field (pass empty string)
export const SexualActivitySection = ({
  encryptedFromServer,
  value,
  onChange,
}: SexualActivitySectionProps) => {
  const { t } = useTranslation();
  const status = useE2eeStore((s) => s.status);
  const key = useE2eeStore((s) => s.key);

  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Decrypt + hydrate form value when key + ciphertext both available.
  useEffect(() => {
    if (hydrated) return;
    if (!encryptedFromServer || status !== 'unlocked' || !key) return;
    let cancelled = false;
    void (async () => {
      try {
        const plaintext = await decrypt(encryptedFromServer, key);
        if (cancelled) return;
        const parsed = JSON.parse(plaintext) as SexualActivityPayload;
        onChange(parsed);
        setDecryptError(null);
        setHydrated(true);
      } catch {
        if (!cancelled) setDecryptError(t('sexual-activity.error.decrypt'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [encryptedFromServer, status, key, hydrated, onChange, t]);

  // not_setup state — encourage user to enable E2EE
  if (status === 'not_setup') {
    return (
      <SectionFrame title={t('sexual-activity.section.title')}>
        <div className="rounded-md border border-dashed border-border p-3 space-y-2">
          <p className="text-xs text-muted-foreground inline-flex items-start gap-2">
            <ShieldAlert className="size-4 mt-0.5 text-amber-600 shrink-0" />
            <span>{t('sexual-activity.gate.not-setup')}</span>
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
          >
            <SettingsIcon className="size-3" />
            {t('sexual-activity.gate.go-to-settings')}
          </Link>
        </div>
      </SectionFrame>
    );
  }

  // locked state — show unlock CTA
  if (status === 'locked' || status === 'unknown') {
    return (
      <SectionFrame title={t('sexual-activity.section.title')}>
        <div className="rounded-md border border-dashed border-border p-3 space-y-2">
          <p className="text-xs text-muted-foreground inline-flex items-start gap-2">
            <Lock className="size-4 mt-0.5 text-primary shrink-0" />
            <span>{t('sexual-activity.gate.locked')}</span>
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
          >
            <SettingsIcon className="size-3" />
            {t('sexual-activity.gate.go-to-settings')}
          </Link>
        </div>
      </SectionFrame>
    );
  }

  // unlocked — render actual form
  return (
    <SectionFrame title={t('sexual-activity.section.title')}>
      {decryptError && (
        <p className="text-sm text-destructive" role="alert">
          {decryptError}
        </p>
      )}

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <span className="text-sm font-medium">
          {t('sexual-activity.field.active')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={value.active}
          onClick={() =>
            onChange(
              value.active
                ? EMPTY_SEXUAL_ACTIVITY
                : { ...value, active: true },
            )
          }
          className={cn(
            'h-6 w-11 rounded-full transition-colors relative',
            value.active ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-5 rounded-full bg-white transition-all',
              value.active ? 'left-5' : 'left-0.5',
            )}
          />
        </button>
      </div>

      {value.active && (
        <>
          {/* Type */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('sexual-activity.field.type')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['protected', 'unprotected'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...value, type })}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm transition-colors',
                    value.type === type
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {t(`sexual-activity.type.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('sexual-activity.field.intensity')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ ...value, intensity: n })}
                  className={cn(
                    'rounded-md border px-2 py-2 text-sm transition-colors',
                    value.intensity === n
                      ? 'border-primary bg-primary/10 font-medium'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {t(`sexual-activity.intensity.${n}` as const)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('sexual-activity.field.notes')}
            </p>
            <Textarea
              rows={2}
              value={value.notes ?? ''}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        </>
      )}
    </SectionFrame>
  );
};

const SectionFrame = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h3 className="text-sm font-medium">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);
