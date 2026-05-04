import { cn } from '@/lib/utils';
import {
  FLOW_INTENSITY_VALUES,
  type FlowIntensity,
} from '@/features/daily-logs/types';
import { useTranslation } from '@/lib/i18n';

const FLOW_DOTS: Record<FlowIntensity, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

interface FlowIntensityPickerProps {
  value: FlowIntensity | null | undefined;
  onChange: (value: FlowIntensity | null) => void;
}

// 5-option picker (None, Spotting, Light, Medium, Heavy) sebagai grid buttons.
// Click selected value lagi → toggle off (null). Visual: rose dots indicating intensity.
export const FlowIntensityPicker = ({
  value,
  onChange,
}: FlowIntensityPickerProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-5 gap-2">
      {FLOW_INTENSITY_VALUES.map((intensity) => {
        const isSelected = value === intensity;
        return (
          <button
            key={intensity}
            type="button"
            onClick={() => onChange(isSelected ? null : intensity)}
            aria-pressed={isSelected}
            className={cn(
              'flex flex-col items-center gap-1.5 py-2 rounded-lg border transition-colors',
              'min-h-[64px]',
              isSelected
                ? 'bg-period/10 border-period ring-2 ring-period/40'
                : 'bg-background border-border hover:bg-muted',
            )}
          >
            <div className="flex gap-0.5 h-2.5 items-center" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-1.5 rounded-full',
                    i < FLOW_DOTS[intensity] ? 'bg-period' : 'bg-muted-foreground/20',
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium leading-tight text-center">
              {t(`daily-log.flow.${intensity}` as const)}
            </span>
          </button>
        );
      })}
    </div>
  );
};
