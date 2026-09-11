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
    <PageShell variant="auth">
      <div className="mb-4 flex flex-col items-center gap-1.5 text-center">
        <img src="/logo.svg" alt="" aria-hidden="true" className="size-12" />
        <p className="text-base font-semibold tracking-tight">{t('app.name')}</p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{t('auth.signup.title')}</CardTitle>
          <CardDescription>{t('auth.signup.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default SignupPage;
