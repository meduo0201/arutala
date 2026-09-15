import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { SignupForm } from '@/features/auth/components/signup-form';
import { useTranslation } from '@/lib/i18n';

const SignupPage = () => {
  const { t } = useTranslation();

  return (
    <PageShell variant="auth" className="justify-center gap-7">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <img src="/logo.svg" alt="" aria-hidden="true" className="size-14" />
        <p className="page-heading text-xl">{t('app.name')}</p>
      </div>
      <Card className="w-full px-1">
        <CardHeader className="gap-2.5">
          <CardTitle className="page-heading text-2xl">
            {t('auth.signup.title')}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {t('auth.signup.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default SignupPage;
