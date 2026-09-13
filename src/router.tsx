import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { CoupleRequiredRoute } from '@/components/couple-required-route';
import { OptionalAuthLayout } from '@/components/optional-auth-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { AuthFallback, RouteFallback } from '@/components/route-fallback';

// Route-level code splitting (Phase 5 L1). Each page becomes its own async chunk
// so the initial bundle only ships the layout/auth shell. The fallback is kept
// minimal—the auth guards already render a loading state for session checks, so
// per-route Suspense only needs to cover lazy network latency.
const HomePage = lazy(() => import('@/pages/home-page'));
const LoginPage = lazy(() => import('@/pages/login-page'));
const LogsPage = lazy(() => import('@/pages/logs-page'));
const SignupPage = lazy(() => import('@/pages/signup-page'));
const CoupleSetupPage = lazy(() => import('@/pages/couple-setup-page'));
const CalendarPage = lazy(() => import('@/pages/calendar-page'));
const InsightsPage = lazy(() => import('@/pages/insights-page'));
const OnboardingRolePage = lazy(() => import('@/pages/onboarding-role-page'));
const PrivacyPage = lazy(() => import('@/pages/privacy-page'));
const SettingsPage = lazy(() => import('@/pages/settings-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));

const wrap = (node: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{node}</Suspense>
);

const wrapAuth = (node: ReactNode) => (
  <Suspense fallback={<AuthFallback />}>{node}</Suspense>
);

// Phase 3+ router: 2-tier protection + AppLayout shell with bottom tab nav.
//
// Route hierarchy:
//   /login, /signup                            → public, no shell
//   ProtectedRoute (auth required)
//     /couple-setup                            → optional couple linking, no shell
//     AppLayout (renders BottomTabBar)
//       /settings                              → auth-only (works pre-couple)
//       CoupleRequiredRoute
//         /                                    → Home (Hari Ini tab)
//         /calendar                            → Kalender tab
//         /insights                            → Insights tab
//         /logs                                → daily-logs search (linked from /insights)
//
// Tab bar persists on /, /calendar, /insights, /settings, /logs.
export const router = createBrowserRouter([
  // Public auth routes
  { path: '/login', element: wrapAuth(<LoginPage />) },
  { path: '/signup', element: wrapAuth(<SignupPage />) },

  // Privacy is readable without login; signed-in users keep the tab bar.
  {
    element: <OptionalAuthLayout />,
    children: [{ path: '/privacy', element: wrap(<PrivacyPage />) }],
  },

  // Authenticated
  {
    element: <ProtectedRoute />,
    children: [
      // Legacy first-run URL — now redirects home (no required onboarding)
      { path: '/onboarding/role', element: wrap(<OnboardingRolePage />) },
      { path: '/couple-setup', element: wrap(<CoupleSetupPage />) },

      // App shell with persistent bottom tab bar
      {
        element: <AppLayout />,
        children: [
          { path: '/settings', element: wrap(<SettingsPage />) },

          // Couple-required tabs
          {
            element: <CoupleRequiredRoute />,
            children: [
              { path: '/', element: wrap(<HomePage />) },
              { path: '/calendar', element: wrap(<CalendarPage />) },
              { path: '/insights', element: wrap(<InsightsPage />) },
              { path: '/logs', element: wrap(<LogsPage />) },
            ],
          },
        ],
      },
    ],
  },

  // 404 catch-all
  { path: '*', element: wrap(<NotFoundPage />) },
]);
