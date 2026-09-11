import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTranslation, type MessageKey } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Role = 'tracker' | 'supporter';
type SoloChoice = 'solo' | 'couple';

interface ChoiceCardProps {
  active: boolean;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  onClick: () => void;
}

const ChoiceCard = ({ active, titleKey, bodyKey, onClick }: ChoiceCardProps) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full min-h-20 text-left rounded-xl border-2 p-4 transition-all',
        'hover:bg-muted/30 active:scale-[0.99] motion-reduce:active:scale-100',
        active
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-background',
      )}
    >
      <h3 className="text-base font-semibold mb-1">{t(titleKey)}</h3>
      <p className="text-sm text-muted-foreground leading-snug">{t(bodyKey)}</p>
    </button>
  );
};

const OnboardingRolePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [solo, setSolo] = useState<SoloChoice | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1: pilih role. Step 2 hanya muncul kalau role=tracker (supporter
  // selalu butuh couple, gak ada pilihan solo).
  const showSoloStep = role === 'tracker';
  const canSubmit = role !== null && (role === 'supporter' || solo !== null);

  const handleSubmit = async () => {
    if (!user || !role) return;
    setBusy(true);
    try {
      const isSolo = role === 'tracker' && solo === 'solo';
      const { error } = await supabase
        .from('profiles')
        .update({ role, is_solo: isSolo })
        .eq('id', user.id);
      if (error) throw error;

      // Route post-update:
      //   tracker + solo → /
      //   tracker + couple → /couple-setup
      //   supporter → /couple-setup
      if (role === 'tracker' && isSolo) {
        navigate('/', { replace: true });
      } else {
        navigate('/couple-setup', { replace: true });
      }
    } catch {
      toast.error(t('onboarding.error'));
      setBusy(false);
    }
  };

  return (
    <PageShell>
        <header className="space-y-2 text-center">
          <img src="/logo.svg" alt="" aria-hidden="true" className="size-16 mx-auto" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('onboarding.role.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('onboarding.role.subtitle')}
          </p>
        </header>

        <Card>
          <CardContent className="py-4 space-y-3">
            <ChoiceCard
              active={role === 'tracker'}
              titleKey="onboarding.role.tracker.title"
              bodyKey="onboarding.role.tracker.body"
              onClick={() => setRole('tracker')}
            />
            <ChoiceCard
              active={role === 'supporter'}
              titleKey="onboarding.role.supporter.title"
              bodyKey="onboarding.role.supporter.body"
              onClick={() => {
                setRole('supporter');
                setSolo(null); // supporter gak punya pilihan solo
              }}
            />
          </CardContent>
        </Card>

        {showSoloStep && (
          <>
            <header className="space-y-2 text-center pt-2">
              <h2 className="text-lg font-semibold">
                {t('onboarding.solo.title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.solo.subtitle')}
              </p>
            </header>
            <Card>
              <CardContent className="py-4 space-y-3">
                <ChoiceCard
                  active={solo === 'solo'}
                  titleKey="onboarding.solo.solo.title"
                  bodyKey="onboarding.solo.solo.body"
                  onClick={() => setSolo('solo')}
                />
                <ChoiceCard
                  active={solo === 'couple'}
                  titleKey="onboarding.solo.couple.title"
                  bodyKey="onboarding.solo.couple.body"
                  onClick={() => setSolo('couple')}
                />
              </CardContent>
            </Card>
          </>
        )}

        <Button
          type="button"
          size="lg"
          className="w-full h-12 transition-transform active:scale-[0.98]"
          disabled={!canSubmit || busy}
          onClick={handleSubmit}
        >
          {busy ? t('onboarding.saving') : t('onboarding.role.next')}
        </Button>
    </PageShell>
  );
};

export default OnboardingRolePage;
