import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** `app` reserves space for the bottom tab bar + home-indicator. */
  variant?: 'app' | 'auth';
}

/** Mobile-first page frame: phone width, safe-area insets, thumb-friendly padding. */
export const PageShell = ({
  children,
  className,
  variant = 'app',
}: PageShellProps) => {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div
        className={cn(
          'mx-auto w-full',
          variant === 'app'
            ? 'max-w-md space-y-6 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(5.75rem+env(safe-area-inset-bottom))]'
            : 'flex min-h-dvh max-w-sm flex-col justify-start px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
};
