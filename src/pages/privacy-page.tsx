import { ChevronLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { ConsentHistoryCard } from '@/features/consent/components/consent-history-card';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';

// Data-controller fields stay env-driven. Chinese placeholders when unset.
const DATA_CONTROLLER_NAME =
  import.meta.env.VITE_DATA_CONTROLLER_NAME ?? '';
const DATA_CONTROLLER_EMAIL =
  import.meta.env.VITE_DATA_CONTROLLER_EMAIL ?? '';
const PRIVACY_NOTICE_URL = import.meta.env.VITE_PRIVACY_NOTICE_URL ?? '';

const PrivacyPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const controllerName =
    DATA_CONTROLLER_NAME.trim() || t('privacy.controller.placeholder-name');
  const controllerEmail = DATA_CONTROLLER_EMAIL.trim();
  const backTo = user ? '/settings' : '/login';

  return (
    <PageShell>
      <header className="flex items-center gap-2">
        <Link
          to={backTo}
          aria-label={t('settings.back')}
          className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-muted -ml-2"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="page-heading text-[1.7rem]">
            {t('privacy.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('privacy.subtitle')}
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          <p>{t('privacy.intro')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.controller')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">
              {t('privacy.controller.name-label')}：
            </span>{' '}
            <span className="font-medium">{controllerName}</span>
          </p>
          <p>
            <span className="text-muted-foreground">
              {controllerEmail
                ? t('privacy.controller.email-label')
                : t('privacy.controller.contact-label')}
              ：
            </span>{' '}
            {controllerEmail ? (
              <a
                href={`mailto:${controllerEmail}`}
                className="font-medium text-primary underline underline-offset-4"
              >
                {controllerEmail}
              </a>
            ) : (
              <span className="font-medium">
                {t('privacy.controller.placeholder-contact')}
              </span>
            )}
          </p>
          <p>
            <span className="text-muted-foreground">
              {t('privacy.controller.status-label')}：
            </span>{' '}
            <span className="font-medium">
              {t('privacy.controller.status-value')}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.data-types')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">{t('privacy.data.general')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.data.general-1')}</li>
            <li>{t('privacy.data.general-2')}</li>
          </ul>
          <p className="text-muted-foreground pt-2">
            {t('privacy.data.sensitive')}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.data.sensitive-1')}</li>
            <li>{t('privacy.data.sensitive-2')}</li>
            <li>{t('privacy.data.sensitive-3')}</li>
            <li>{t('privacy.data.sensitive-4')}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.purposes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t('privacy.purposes.body')}</p>
          <p className="text-muted-foreground italic">
            {t('privacy.purposes.disclaimer')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.legal-basis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t('privacy.legal.body')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.retention')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.retention.1')}</li>
            <li>{t('privacy.retention.2')}</li>
            <li>{t('privacy.retention.3')}</li>
            <li>{t('privacy.retention.4')}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.transfer')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t('privacy.transfer.body')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('privacy.section.rights')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('privacy.rights.1')}</li>
            <li>{t('privacy.rights.2')}</li>
            <li>{t('privacy.rights.3')}</li>
            <li>{t('privacy.rights.4')}</li>
            <li>{t('privacy.rights.5')}</li>
            <li>{t('privacy.rights.6')}</li>
          </ul>
          <p className="pt-2 text-muted-foreground">
            {t('privacy.rights.sla')}
          </p>
        </CardContent>
      </Card>

      {PRIVACY_NOTICE_URL ? (
        <a
          href={PRIVACY_NOTICE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="surface-link"
        >
          <span className="font-medium">{t('privacy.full-text-link')}</span>
          <ExternalLink className="size-4 text-muted-foreground" />
        </a>
      ) : null}

      {user ? <ConsentHistoryCard /> : null}
    </PageShell>
  );
};

export default PrivacyPage;
