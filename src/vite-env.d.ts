/// <reference types="vite/client" />

// Custom env variables — augment Vite's `ImportMetaEnv` so that
// `import.meta.env.VITE_*` is typed at the consumer call site.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Branding/identity (optional — falls back to placeholders).
  readonly VITE_DATA_CONTROLLER_NAME?: string;
  readonly VITE_DATA_CONTROLLER_EMAIL?: string;
  readonly VITE_PRIVACY_NOTICE_URL?: string;
  // Push notifications (Phase 4 Track C).
  readonly VITE_PUSH_VAPID_PUBLIC_KEY?: string;
  // Captcha (Phase 4 Track E).
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
