import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EditCycleDialog } from '@/features/cycles/components/edit-cycle-dialog';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { periodDays, type CycleRow } from '@/features/cycles/types';
import { QueryError } from '@/components/query-error';
import { formatDate } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

// Riwayat periode list. Click row → opens EditCycleDialog (mode: edit).
// Phase 1 simple: max 30 entries (per query limit), tap-to-edit.
export const CycleList = () => {
  const { t, locale } = useTranslation();
  const cycles = useCycles();
  const [editingCycle, setEditingCycle] = useState<CycleRow | null>(null);

  if (cycles.isError) {
    return <QueryError error={cycles.error} onRetry={() => void cycles.refetch()} />;
  }

  if (cycles.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cycles.history.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {[0, 1, 2].map((i) => (
              <li key={i} className="py-3 flex items-center justify-between">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-12" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('cycles.history.title')}</CardTitle>
          <Link
            to="/logs"
            className="text-xs text-primary underline underline-offset-4"
          >
            {t('logs.view-all')}
          </Link>
        </CardHeader>
        <CardContent>
          {cycles.data && cycles.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {cycles.data.map((cycle) => {
                const days = periodDays(cycle);
                return (
                  <li key={cycle.id}>
                    <button
                      type="button"
                      onClick={() => setEditingCycle(cycle)}
                      className="-mx-3 flex w-full items-center justify-between rounded-2xl px-3 py-3.5 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">
                        {formatDate(cycle.start_date, locale)}
                        <span className="text-muted-foreground mx-2">
                          {t('cycles.history.arrow')}
                        </span>
                        {cycle.end_date ? (
                          formatDate(cycle.end_date, locale)
                        ) : (
                          <span className="text-period">
                            {t('cycles.history.ongoing')}
                          </span>
                        )}
                      </span>
                      {days !== null && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {days} {t('cycles.history.days-suffix')}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 text-center space-y-2">
              <span className="text-3xl block" aria-hidden="true">📅</span>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {t('cycles.history.empty')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditCycleDialog
        open={!!editingCycle}
        onOpenChange={(open) => {
          if (!open) setEditingCycle(null);
        }}
        cycle={editingCycle ?? undefined}
      />
    </>
  );
};
