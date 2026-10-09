import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';

export const MAX_RECENTS = 8;

interface PrefsState {
  theme: Theme;
  favorites: string[];
  recents: string[];
  setTheme: (theme: Theme) => void;
  toggleFavorite: (id: string) => void;
  moveFavorite: (id: string, direction: -1 | 1) => void;
  addRecent: (id: string) => void;
  importPrefs: (data: unknown) => void;
  reset: () => void;
}

const defaults = { theme: 'dark' as Theme, favorites: [] as string[], recents: [] as string[] };

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => set({ theme }),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      moveFavorite: (id, direction) =>
        set((s) => {
          const i = s.favorites.indexOf(id);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= s.favorites.length) return s;
          const favorites = [...s.favorites];
          [favorites[i], favorites[j]] = [favorites[j]!, favorites[i]!];
          return { favorites };
        }),
      addRecent: (id) =>
        set((s) => ({ recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, MAX_RECENTS) })),
      importPrefs: (data) => {
        if (typeof data !== 'object' || data === null) throw new Error('Settings file is not an object');
        const d = data as Record<string, unknown>;
        set((s) => ({
          theme: d.theme === 'dark' || d.theme === 'light' || d.theme === 'system' ? d.theme : s.theme,
          favorites: isStringArray(d.favorites) ? d.favorites : s.favorites,
          recents: isStringArray(d.recents) ? d.recents.slice(0, MAX_RECENTS) : s.recents,
        }));
      },
      reset: () => set(defaults),
    }),
    {
      name: 'quiver-prefs',
      partialize: ({ theme, favorites, recents }) => ({ theme, favorites, recents }),
    },
  ),
);
