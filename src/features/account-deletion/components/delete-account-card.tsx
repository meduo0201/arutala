import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { deleteAccount } from '@/features/account-deletion/api';
import { signOut as signOutApi } from '@/features/auth/api/mutations';
import { useTranslation } from '@/lib/i18n';
import { formatUserError } from '@/lib/user-error';

// Self-service delete account dengan type-to-confirm safeguard.
// Flow: button → dialog → type keyword → mutation → signOut global → redirect.
//
// signOut bukan via useSignOut hook karena kita gak butuh queryClient.clear()
// di sini (page bakal full-reload via window.location ke /login). Direct API call.
export const DeleteAccountCard = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const expectedKeyword = t('delete-account.dialog.confirm-keyword');

  const mutation = useMutation({
    mutationFn: async () => {
      await deleteAccount();
      // Setelah RPC sukses, signOut global biar refresh tokens revoked
      // di semua device + clear local cache.
      try {
        await signOutApi();
      } catch {
        // Best-effort: kalau signOut error, tetap redirect ke /login.
      }
    },
    onSuccess: () => {
      // Hard reload ke /login — clear semua React state + redirect.
      window.location.replace('/login');
    },
  });

  const canConfirm = typed.trim().toUpperCase() === expectedKeyword.toUpperCase();

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive inline-flex items-center gap-2">
          <Trash2 className="size-4" />
          {t('delete-account.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('delete-account.description')}
        </p>
        <AlertDialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setTyped('');
          }}
        >
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {t('delete-account.button')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                {t('delete-account.dialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('delete-account.dialog.body')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              <label className="text-sm font-medium" htmlFor="delete-confirm">
                {t('delete-account.dialog.confirm-label')}
              </label>
              <Input
                id="delete-confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                placeholder={expectedKeyword}
                className="font-mono"
              />
            </div>
            {mutation.error && (
              <p className="text-sm text-destructive" role="alert">
                {formatUserError(mutation.error, t('toast.error.generic'))}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutation.isPending}>
                {t('delete-account.dialog.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (!canConfirm) return;
                  mutation.mutate();
                }}
                disabled={!canConfirm || mutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {mutation.isPending
                  ? t('delete-account.deleting')
                  : t('delete-account.dialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
