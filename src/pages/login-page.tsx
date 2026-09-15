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
    <PageShell variant="auth" className="justify-center gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.svg" alt="" aria-hidden="true" className="size-16" />
        <p className="page-heading text-2xl">{t('app.name')}</p>
        <p className="max-w-[18rem] text-sm leading-relaxed text-muted-foreground">
          {t('app.tagline')}
        </p>
      </div>
      <Card className="w-full px-1">
        <CardHeader className="gap-2.5">
          <CardTitle className="page-heading text-2xl">
            {t('auth.login.title')}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {t('auth.login.description')}
          </CardDescription>
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
