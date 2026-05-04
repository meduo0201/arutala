import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation, type Locale } from '@/lib/i18n';

// Language picker untuk Settings. Locale persisted via Zustand di useLocaleStore.
// Sync auto ke `<html lang>` via main.tsx subscriber.
export const LocaleSwitcher = () => {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Languages className="size-4 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">{t('settings.language.label')}</p>
      </div>
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id">Bahasa Indonesia</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
