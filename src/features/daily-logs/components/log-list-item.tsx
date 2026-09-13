import { Droplet } from 'lucide-react';
import { useSymptomCatalog } from '@/features/daily-logs/hooks/use-catalogs';
import {
  getCatalogLabel,
  type DailyLogRow,
} from '@/features/daily-logs/types';
import { formatDate } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LogListItemProps {
  log: DailyLogRow;
}

const FLOW_DOTS: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 };

// Compact log row buat /logs page list. Date prominently, flow indicator,
// up to 3 symptom emoji + count for rest, notes truncated.
export const LogListItem = ({ log }: LogListItemProps) => {
  const { t, locale } = useTranslation();
  const symptoms = useSymptomCatalog();

  const matchedSymptoms =
    symptoms.data?.filter((s) => log.symptoms.includes(s.key)) ?? [];
  const visibleSymptoms = matchedSymptoms.slice(0, 3);
  const moreCount = matchedSymptoms.length - visibleSymptoms.length;

  return (
    <div className="py-3 border-b border-border last:border-b-0 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {formatDate(log.log_date, locale)}
        </span>
        {log.flow_intensity !== null && log.flow_intensity > 0 && (
          <span className="flex items-center gap-1" aria-label={`${t('logs.flow-label')} ${log.flow_intensity}`}>
            <Droplet
              className={cn(
                'size-3.5',
                (FLOW_DOTS[log.flow_intensity] ?? 0) >= 3
                  ? 'fill-period text-period'
                  : 'text-period',
              )}
            />
            <span className="text-xs text-muted-foreground tabular-nums">
              {log.flow_intensity}
            </span>
          </span>
        )}
      </div>

      {visibleSymptoms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSymptoms.map((s) => (
            <span
              key={s.key}
              className="text-xs text-muted-foreground inline-flex items-center gap-1"
            >
              {s.emoji} {getCatalogLabel(s, locale)}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="text-xs text-muted-foreground">+{moreCount}</span>
          )}
        </div>
      )}

      {log.notes && (
        <p className="text-sm text-foreground line-clamp-2">{log.notes}</p>
      )}
    </div>
  );
};
