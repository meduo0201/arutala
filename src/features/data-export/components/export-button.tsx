import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import { useDailyLogs } from '@/features/daily-logs/hooks/use-daily-logs';
import { buildExportCsv, downloadCsv } from '@/features/data-export/lib/csv';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';

export const ExportButton = () => {
  const { t } = useTranslation();
  const cycles = useCycles();
  const logs = useDailyLogs();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cycles.data || !logs.data) return;
    setExporting(true);
    try {
      // Yield to UI thread biar button state visible (non-blocking)
      await new Promise((resolve) => setTimeout(resolve, 50));
      const csv = buildExportCsv(cycles.data, logs.data);
      const filename = `arutala-export-${todayIso()}.csv`;
      downloadCsv(csv, filename);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting || !cycles.data || !logs.data}
    >
      <Download className="size-4 mr-2" />
      {exporting ? t('export.exporting') : t('export.button')}
    </Button>
  );
};
