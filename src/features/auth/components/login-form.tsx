import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { useSignIn } from '@/features/auth/hooks/use-auth-mutations';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signIn = useSignIn();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = (values: LoginInput) => {
    signIn.mutate(values, {
      onSuccess: () => navigate('/', { replace: true }),
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
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {signIn.error && (
          <p className="text-sm text-destructive" role="alert">
            {formatUserError(signIn.error, t('auth.error.invalid'))}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.login.no-account')}{' '}
          <Link
            to="/signup"
            className="text-primary underline underline-offset-4"
          >
            {t('auth.signup.title')}
          </Link>
        </p>
      </form>
    </Form>
  );
};
