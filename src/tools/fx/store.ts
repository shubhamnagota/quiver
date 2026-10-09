import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Pair = [string, string];

interface FxPrefs {
  from: string;
  targets: string[];
  pairs: Pair[];
  setFrom: (code: string) => void;
  setTargets: (targets: string[]) => void;
  setPairs: (pairs: Pair[]) => void;
}

export const useFxPrefs = create<FxPrefs>()(
  persist(
    (set) => ({
      from: 'AED',
      targets: ['INR', 'USD', 'EUR'],
      pairs: [['AED', 'INR'], ['USD', 'INR'], ['USD', 'AED']],
      setFrom: (from) => set({ from }),
      setTargets: (targets) => set({ targets }),
      setPairs: (pairs) => set({ pairs }),
    }),
    { name: 'quiver-fx-prefs' },
  ),
);
