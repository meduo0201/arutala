import { cn } from '@/lib/utils';
import { getCatalogLabel, type MoodCatalogRow } from '@/features/daily-logs/types';
import { useTranslation } from '@/lib/i18n';

interface MoodButtonProps {
  mood: MoodCatalogRow;
  selected: boolean;
  onToggle: (key: string) => void;
}

// Vertical mood button: big emoji + label below. Selected = ring + slight tint.
// Multi-select supported (user bisa rasa multiple emotions sekaligus).
export const MoodButton = ({ mood, selected, onToggle }: MoodButtonProps) => {
  const { locale } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onToggle(mood.key)}
      aria-pressed={selected}
      className={cn(
        'inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-colors',
        'min-w-[64px] hover:bg-muted',
        selected
          ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
          : 'bg-background border-border',
      )}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {mood.emoji}
      </span>
      <span className="text-xs font-medium">{getCatalogLabel(mood, locale)}</span>
    </button>
  );
};
