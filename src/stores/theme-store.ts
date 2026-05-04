import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

// Persisted via localStorage. Default `dark` per DESIGN.md (cycle tracker
// users prefer dark for night use + eye strain reduction).
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'arutala-theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Apply theme to `<html>` class — toggles `.dark` so Tailwind v4 `@custom-variant dark` kicks in. */
export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};
