import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  acceptInvitationSchema,
  type AcceptInvitationInput,
} from '@/features/couples/schemas';
import { useAcceptInvitation } from '@/features/couples/hooks/use-couple-mutations';
import { useTranslation } from '@/lib/i18n';

// Form untuk accept invitation code. Input auto-uppercase via onChange transform
// supaya user lihat letter case yang benar saat ngetik (zod transform jalan
// di submit, gak update display). On success: query invalidation auto-redirect
// (parent CoupleRequiredRoute detect couple aktif lalu render Outlet).
export const AcceptInvitationForm = () => {
  const { t } = useTranslation();
  const acceptInvitation = useAcceptInvitation();

  const form = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = (values: AcceptInvitationInput) => {
    acceptInvitation.mutate(values.code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('couple.accept.title')}</CardTitle>
        <CardDescription>{t('couple.accept.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('couple.accept.code-label')}</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={6}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      className="font-mono text-lg tracking-[0.3em] uppercase"
                      placeholder="X3K9PM"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {acceptInvitation.error && (
              <p className="text-sm text-destructive" role="alert">
                {acceptInvitation.error.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={acceptInvitation.isPending}
            >
              {acceptInvitation.isPending
                ? t('couple.accept.submitting')
                : t('couple.accept.submit')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
