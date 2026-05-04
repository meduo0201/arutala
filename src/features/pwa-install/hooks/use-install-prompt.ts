import { useCallback, useEffect, useState } from 'react';

// Chrome / Edge / Android: spec'd `BeforeInstallPromptEvent`. Belum di lib.dom
// jadi declare narrow shape di sini.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Chrome/Android & desktop PWA
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari fallback (non-standard)
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
};

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
};

interface InstallPromptState {
  canInstall: boolean; // beforeinstallprompt fired & belum dipakai
  installed: boolean; // running standalone OR appinstalled fired
  isIOS: boolean; // iOS = manual instructions only (no programmatic prompt)
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

// Hook PWA install lifecycle:
// - Capture `beforeinstallprompt` (Chrome/Edge/Android) untuk programmatic prompt.
// - Detect standalone mode (sudah ke-install) → hide CTA.
// - iOS Safari: gak punya programmatic prompt, expose flag biar UI render guidance manual.
export const useInstallPrompt = (): InstallPromptState => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable' as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    canInstall: !!deferred && !installed,
    installed,
    isIOS: isIOS(),
    promptInstall,
  };
};
