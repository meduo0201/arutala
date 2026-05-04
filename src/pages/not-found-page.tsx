import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';

// 404 catch-all (`path: '*'` di router.tsx).
const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t('not-found.title')}</h1>
        <p className="text-muted-foreground">{t('not-found.message')}</p>
        <Link
          to="/"
          className="inline-block text-primary underline underline-offset-4"
        >
          {t('not-found.back-home')}
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
