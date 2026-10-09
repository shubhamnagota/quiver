import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quote } from './lib';

export const MAX_QUOTES = 4;

const blank = (name: string): Quote => ({ id: crypto.randomUUID(), name, rate: '', flatFee: '', pctFee: '' });

interface RemittanceState {
  send: string;
  sendCurrency: string;
  receiveCurrency: string;
  quotes: Quote[];
  set: (patch: Partial<Pick<RemittanceState, 'send' | 'sendCurrency' | 'receiveCurrency'>>) => void;
  updateQuote: (id: string, patch: Partial<Quote>) => void;
  addQuote: () => void;
  removeQuote: (id: string) => void;
}

export const useRemittance = create<RemittanceState>()(
  persist(
    (set) => ({
      send: '1000',
      sendCurrency: 'AED',
      receiveCurrency: 'INR',
      quotes: [blank('Provider A'), blank('Provider B')],
      set: (patch) => set(patch),
      updateQuote: (id, patch) => set((s) => ({ quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
      addQuote: () => set((s) => (s.quotes.length >= MAX_QUOTES ? s : { quotes: [...s.quotes, blank(`Provider ${String.fromCharCode(65 + s.quotes.length)}`)] })),
      removeQuote: (id) => set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
    }),
    { name: 'quiver-remittance' },
  ),
);
