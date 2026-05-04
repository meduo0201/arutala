import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SignupForm } from '@/features/auth/components/signup-form';
import { useTranslation } from '@/lib/i18n';

const SignupPage = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('auth.signup.title')}</CardTitle>
          <CardDescription>{t('auth.signup.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </main>
  );
};

export default SignupPage;
