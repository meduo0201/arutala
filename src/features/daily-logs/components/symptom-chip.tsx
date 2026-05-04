import { cn } from '@/lib/utils';
import { getCatalogLabel, type SymptomCatalogRow } from '@/features/daily-logs/types';
import { useTranslation } from '@/lib/i18n';

interface SymptomChipProps {
  symptom: SymptomCatalogRow;
  selected: boolean;
  onToggle: (key: string) => void;
}

// Toggle chip pill with emoji + locale-aware label. Selected = period color
// background (rose). Touch target 44px tall per mobile UX baseline.
export const SymptomChip = ({ symptom, selected, onToggle }: SymptomChipProps) => {
  const { locale } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onToggle(symptom.key)}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 h-11 px-3 rounded-full border text-sm transition-colors',
        'min-w-0 whitespace-nowrap',
        selected
          ? 'bg-period text-white border-period hover:bg-period/90'
          : 'bg-background text-foreground border-border hover:bg-muted',
      )}
    >
      {symptom.emoji && <span className="text-base leading-none">{symptom.emoji}</span>}
      <span>{getCatalogLabel(symptom, locale)}</span>
    </button>
  );
};
