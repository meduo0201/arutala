import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useUnlinkCouple } from '@/features/couples/hooks/use-couple-mutations';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

// Destructive action with explicit confirmation. Pasca-unlink, user redirect
// ke /couple-setup via CoupleRequiredRoute (next nav).
export const UnlinkCoupleDialog = () => {
  const { t } = useTranslation();
  const unlink = useUnlinkCouple();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          disabled={unlink.isPending}
        >
          {unlink.isPending ? t('couple.unlink.unlinking') : t('couple.unlink.button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('couple.unlink.confirm-title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('couple.unlink.confirm-body')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {unlink.error && (
          <p className="text-sm text-destructive" role="alert">
            {formatUserError(unlink.error, t('toast.error.generic'))}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('couple.unlink.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              unlink.mutate();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('couple.unlink.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
