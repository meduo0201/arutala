import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { AppErrorBoundary } from '@/components/error-boundary';
import { router } from '@/router';
import { queryClient } from '@/lib/query-client';
import { useLocaleStore } from '@/lib/i18n';
import { applyTheme, useThemeStore } from '@/stores/theme-store';
import { initializeAuth } from '@/features/auth/store';
import '@/globals.css';

const root = document.getElementById('root');
if (!root) {
  document.body.textContent = '页面无法启动，请刷新后重试。';
  throw new Error('Root element #root not found in index.html');
}

// Sync <html lang> dengan current locale (initial mount + subsequent changes).
// Pakai vanilla store subscribe (bukan React hook) supaya gak butuh layout component.
const syncHtmlLang = (locale: string) => {
  document.documentElement.lang = locale;
};
syncHtmlLang(useLocaleStore.getState().locale);
useLocaleStore.subscribe((state) => syncHtmlLang(state.locale));

// Apply persisted theme (dark default per DESIGN.md). Subscribe untuk auto-update.
applyTheme(useThemeStore.getState().theme);
useThemeStore.subscribe((state) => applyTheme(state.theme));

// Bootstrap Supabase auth listener (initial session fetch + onAuthStateChange).
initializeAuth();

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            duration: 3000,
          }}
        />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
