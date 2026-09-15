import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** `app` reserves space for the bottom tab bar + home-indicator. */
  variant?: 'app' | 'auth';
}

/** Mobile-first page frame: ~390px phone width, safe-area insets, airy padding. */
export const PageShell = ({
  children,
  className,
  variant = 'app',
}: PageShellProps) => {
  return (
    <main className="min-h-dvh text-foreground">
      <div
        className={cn(
          'mx-auto w-full',
          variant === 'app'
            ? 'max-w-[28rem] space-y-7 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(7.25rem+env(safe-area-inset-bottom))]'
            : 'flex min-h-dvh max-w-[22.5rem] flex-col justify-start px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]',
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
};
