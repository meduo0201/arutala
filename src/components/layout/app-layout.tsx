import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';

// Persistent shell untuk tab routes (/, /calendar, /insights, /settings, /logs).
// Pure layout—no auth/couple guard di sini, parent route already handle that.
//
// Page transitions (Phase 4 Track D4): subtle fade + 8px slide between tabs.
// AnimatePresence dengan key per pathname → smooth swap saat NavLink click.
// Reduced-motion: instant swap (no animation).
export const AppLayout = () => {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -8 }}
          transition={{
            duration: reduced ? 0 : 0.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomTabBar />
    </>
  );
};
