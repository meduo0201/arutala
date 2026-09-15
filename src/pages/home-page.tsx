import { Heart, User as UserIcon } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usernameFromAuthEmail } from '@/features/auth/lib/username';
import { useCouple } from '@/features/couples/hooks/use-couple';
import { PeriodActionCard } from '@/features/cycles/components/period-action-card';
import { CycleWheel } from '@/features/cycle-wheel/components/cycle-wheel';
import { TodayLogCard } from '@/features/daily-logs/components/today-log-card';
import { DailyInsightCard } from '@/features/insights/components/daily-insight-card';
import { PredictionSnapshot } from '@/features/prediction/components/prediction-snapshot';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { currentGreetingKey } from '@/features/profile/lib/greeting';
import { useTranslation } from '@/lib/i18n';

const HomePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: couple } = useCouple();
  const { data: profile } = useProfile();

  const partner = couple?.partner;
  const greeting = t(currentGreetingKey());
  const displayName =
    profile?.display_name ||
    usernameFromAuthEmail(user?.email) ||
    t('home.fallback-name');
  const roleKey =
    profile?.role === 'supporter'
      ? 'home.role.supporter'
      : profile?.is_solo
        ? 'home.role.solo'
        : 'home.role.tracker';

  return (
    <PageShell>
      <header className="space-y-3.5">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            className="size-11 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">{greeting}，</p>
            <h1 className="page-heading truncate text-[1.7rem]">
              {displayName}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1.5 font-medium text-primary">
            <UserIcon className="size-3" />
            {t(roleKey)}
          </span>
          {partner ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-3 py-1.5 text-muted-foreground">
              <Heart className="size-3 text-period" />
              {t('home.partner-pill.linked')}{' '}
              <span className="font-medium text-foreground">
                {partner.display_name}
              </span>
            </span>
          ) : profile?.is_solo ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-3 py-1.5 text-muted-foreground">
              {t('home.partner-pill.solo')}
            </span>
          ) : null}
        </div>
      </header>

      <CycleWheel />
      <PeriodActionCard />
      <TodayLogCard />
      <DailyInsightCard />
      <PredictionSnapshot />
    </PageShell>
  );
};

export default HomePage;
