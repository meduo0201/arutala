import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signupSchema, type SignupInput } from '@/features/auth/schemas';
import { useSignUp } from '@/features/auth/hooks/use-auth-mutations';
import { TurnstileWidget } from '@/features/captcha/turnstile-widget';
import { useTranslation } from '@/lib/i18n';

export const SignupForm = () => {
  const { t } = useTranslation();
  const signUp = useSignUp();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileEnabled = !!import.meta.env['VITE_TURNSTILE_SITE_KEY'];

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (signUp.isSuccess) {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold">{t('auth.signup.success-title')}</h2>
        <p className="text-sm text-muted-foreground">{t('auth.signup.success-body')}</p>
        <Link
          to="/login"
          className="inline-block text-primary underline underline-offset-4"
        >
          {t('auth.signup.success-back-login')}
        </Link>
      </div>
    );
  }

  const onSubmit = (values: SignupInput) => {
    signUp.mutate({
      ...values,
      ...(captchaToken ? { captchaToken } : {}),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.field.username')}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  placeholder={t('auth.field.username.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {t('auth.field.username.hint')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.field.password')}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.field.password-confirm')}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <TurnstileWidget
          onToken={setCaptchaToken}
          onError={() => setCaptchaToken(null)}
        />

        {signUp.error && (
          <p className="text-sm text-destructive" role="alert">
            {signUp.error.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={signUp.isPending || (turnstileEnabled && !captchaToken)}
        >
          {signUp.isPending ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.signup.has-account')}{' '}
          <Link
            to="/login"
            className="text-primary underline underline-offset-4"
          >
            {t('auth.login.title')}
          </Link>
        </p>
      </form>
    </Form>
  );
};
