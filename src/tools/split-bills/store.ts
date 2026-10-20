import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { convertExpenses, type Expense, type Group, undoConversion, withNewIds } from './lib';

const newId = () => crypto.randomUUID();

interface SplitState {
  groups: Group[];
  activeId: string | null;
  createGroup: (name: string, currency: string, memberNames: string[]) => void;
  updateGroup: (id: string, patch: Partial<Pick<Group, 'name' | 'currency' | 'archived'>>) => void;
  removeGroup: (id: string) => void;
  select: (id: string) => void;
  addMember: (groupId: string, name: string) => void;
  renameMember: (groupId: string, memberId: string, name: string) => void;
  /** Only members no expense mentions can be removed; returns whether it happened. */
  removeMember: (groupId: string, memberId: string) => boolean;
  /** Adds the expense, or replaces the one with the same id. */
  saveExpense: (groupId: string, expense: Expense) => void;
  removeExpense: (groupId: string, expenseId: string) => void;
  /** Puts a deleted expense back where it was. */
  restoreExpense: (groupId: string, expense: Expense, index: number) => void;
  convert: (groupId: string, to: string, rates: Record<string, number>) => void;
  undoConvert: (groupId: string) => void;
  /** `copy` keeps an existing group with the same id and imports alongside it. */
  importGroup: (group: Group, mode: 'replace' | 'copy') => void;
}

export function memberInUse(group: Group, memberId: string): boolean {
  return group.expenses.some((e) => e.paidBy === memberId || e.weights[memberId]! > 0);
}

export const useSplitBills = create<SplitState>()(
  persist(
    (set, get) => {
      const patchGroup = (id: string, fn: (g: Group) => Group) =>
        set((s) => ({ groups: s.groups.map((g) => (g.id === id ? fn(g) : g)) }));
      return {
        groups: [],
        activeId: null,
        createGroup: (name, currency, memberNames) => {
          const group: Group = {
            id: newId(),
            name: name.trim() || 'Untitled group',
            currency,
            members: memberNames.map((n) => n.trim()).filter(Boolean).map((n) => ({ id: newId(), name: n })),
            expenses: [],
          };
          set((s) => ({ groups: [group, ...s.groups], activeId: group.id }));
        },
        updateGroup: (id, patch) => patchGroup(id, (g) => ({ ...g, ...patch })),
        removeGroup: (id) =>
          set((s) => {
            const groups = s.groups.filter((g) => g.id !== id);
            return { groups, activeId: s.activeId === id ? (groups.find((g) => !g.archived)?.id ?? null) : s.activeId };
          }),
        select: (id) => set({ activeId: id }),
        addMember: (groupId, name) =>
          name.trim() && patchGroup(groupId, (g) => ({ ...g, members: [...g.members, { id: newId(), name: name.trim() }] })),
        renameMember: (groupId, memberId, name) =>
          patchGroup(groupId, (g) => ({ ...g, members: g.members.map((m) => (m.id === memberId ? { ...m, name } : m)) })),
        removeMember: (groupId, memberId) => {
          const group = get().groups.find((g) => g.id === groupId);
          if (!group || memberInUse(group, memberId)) return false;
          patchGroup(groupId, (g) => ({ ...g, members: g.members.filter((m) => m.id !== memberId) }));
          return true;
        },
        saveExpense: (groupId, expense) =>
          patchGroup(groupId, (g) => {
            const exists = g.expenses.some((e) => e.id === expense.id);
            return { ...g, expenses: exists ? g.expenses.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...g.expenses] };
          }),
        removeExpense: (groupId, expenseId) => patchGroup(groupId, (g) => ({ ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) })),
        restoreExpense: (groupId, expense, index) =>
          patchGroup(groupId, (g) => {
            if (g.expenses.some((e) => e.id === expense.id)) return g;
            const expenses = [...g.expenses];
            expenses.splice(index, 0, expense);
            return { ...g, expenses };
          }),
        convert: (groupId, to, rates) =>
          patchGroup(groupId, (g) => {
            const id = newId();
            return { ...g, currency: to, expenses: convertExpenses(g.expenses, to, rates, id), lastConversion: { id, to } };
          }),
        undoConvert: (groupId) =>
          patchGroup(groupId, (g) => (g.lastConversion ? { ...g, expenses: undoConversion(g.expenses, g.lastConversion.id), lastConversion: undefined } : g)),
        importGroup: (group, mode) =>
          set((s) => {
            const incoming = mode === 'copy' && s.groups.some((g) => g.id === group.id) ? withNewIds(group, newId) : group;
            const groups = s.groups.some((g) => g.id === incoming.id)
              ? s.groups.map((g) => (g.id === incoming.id ? incoming : g))
              : [incoming, ...s.groups];
            return { groups, activeId: incoming.id };
          }),
      };
    },
    { name: 'quiver-split-bills', version: 1 },
  ),
);
