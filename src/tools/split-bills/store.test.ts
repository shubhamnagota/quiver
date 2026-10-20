import { balances, type Expense, exportGroup, parseExport } from './lib';
import { useSplitBills } from './store';

const state = () => useSplitBills.getState();
const active = () => state().groups.find((g) => g.id === state().activeId)!;

const expense = (overrides: Partial<Expense>): Expense => ({
  id: crypto.randomUUID(),
  kind: 'expense',
  description: 'Dinner',
  amount: 3000,
  currency: 'AED',
  paidBy: active().members[0]!.id,
  mode: 'equal',
  weights: Object.fromEntries(active().members.map((m) => [m.id, 1])),
  category: 'food',
  date: '2026-10-20',
  ...overrides,
});

describe('split bills store', () => {
  beforeEach(() => useSplitBills.setState({ groups: [], activeId: null }));

  it('creates a group and manages members', () => {
    state().createGroup(' Trip ', 'AED', ['Asha', ' ', 'Bilal']);
    expect(active()).toMatchObject({ name: 'Trip', currency: 'AED' });
    expect(active().members.map((m) => m.name)).toEqual(['Asha', 'Bilal']);
    state().addMember(active().id, 'Chen');
    const [asha, , chen] = active().members;
    state().renameMember(active().id, chen!.id, 'Chen Li');
    expect(active().members[2]!.name).toBe('Chen Li');

    state().saveExpense(active().id, expense({ weights: { [asha!.id]: 1 } }));
    expect(state().removeMember(active().id, asha!.id)).toBe(false);
    expect(state().removeMember(active().id, chen!.id)).toBe(true);
    expect(active().members).toHaveLength(2);
  });

  it('saves, edits, deletes and restores expenses in place', () => {
    state().createGroup('Flat', 'AED', ['A', 'B']);
    const first = expense({ description: 'Rent' });
    const second = expense({ description: 'Wifi' });
    state().saveExpense(active().id, first);
    state().saveExpense(active().id, second);
    state().saveExpense(active().id, { ...first, description: 'Rent (Oct)' });
    expect(active().expenses.map((e) => e.description)).toEqual(['Wifi', 'Rent (Oct)']);
    const saved = active().expenses[1]!;
    state().removeExpense(active().id, saved.id);
    state().restoreExpense(active().id, saved, 1);
    state().restoreExpense(active().id, saved, 1);
    expect(active().expenses.map((e) => e.description)).toEqual(['Wifi', 'Rent (Oct)']);
  });

  it('converts and undoes, without touching later bills', () => {
    state().createGroup('Trip', 'AED', ['A', 'B']);
    state().saveExpense(active().id, expense({ amount: 100000, currency: 'INR' }));
    state().convert(active().id, 'AED', { INR: 0.044 });
    expect(active().currency).toBe('AED');
    expect(active().expenses[0]).toMatchObject({ amount: 4400, currency: 'AED' });
    state().saveExpense(active().id, expense({ amount: 500 }));
    state().undoConvert(active().id);
    expect(active().expenses.map((e) => [e.amount, e.currency])).toEqual([[500, 'AED'], [100000, 'INR']]);
    expect(active().lastConversion).toBeUndefined();
  });

  it('archives, removes and imports groups', () => {
    state().createGroup('Old', 'AED', ['A', 'B']);
    const old = active();
    state().saveExpense(old.id, expense({}));
    state().createGroup('New', 'AED', ['C', 'D']);
    state().updateGroup(old.id, { archived: true });
    expect(state().groups.find((g) => g.id === old.id)?.archived).toBe(true);

    const exported = parseExport(exportGroup(state().groups.find((g) => g.id === old.id)!));
    state().importGroup(exported, 'copy');
    expect(state().groups).toHaveLength(3);
    expect(active().id).not.toBe(old.id);
    expect(Object.values(balances(active(), 'AED'))).toEqual([1500, -1500]);
    state().importGroup({ ...exported, name: 'Old (theirs)' }, 'replace');
    expect(state().groups).toHaveLength(3);
    expect(state().groups.find((g) => g.id === old.id)?.name).toBe('Old (theirs)');

    state().removeGroup(old.id);
    expect(state().groups).toHaveLength(2);
  });
});
