import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface City {
  zone: string;
  label: string;
}

interface ClockState {
  cities: City[];
  add: (city: City) => void;
  remove: (zone: string) => void;
  move: (zone: string, direction: -1 | 1) => void;
}

export const useClock = create<ClockState>()(
  persist(
    (set) => ({
      cities: [
        { zone: 'Asia/Dubai', label: 'Dubai' },
        { zone: 'Asia/Kolkata', label: 'India' },
      ],
      add: (city) => set((s) => (s.cities.some((c) => c.zone === city.zone) ? s : { cities: [...s.cities, city] })),
      remove: (zone) => set((s) => ({ cities: s.cities.filter((c) => c.zone !== zone) })),
      move: (zone, direction) =>
        set((s) => {
          const i = s.cities.findIndex((c) => c.zone === zone);
          const j = i + direction;
          if (i < 0 || j < 0 || j >= s.cities.length) return s;
          const cities = [...s.cities];
          [cities[i], cities[j]] = [cities[j]!, cities[i]!];
          return { cities };
        }),
    }),
    { name: 'quiver-clock' },
  ),
);
