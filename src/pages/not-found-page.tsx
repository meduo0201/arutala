import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/page-shell';
import { useTranslation } from '@/lib/i18n';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <PageShell variant="auth" className="justify-center text-center">
      <div className="w-full space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t('not-found.title')}</h1>
        <p className="text-muted-foreground">{t('not-found.message')}</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center text-primary underline underline-offset-4"
        >
          {t('not-found.back-home')}
        </Link>
      </div>
    </PageShell>
  );
};

export default NotFoundPage;
