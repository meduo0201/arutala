// Motion primitives — Material Design 3 timing + reduced-motion respect.
//
// Spec:
//   - Standard easing:    cubic-bezier(0.4, 0, 0.2, 1)
//   - Emphasized easing:  cubic-bezier(0.2, 0, 0, 1)  — hero moments
//   - Duration short:     100-200ms (button press)
//   - Duration medium:    250-400ms (page/card enter, sheet)
//   - Duration long:      400-500ms (complex hero)
//
// Reduced-motion: motion lib's `useReducedMotion` returns true kalau user
// pasang `prefers-reduced-motion: reduce` — kita pass duration: 0 untuk
// instant swap (no flicker).

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { type ReactNode } from 'react';

// M3 standard easing curve (kept as readonly tuple for type safety)
const STANDARD_EASING = [0.4, 0, 0.2, 1] as const;
const EMPHASIZED_EASING = [0.2, 0, 0, 1] as const;

const MEDIUM_DURATION = 0.25;
const LONG_DURATION = 0.4;

// ---------- FadeIn — content reveal ----------

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Slide up offset in px during fade-in. Default 8 (subtle). 0 = pure fade. */
  yOffset?: number;
  /** Delay in seconds before animation starts. */
  delay?: number;
  /** Duration in seconds. Defaults to medium 0.25s. */
  duration?: number;
}

export const FadeIn = ({
  children,
  yOffset = 8,
  delay = 0,
  duration = MEDIUM_DURATION,
  ...rest
}: FadeInProps) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : duration,
        delay: reduced ? 0 : delay,
        ease: [...STANDARD_EASING],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

// ---------- ScaleIn — modal-like emphasis (cards, dialogs) ----------

interface ScaleInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Initial scale. Default 0.96 (subtle). */
  fromScale?: number;
  delay?: number;
}

export const ScaleIn = ({
  children,
  fromScale = 0.96,
  delay = 0,
  ...rest
}: ScaleInProps) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: reduced ? 1 : fromScale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: reduced ? 0 : LONG_DURATION,
        delay: reduced ? 0 : delay,
        ease: [...EMPHASIZED_EASING],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

// ---------- StaggerChildren — list reveal (children FadeIn one-by-one) ----------

interface StaggerProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Delay between each child animation start. Default 0.05s. */
  stagger?: number;
}

export const StaggerChildren = ({
  children,
  stagger = 0.05,
  ...rest
}: StaggerProps) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : stagger,
          },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

// ---------- Pulse — looping subtle scale (e.g., active indicator) ----------

interface PulseProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Min scale (full = 1). Default 0.92. */
  minScale?: number;
  /** Period in seconds. Default 1.5s (slow + calm). */
  period?: number;
}

export const Pulse = ({
  children,
  minScale = 0.92,
  period = 1.5,
  ...rest
}: PulseProps) => {
  const reduced = useReducedMotion();
  if (reduced) return <div {...(rest as unknown as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  return (
    <motion.div
      animate={{ scale: [1, minScale, 1] }}
      transition={{
        duration: period,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
