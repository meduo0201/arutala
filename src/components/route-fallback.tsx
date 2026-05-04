import { Skeleton } from '@/components/ui/skeleton';

// Generic loading fallback for lazy-loaded route components. Mirrors the layout
// of the home page (header + cards) so the user does not see a content shift
// once the chunk hydrates.
export const RouteFallback = () => (
  <div className="min-h-dvh bg-background p-4">
    <div className="mx-auto max-w-md space-y-4 pt-12">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);
