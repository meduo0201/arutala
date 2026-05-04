import { useEffect, useRef } from 'react';

// Cloudflare Turnstile widget wrapper. Loads Turnstile JS SDK on demand
// (via standard <script> injection in index.html or here) dan renders widget
// di element ref'd. Turnstile auto-mode: invisible kalau bisa, fallback ke
// challenge UI.
//
// Setup steps:
//   1. Create a Turnstile site in the Cloudflare dashboard.
//   2. Set VITE_TURNSTILE_SITE_KEY in .env.local + your hosting env.
//   3. Set the Supabase Auth captcha_secret via the Management API
//      using the secret Cloudflare provides.
//
// Component is graceful: if VITE_TURNSTILE_SITE_KEY is not set, it
// returns null (no render, no signup block). Production-ready once
// keys are configured.

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptLoaded = false;
let scriptPromise: Promise<void> | null = null;

const ensureTurnstileScript = (): Promise<void> => {
  if (scriptLoaded) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      // already injected by previous mount
      existing.addEventListener('load', () => {
        scriptLoaded = true;
        resolve();
      });
      return;
    }
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(script);
  });
  return scriptPromise;
};

interface TurnstileWidgetProps {
  /** Called dengan token saat user solve challenge. Pass token ke supabase
   *  signIn / signUp via { options: { captchaToken: ... } }. */
  onToken: (token: string) => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export const TurnstileWidget = ({
  onToken,
  onError,
  theme = 'auto',
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = import.meta.env['VITE_TURNSTILE_SITE_KEY'] as
    | string
    | undefined;

  useEffect(() => {
    if (!siteKey) return;
    if (!containerRef.current) return;

    let cancelled = false;
    void ensureTurnstileScript().then(() => {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size: 'flexible',
        callback: (token) => onToken(token),
        'error-callback': () => onError?.(),
        'expired-callback': () => onError?.(),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // best-effort
        }
      }
    };
  }, [siteKey, theme, onToken, onError]);

  if (!siteKey) {
    // Turnstile not configured: silently render nothing. Signup still
    // works without captcha (opt-in once keys are set).
    return null;
  }

  return <div ref={containerRef} className="my-2" />;
};
