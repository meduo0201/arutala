import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

interface QueryErrorProps {
  error?: unknown;
  onRetry?: () => void;
}

export const QueryError = ({ error, onRetry }: QueryErrorProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 text-center space-y-3">
      <p className="text-sm text-muted-foreground">
        {formatUserError(error, t('error.load-failed'))}
      </p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  );
};
