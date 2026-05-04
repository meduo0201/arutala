import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// `cn()` — standard shadcn/ui className merge helper.
// `clsx` handle conditional/array, `twMerge` resolve Tailwind conflicts
// (e.g. `cn('p-2', condition && 'p-4')` → 'p-4' wins).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
