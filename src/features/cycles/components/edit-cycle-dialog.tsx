import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteCycle,
  useEndPeriod,
  useStartPeriod,
  useUpdateCycle,
} from '@/features/cycles/hooks/use-cycle-mutations';
import type { CycleRow } from '@/features/cycles/types';
import { todayIso } from '@/lib/format-date';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

// Combined dialog buat dua mode:
// - Add (no `cycle` prop): create new cycle dengan custom dates (backdate flow)
// - Edit (`cycle` prop): pre-fill form, save calls update; tombol Delete extra
//
// Native HTML5 `<input type="date">` dipake—mobile-friendly (system date picker).
// react-day-picker (Milestone E nanti) untuk calendar grid view.

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式须为 YYYY-MM-DD。');

const formSchema = z
  .object({
    start_date: isoDate,
    end_date: z.union([isoDate, z.literal('')]).optional(),
    notes: z.string().max(500, '备注过长（最多 500 字）。').optional(),
  })
  .refine(
    (data) => !data.end_date || data.end_date >= data.start_date,
    {
      message: '结束日期不能早于开始日期。',
      path: ['end_date'],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface EditCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle?: CycleRow | undefined;
  /** Default start_date in add mode (e.g. from calendar tap). Defaults to today. */
  defaultStartDate?: string | undefined;
}

export const EditCycleDialog = ({
  open,
  onOpenChange,
  cycle,
  defaultStartDate,
}: EditCycleDialogProps) => {
  const { t } = useTranslation();
  const isEdit = !!cycle;

  const startPeriod = useStartPeriod();
  const endPeriod = useEndPeriod();
  const updateCycleM = useUpdateCycle();
  const deleteCycleM = useDeleteCycle();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: cycle?.start_date ?? defaultStartDate ?? todayIso(),
      end_date: cycle?.end_date ?? '',
      notes: cycle?.notes ?? '',
    },
  });

  // Re-init form pas dialog open atau cycle/defaultStartDate berubah.
  useEffect(() => {
    if (open) {
      form.reset({
        start_date: cycle?.start_date ?? defaultStartDate ?? todayIso(),
        end_date: cycle?.end_date ?? '',
        notes: cycle?.notes ?? '',
      });
    }
  }, [open, cycle, defaultStartDate, form]);

  const onSubmit = async (values: FormValues) => {
    const trimmedNotes = values.notes?.trim();
    const notesParam: { notes?: string | undefined } = trimmedNotes
      ? { notes: trimmedNotes }
      : {};

    if (isEdit && cycle) {
      await updateCycleM.mutateAsync({
        cycle_id: cycle.id,
        start_date: values.start_date,
        end_date: values.end_date || null,
        ...notesParam,
      });
    } else {
      const created = await startPeriod.mutateAsync({
        start_date: values.start_date,
        ...notesParam,
      });
      if (values.end_date) {
        await endPeriod.mutateAsync({
          cycle_id: created.id,
          end_date: values.end_date,
        });
      }
    }
    onOpenChange(false);
  };

  const onDelete = async () => {
    if (!cycle) return;
    if (!window.confirm(t('cycles.dialog.delete-confirm'))) return;
    await deleteCycleM.mutateAsync(cycle.id);
    onOpenChange(false);
  };

  const isPending =
    startPeriod.isPending ||
    endPeriod.isPending ||
    updateCycleM.isPending ||
    deleteCycleM.isPending;
  const apiError =
    startPeriod.error ||
    endPeriod.error ||
    updateCycleM.error ||
    deleteCycleM.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('cycles.dialog.edit-title') : t('cycles.dialog.add-title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('cycles.dialog.edit-description')
              : t('cycles.dialog.add-description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cycles.dialog.field.start-date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cycles.dialog.field.end-date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cycles.dialog.field.notes')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {apiError && (
              <p className="text-sm text-destructive" role="alert">
                {formatUserError(apiError, t('toast.error.generic'))}
              </p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive sm:mr-auto"
                  onClick={onDelete}
                  disabled={isPending}
                >
                  {t('cycles.dialog.delete')}
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? t('cycles.dialog.saving') : t('cycles.dialog.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
