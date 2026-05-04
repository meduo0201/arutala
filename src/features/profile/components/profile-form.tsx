import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/features/profile/schemas';
import { useTranslation } from '@/lib/i18n';

// Profile edit form: display_name + avatar_emoji.
// Loaded async, re-init form pas data masuk supaya defaultValues sync.
export const ProfileForm = () => {
  const { t } = useTranslation();
  const profile = useProfile();
  const update = useUpdateProfile();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      display_name: profile.data?.display_name ?? '',
      avatar_emoji: profile.data?.avatar_emoji ?? '',
    },
  });

  // Re-init form pas profile data fetched (avoid race: form mount sebelum query resolve).
  useEffect(() => {
    if (profile.data) {
      form.reset({
        display_name: profile.data.display_name,
        avatar_emoji: profile.data.avatar_emoji ?? '',
      });
    }
  }, [profile.data, form]);

  const onSubmit = (values: UpdateProfileInput) => {
    update.mutate(values);
  };

  if (profile.isLoading) {
    return (
      <p className="py-2 text-sm text-muted-foreground">{t('common.loading')}</p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.field.display-name')}</FormLabel>
              <FormControl>
                <Input autoComplete="nickname" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatar_emoji"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.field.avatar-emoji')}</FormLabel>
              <FormControl>
                <Input
                  maxLength={8}
                  placeholder="😊"
                  className="text-2xl text-center w-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {update.error && (
          <p className="text-sm text-destructive" role="alert">
            {update.error.message}
          </p>
        )}
        {update.isSuccess && !update.isPending && (
          <p className="text-sm text-fertile" role="status">
            {t('profile.saved')}
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={update.isPending || !form.formState.isDirty}
        >
          {update.isPending ? t('profile.saving') : t('profile.save')}
        </Button>
      </form>
    </Form>
  );
};
