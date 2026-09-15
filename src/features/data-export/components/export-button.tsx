import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { buildExportCsv, downloadCsv } from '@/features/data-export/lib/csv';
import {
  exportCsvOmitsIntimate,
  listAllMyCycles,
  listAllMyDailyLogs,
} from '@/features/data-export/lib/personal-export';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';
import { toast } from 'sonner';

export const ExportButton = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [cycles, logs] = await Promise.all([
        listAllMyCycles(user.id),
        listAllMyDailyLogs(user.id),
      ]);
      const csv = buildExportCsv(cycles, logs);
      if (!exportCsvOmitsIntimate(csv)) {
        throw new Error('导出失败：结果含有不应导出的字段。');
      }
      downloadCsv(csv, `arutala-export-${todayIso()}.csv`);
    } catch (error) {
      toast.error(formatUserError(error, t('toast.error.generic')));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleExport()}
      disabled={exporting || !user}
    >
      <Download className="size-4 mr-2" />
      {exporting ? t('export.exporting') : t('export.button')}
    </Button>
  );
};
