import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// `defineConfig` di-import dari `vitest/config` (bukan `vite`) supaya TS recognize
// `test` field tanpa perlu triple-slash reference. Behavior Vite tetap identik.
//
// Path alias `@/*` → `./src/*` mirrors tsconfig.app.json so editor + bundler agree.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // injectManifest mode (Phase 4 Track C): kita tulis sw.ts custom
      // untuk handle push event. Workbox precache injected via self.__WB_MANIFEST.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false, // we use vite-plugin-pwa virtual module di main.tsx
      registerType: 'autoUpdate',
      // Bundle public/icons/ ke service worker precache.
      includeAssets: ['icons/*.png'],
      manifest: {
        name: '经期记录',
        short_name: '经期记录',
        description:
          '面向个人与伴侣的经期与周期记录，隐私优先。',
        theme_color: '#F8E4E8',
        background_color: '#FDF6F7',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'zh-CN',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // injectManifest mode: workbox config moved ke src/sw.ts.
      devOptions: {
        // Enable PWA di dev—buat test install flow tanpa harus build production.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Bundle splitting: keep vendor code in stable, cacheable chunks so route-
    // level lazy chunks stay small. Threshold raised slightly because the PWA
    // runtime + react vendor naturally land in the 300-400 KB range.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query', 'zustand'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'date-vendor': ['date-fns', 'react-day-picker'],
          'chart-vendor': ['recharts'],
          'motion-vendor': ['motion'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    passWithNoTests: true,
  },
});
