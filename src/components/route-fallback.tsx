import { Skeleton } from '@/components/ui/skeleton';

// Generic loading fallback for lazy-loaded route components. Mirrors the layout
// of the home page (header + cards) so the user does not see a content shift
// once the chunk hydrates.
export const RouteFallback = () => (
  <div className="min-h-dvh p-5">
    <div className="mx-auto max-w-[28rem] space-y-7 pt-12">
      <Skeleton className="h-9 w-48 rounded-xl" />
      <Skeleton className="h-56 w-full rounded-3xl" />
      <Skeleton className="h-28 w-full rounded-3xl" />
    </div>
  </div>
);

/** Auth pages: text-only, no salmon skeleton flash. */
export const AuthFallback = () => (
  <div className="flex min-h-dvh items-center justify-center">
    <p className="text-sm text-muted-foreground">加载中…</p>
  </div>
);
