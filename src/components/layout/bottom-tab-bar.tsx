import { BarChart3, CalendarDays, Home, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation, type MessageKey } from '@/lib/i18n';

// Floating pill tab bar. Active: filled chip + primary ink. Inactive: muted.

interface TabDef {
  to: string;
  labelKey: MessageKey;
  Icon: typeof Home;
  end: boolean;
}

const TABS: readonly TabDef[] = [
  { to: '/', labelKey: 'nav.home', Icon: Home, end: true },
  { to: '/calendar', labelKey: 'nav.calendar', Icon: CalendarDays, end: false },
  { to: '/insights', labelKey: 'nav.insights', Icon: BarChart3, end: false },
  { to: '/settings', labelKey: 'nav.settings', Icon: User, end: false },
] as const;

export const BottomTabBar = () => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label="主导航"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto mx-auto flex max-w-[28rem] items-stretch justify-around gap-1 rounded-full border border-border/60 bg-card/80 px-1.5 py-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl">
        {TABS.map(({ to, labelKey, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              aria-label={t(labelKey)}
              className={({ isActive }) =>
                cn(
                  'flex h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-full',
                  'select-none touch-manipulation transition-colors',
                  isActive
                    ? 'bg-primary/14 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('size-5', isActive && 'fill-primary/20')}
                    aria-hidden="true"
                  />
                  <span className="text-[0.68rem] font-medium leading-none">
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
