import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useThemeStore } from '@/stores/theme-store';
import { useTranslation } from '@/lib/i18n';

// Inline toggle row buat Settings page. Switch on = dark mode (matches default).
export const ThemeToggle = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="size-4 text-muted-foreground" aria-hidden />
        ) : (
          <Sun className="size-4 text-muted-foreground" aria-hidden />
        )}
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t('settings.theme.label')}</p>
          <p className="text-xs text-muted-foreground">
            {isDark ? t('settings.theme.dark') : t('settings.theme.light')}
          </p>
        </div>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={toggle}
        aria-label={t('settings.theme.label')}
      />
    </div>
  );
};
