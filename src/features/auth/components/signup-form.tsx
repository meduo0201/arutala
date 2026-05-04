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
import { Checkbox } from '@/components/ui/checkbox';
import { signupSchema, type SignupInput } from '@/features/auth/schemas';
import { useSignUp } from '@/features/auth/hooks/use-auth-mutations';
import { TurnstileWidget } from '@/features/captcha/turnstile-widget';
import { savePendingConsent } from '@/features/consent/pending';
import { checkPasswordPwned } from '@/lib/hibp';
import { useTranslation } from '@/lib/i18n';

// Compute max date for DOB input = 18 years before today (browser-side hint).
// Server zod validation tetap source-of-truth.
const maxDobIso = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
};

export const SignupForm = () => {
  const { t } = useTranslation();
  const signUp = useSignUp();
  const [hibpStatus, setHibpStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'checking' }
    | { kind: 'pwned'; count: number }
  >({ kind: 'idle' });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileEnabled = !!import.meta.env['VITE_TURNSTILE_SITE_KEY'];

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      consentCoreProcessing: false,
      consentCrossBorder: false,
      consentPartnerSharing: false,
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

  const onSubmit = async (values: SignupInput) => {
    // HIBP k-anonymity check sebelum signUp. Block kalau password muncul
    // di breach (audit F-009 free-tier path replacement untuk Supabase Pro).
    setHibpStatus({ kind: 'checking' });
    const hibp = await checkPasswordPwned(values.password);
    if (hibp.pwned) {
      setHibpStatus({ kind: 'pwned', count: hibp.count });
      return;
    }
    setHibpStatus({ kind: 'idle' });

    // Save pending consent BEFORE signUp call. Replay handler di auth store
    // bakal pick up + log via RPC saat user first authenticated.
    savePendingConsent([
      { purpose: 'core_processing', granted: values.consentCoreProcessing },
      { purpose: 'cross_border_transfer', granted: values.consentCrossBorder },
      { purpose: 'partner_sharing', granted: values.consentPartnerSharing },
    ]);
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.field.display-name')}</FormLabel>
              <FormControl>
                <Input autoComplete="nickname" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.field.email')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.field.date-of-birth')}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={maxDobIso()}
                  autoComplete="bday"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {t('auth.field.date-of-birth.hint')}
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
              <FormDescription className="text-xs">
                {t('auth.password.help')}
              </FormDescription>
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

        {/* ===== Consent block (UU PDP Pasal 22 — granular per-purpose) ===== */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t('auth.consent.heading')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('auth.consent.intro')}
            </p>
            <Link
              to="/privacy"
              className="inline-block text-xs text-primary underline underline-offset-4"
            >
              {t('auth.consent.privacy-link')} →
            </Link>
          </div>

          <FormField
            control={form.control}
            name="consentCoreProcessing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-medium leading-tight">
                    {t('auth.consent.core-processing.title')}
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {t('auth.consent.core-processing.body')}
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consentCrossBorder"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-medium leading-tight">
                    {t('auth.consent.cross-border.title')}
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {t('auth.consent.cross-border.body')}
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consentPartnerSharing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-medium leading-tight">
                    {t('auth.consent.partner-sharing.title')}
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {t('auth.consent.partner-sharing.body')}
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <TurnstileWidget
          onToken={setCaptchaToken}
          onError={() => setCaptchaToken(null)}
        />

        {hibpStatus.kind === 'pwned' && (
          <p className="text-sm text-destructive" role="alert">
            {t('auth.password.pwned').replace(
              '{count}',
              hibpStatus.count.toLocaleString('id-ID'),
            )}
          </p>
        )}

        {signUp.error && (
          <p className="text-sm text-destructive" role="alert">
            {signUp.error.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            signUp.isPending ||
            hibpStatus.kind === 'checking' ||
            (turnstileEnabled && !captchaToken)
          }
        >
          {hibpStatus.kind === 'checking'
            ? t('auth.password.checking')
            : signUp.isPending
            ? t('auth.signup.submitting')
            : t('auth.signup.submit')}
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
