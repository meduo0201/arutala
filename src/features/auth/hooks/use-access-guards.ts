import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { signOut as signOutApi } from '@/features/auth/api/mutations';
import { sessionNeedsAal2 } from '@/features/mfa/api';
import {
  ACCOUNT_SOFT_DELETED_MESSAGE,
  isProfileSoftDeleted,
} from '@/features/account-deletion/lib/soft-delete';

export type AccessGuardState =
  | 'loading'
  | 'ok'
  | 'aal2'
  | 'deleted';

export const useAccessGuards = () => {
  const { user, initialized } = useAuth();
  const [state, setState] = useState<AccessGuardState>('loading');
  const [deletedMessage] = useState(ACCOUNT_SOFT_DELETED_MESSAGE);
  const [aalTick, setAalTick] = useState(0);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      setState('ok');
      return;
    }

    let cancelled = false;
    const run = async () => {
      setState('loading');
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('deleted_at')
          .eq('id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (isProfileSoftDeleted(profile)) {
          try {
            await signOutApi();
          } catch {
            // still block the app
          }
          setState('deleted');
          return;
        }

        const needsAal2 = await sessionNeedsAal2();
        if (cancelled) return;
        setState(needsAal2 ? 'aal2' : 'ok');
      } catch {
        if (!cancelled) setState('ok');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [initialized, user, aalTick]);

  return {
    state,
    deletedMessage,
    markAal2Satisfied: () => setAalTick((n) => n + 1),
  };
};
