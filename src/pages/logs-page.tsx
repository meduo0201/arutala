import { useMemo, useState } from 'react';
import { ChevronLeft, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageShell } from '@/components/layout/page-shell';
import { LogListItem } from '@/features/daily-logs/components/log-list-item';
import { SymptomChip } from '@/features/daily-logs/components/symptom-chip';
import { useSymptomCatalog } from '@/features/daily-logs/hooks/use-catalogs';
import { useDailyLogs } from '@/features/daily-logs/hooks/use-daily-logs';
import { QueryError } from '@/components/query-error';
import { useTranslation } from '@/lib/i18n';

// Full daily log list dengan search + symptom filter. Search by notes text
// (case-insensitive). Symptom filter: AND match (all selected symptoms harus ada).
//
// Phase 3 minimal—date range + mood filter di Phase 4 polish.
const LogsPage = () => {
  const { t } = useTranslation();
  const logs = useDailyLogs();
  const symptoms = useSymptomCatalog();

  const [search, setSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!logs.data) return [];
    let result = logs.data.filter((l) => !l.deleted_at);

    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      result = result.filter((l) =>
        (l.notes ?? '').toLowerCase().includes(needle),
      );
    }

    if (selectedSymptoms.length > 0) {
      result = result.filter((l) =>
        selectedSymptoms.every((s) => l.symptoms.includes(s)),
      );
    }

    return result;
  }, [logs.data, search, selectedSymptoms]);

  const toggleSymptom = (key: string) =>
    setSelectedSymptoms((arr) =>
      arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key],
    );

  const hasFilters = search.trim() || selectedSymptoms.length > 0;

  return (
    <PageShell className="space-y-4">
        <header className="flex items-center gap-2">
          <Link
            to="/"
            aria-label={t('settings.back')}
            className="inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted -ml-2"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('logs.title')}
          </h1>
        </header>

        {/* Search input */}
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('logs.search.placeholder')}
            className="pl-9"
          />
        </div>

        {/* Symptom filter chips */}
        {symptoms.data && symptoms.data.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {t('logs.filter.symptoms')}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => {
                    setSearch('');
                    setSelectedSymptoms([]);
                  }}
                >
                  <X className="size-3 mr-1" />
                  {t('logs.filter.clear')}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {symptoms.data.map((s) => (
                <SymptomChip
                  key={s.key}
                  symptom={s}
                  selected={selectedSymptoms.includes(s.key)}
                  onToggle={toggleSymptom}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {logs.isError ? (
          <QueryError error={logs.error} onRetry={() => void logs.refetch()} />
        ) : (
          <>
        <p className="text-xs text-muted-foreground">
          {filtered.length} {t('logs.results-count')}
        </p>

        <Card>
          <CardContent className="py-2">
            {logs.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('common.loading')}
              </p>
            ) : filtered.length > 0 ? (
              <div>
                {filtered.map((log) => (
                  <LogListItem key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('logs.empty')}
              </p>
            )}
          </CardContent>
        </Card>
          </>
        )}
    </PageShell>
  );
};

export default LogsPage;
