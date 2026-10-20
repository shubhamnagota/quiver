import { allocate, balances, type Expense, type Group, owed, settle, splitError, summary, toMinor, totalSpent } from './lib';

const expense = (overrides: Partial<Expense>): Expense => ({
  id: crypto.randomUUID(),
  kind: 'expense',
  description: '',
  amount: 0,
  paidBy: 'a',
  mode: 'equal',
  weights: {},
  date: '2026-10-20',
  ...overrides,
});

const group = (expenses: Expense[]): Group => ({
  id: 'g',
  name: 'Trip',
  currency: 'AED',
  members: [
    { id: 'a', name: 'Asha' },
    { id: 'b', name: 'Bilal' },
    { id: 'c', name: 'Chen' },
  ],
  expenses,
});

describe('allocate', () => {
  it('always sums to the total and gives leftovers to the largest remainders', () => {
    expect(allocate(1000, { a: 1, b: 1, c: 1 })).toEqual({ a: 334, b: 333, c: 333 });
    expect(allocate(100, { a: 1, b: 2 })).toEqual({ a: 33, b: 67 });
    const parts = allocate(9999, { a: 3, b: 7, c: 11 });
    expect(Object.values(parts).reduce((s, v) => s + v, 0)).toBe(9999);
  });

  it('skips zero weights and handles empty input', () => {
    expect(allocate(500, { a: 1, b: 0 })).toEqual({ a: 500 });
    expect(allocate(500, {})).toEqual({});
  });
});

describe('toMinor', () => {
  it('respects currency minor units', () => {
    expect(toMinor(12.345, 'AED')).toBe(1235);
    expect(toMinor(1.2345, 'KWD')).toBe(1235);
    expect(toMinor(1500, 'JPY')).toBe(1500);
  });
});

describe('splitError', () => {
  it('checks totals per mode', () => {
    expect(splitError(expense({ amount: 0, weights: { a: 1 } }), 'AED')).toMatch(/above zero/);
    expect(splitError(expense({ amount: 100, weights: {} }), 'AED')).toMatch(/at least one/);
    expect(splitError(expense({ amount: 1000, mode: 'exact', weights: { a: 400, b: 500 } }), 'AED')).toBe('Amounts are short by 1.00');
    expect(splitError(expense({ amount: 1000, mode: 'exact', weights: { a: 600, b: 500 } }), 'AED')).toBe('Amounts exceed the total by 1.00');
    expect(splitError(expense({ amount: 1000, mode: 'percent', weights: { a: 50, b: 40 } }), 'AED')).toMatch(/90%/);
    expect(splitError(expense({ amount: 1000, mode: 'percent', weights: { a: 33.5, b: 66.5 } }), 'AED')).toBeUndefined();
    expect(splitError(expense({ amount: 1000, mode: 'shares', weights: { a: -1, b: 2 } }), 'AED')).toMatch(/zero or more/);
  });
});

describe('owed', () => {
  it('splits by mode', () => {
    expect(owed(expense({ amount: 900, weights: { a: 1, b: 1, c: 1 } }))).toEqual({ a: 300, b: 300, c: 300 });
    expect(owed(expense({ amount: 900, mode: 'shares', weights: { a: 2, b: 1 } }))).toEqual({ a: 600, b: 300 });
    expect(owed(expense({ amount: 900, mode: 'percent', weights: { a: 10, c: 90 } }))).toEqual({ a: 90, c: 810 });
    expect(owed(expense({ amount: 900, mode: 'exact', weights: { b: 100, c: 800 } }))).toEqual({ b: 100, c: 800 });
  });
});

describe('balances and settle', () => {
  it('nets expenses and payments, ignoring invalid ones', () => {
    const g = group([
      expense({ amount: 9000, paidBy: 'a', weights: { a: 1, b: 1, c: 1 } }),
      expense({ amount: 3000, paidBy: 'b', weights: { a: 1, b: 1, c: 1 } }),
      expense({ kind: 'payment', amount: 1000, paidBy: 'c', mode: 'exact', weights: { a: 1000 } }),
      expense({ amount: 500, paidBy: 'a', mode: 'exact', weights: { b: 100 } }),
      expense({ amount: 500, paidBy: 'gone', weights: { a: 1 } }),
    ]);
    const net = balances(g);
    expect(net).toEqual({ a: 4000, b: -1000, c: -3000 });
    expect(Object.values(net).reduce((s, v) => s + v, 0)).toBe(0);
    expect(settle(net)).toEqual([
      { from: 'c', to: 'a', amount: 3000 },
      { from: 'b', to: 'a', amount: 1000 },
    ]);
    expect(totalSpent(g)).toBe(12000);
  });

  it('needs at most n-1 transfers', () => {
    const net = { a: 500, b: 300, c: -200, d: -400, e: -200 };
    const transfers = settle(net);
    expect(transfers.length).toBeLessThanOrEqual(4);
    const after = { ...net };
    for (const t of transfers) {
      after[t.from as keyof typeof after] += t.amount;
      after[t.to as keyof typeof after] -= t.amount;
    }
    expect(Object.values(after).every((v) => v === 0)).toBe(true);
  });

  it('summarises for chat', () => {
    expect(summary(group([expense({ amount: 3000, paidBy: 'a', weights: { a: 1, b: 1, c: 1 } })]))).toBe(
      'Trip: 30.00 AED spent\nBilal pays Asha 10.00 AED\nChen pays Asha 10.00 AED',
    );
    expect(summary(group([]))).toBe('Trip: 0.00 AED spent\nAll settled up.');
  });
});
