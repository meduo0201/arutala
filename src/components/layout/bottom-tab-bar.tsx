import { BarChart3, CalendarDays, Home, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation, type MessageKey } from '@/lib/i18n';

// 4-tab persistent bottom navigation. Mobile-native pattern (Apple HIG / Material).
// Position: fixed bottom + safe-area inset (iOS notch). 64px height + ~12px safe-area
// → ~76px total reserved space. Pages should pb-20 minimum.
//
// Active state: filled icon + primary color text. Inactive: outline icon + muted.

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
      aria-label="Primary"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40',
        'border-t border-border bg-background/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="max-w-md mx-auto flex items-stretch justify-around px-2">
        {TABS.map(({ to, labelKey, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              aria-label={t(labelKey)}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5',
                  'h-16 min-w-16 select-none transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('size-5', isActive && 'fill-primary/15')}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] leading-none font-medium">
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
