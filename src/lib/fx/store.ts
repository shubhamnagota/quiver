import { create } from 'zustand';
import { isFresh, readCache, refreshRates, type RatesSnapshot } from './rates';

interface FxState {
  snapshot: RatesSnapshot | null;
  loading: boolean;
  error?: string;
  /** Shows cached rates immediately, then refreshes in the background if they're old. */
  load: () => Promise<void>;
}

export const useFx = create<FxState>()((set, get) => ({
  // Cached rates are available synchronously, e.g. for palette quick answers.
  snapshot: typeof localStorage === 'undefined' ? null : readCache(),
  loading: false,
  load: async () => {
    if (get().loading) return;
    const cached = get().snapshot ?? readCache();
    set({ snapshot: cached, loading: !cached || !isFresh(cached, Date.now()) });
    const { snapshot, error } = await refreshRates();
    set({ snapshot: snapshot ?? cached, error, loading: false });
  },
}));
