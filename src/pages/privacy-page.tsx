import { ChevronLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConsentHistoryCard } from '@/features/consent/components/consent-history-card';
import { useTranslation } from '@/lib/i18n';

// Privacy notice — in-app render of the data-controller statement.
// Wording is stable and rendered as plain paragraphs (no markdown to avoid
// extra deps + DOMPurify). Update CURRENT_PRIVACY_NOTICE_VERSION in
// features/consent/types.ts whenever the wording changes materially.
//
// Data-controller fields are sourced from build-time env vars so a forked
// instance can identify its own controller without code edits. Defaults are
// generic placeholders that an operator MUST replace before going to prod.
const DATA_CONTROLLER_NAME =
  import.meta.env.VITE_DATA_CONTROLLER_NAME ?? '[Data Controller Name]';
const DATA_CONTROLLER_EMAIL =
  import.meta.env.VITE_DATA_CONTROLLER_EMAIL ?? 'privacy@example.com';
const PRIVACY_NOTICE_URL = import.meta.env.VITE_PRIVACY_NOTICE_URL ?? '';

const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-6">
        <header className="flex items-center gap-2">
          <Link
            to="/settings"
            aria-label={t('settings.back')}
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted -ml-2"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
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
              <span className="text-muted-foreground">Nama:</span>{' '}
              <span className="font-medium">{DATA_CONTROLLER_NAME}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              <a
                href={`mailto:${DATA_CONTROLLER_EMAIL}`}
                className="font-medium text-primary underline underline-offset-4"
              >
                {DATA_CONTROLLER_EMAIL}
              </a>
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{' '}
              <span className="font-medium">
                Personal developer (perorangan, bukan badan hukum)
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
            <p className="text-muted-foreground">Data umum:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email, nama panggilan, avatar emoji</li>
              <li>Timestamp aktivitas (login, last seen)</li>
            </ul>
            <p className="text-muted-foreground pt-2">
              Data spesifik (kesehatan reproduksi — Pasal 4(2)(a)):
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Tanggal mulai &amp; selesai haid, intensitas flow</li>
              <li>Gejala fisik (kram, sakit kepala, jerawat, dll)</li>
              <li>Mood emosional</li>
              <li>Catatan harian (free-text)</li>
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
            <p>
              Data lo dipakai HANYA untuk: (1) fungsi inti tracking siklus,
              (2) sharing dengan pasangan terlinking, (3) notifikasi keamanan
              akun, (4) backup &amp; recovery.
            </p>
            <p className="text-muted-foreground italic">
              Tidak ada iklan, profiling untuk advertising, sale ke pihak ke-3,
              atau pelatihan model AI.
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
            <p>
              Karena data lo termasuk data spesifik kesehatan, dasar hukum
              pemrosesan adalah <b>persetujuan eksplisit</b> per UU PDP
              Pasal 20(2)(a). Bukan kontrak, bukan legitimate interest.
            </p>
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
              <li>Data tetap selama akun aktif</li>
              <li>Setelah hapus akun: soft delete 30 hari → hard delete</li>
              <li>Backup PITR Supabase: 7 hari rolling</li>
              <li>Auth log (IP, user agent): 30 hari</li>
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
            <p>
              Data lo disimpan di luar Indonesia: <b>Supabase Tokyo</b>{' '}
              (database utama) + <b>Cloudflare</b> (edge global, TLS).
              Per Pasal 56(4), butuh consent eksplisit.
            </p>
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
              <li>Hak akses (export CSV di Settings)</li>
              <li>Hak koreksi (edit langsung di app)</li>
              <li>Hak hapus (Settings → Hapus Akun)</li>
              <li>Hak portabilitas (CSV format)</li>
              <li>Hak menarik consent (toggle di Settings)</li>
              <li>Hak tuntut ganti rugi (Pasal 13–15)</li>
            </ul>
            <p className="pt-2 text-muted-foreground">
              SLA respon permintaan akses: 3×24 jam dari email diterima.
            </p>
          </CardContent>
        </Card>

        {PRIVACY_NOTICE_URL ? (
          <a
            href={PRIVACY_NOTICE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">{t('privacy.full-text-link')}</span>
            <ExternalLink className="size-4 text-muted-foreground" />
          </a>
        ) : null}

        <ConsentHistoryCard />
      </div>
    </main>
  );
};

export default PrivacyPage;
