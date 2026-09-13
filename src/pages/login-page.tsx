import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { LoginForm } from '@/features/auth/components/login-form';
import { useTranslation } from '@/lib/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <PageShell variant="auth" className="justify-center">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <img src="/logo.svg" alt="" aria-hidden="true" className="size-14" />
        <p className="text-lg font-semibold tracking-tight">{t('app.name')}</p>
        <p className="text-xs text-muted-foreground max-w-[16rem]">
          {t('app.tagline')}
        </p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
          <CardDescription>{t('auth.login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSupabaseConfigured ? (
            <LoginForm />
          ) : (
            <p className="text-sm text-destructive" role="alert">
              {t('error.config')}
            </p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default LoginPage;
