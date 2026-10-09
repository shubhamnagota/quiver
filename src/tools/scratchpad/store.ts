import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Pad {
  id: string;
  content: string;
  updatedAt: number;
}

interface PadsState {
  pads: Pad[];
  activeId: string;
  create: () => void;
  update: (id: string, content: string) => void;
  remove: (id: string) => void;
  select: (id: string) => void;
}

const newPad = (): Pad => ({ id: crypto.randomUUID(), content: '', updatedAt: Date.now() });

/** Title is the first non-empty line, minus Markdown heading marks. */
export function padTitle(pad: Pad): string {
  const line = pad.content.split('\n').find((l) => l.trim());
  return line?.replace(/^#+\s*/, '').trim().slice(0, 40) || 'Untitled';
}

const first = newPad();

export const usePads = create<PadsState>()(
  persist(
    (set) => ({
      pads: [first],
      activeId: first.id,
      create: () =>
        set((s) => {
          const pad = newPad();
          return { pads: [pad, ...s.pads], activeId: pad.id };
        }),
      update: (id, content) =>
        set((s) => ({ pads: s.pads.map((p) => (p.id === id ? { ...p, content, updatedAt: Date.now() } : p)) })),
      remove: (id) =>
        set((s) => {
          const remaining = s.pads.filter((p) => p.id !== id);
          const pads = remaining.length ? remaining : [newPad()];
          return { pads, activeId: s.activeId === id ? pads[0]!.id : s.activeId };
        }),
      select: (id) => set({ activeId: id }),
    }),
    { name: 'quiver-scratchpads' },
  ),
);
