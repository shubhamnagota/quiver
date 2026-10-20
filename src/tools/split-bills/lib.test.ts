import {
  allocate,
  buildExpense,
  draftFromExpense,
  emptyDraft,
  balances,
  breakdown,
  byCategory,
  convertExpenses,
  currenciesOf,
  type Expense,
  exportGroup,
  filterExpenses,
  type Group,
  isSettled,
  owed,
  parseExport,
  settle,
  splitError,
  summary,
  toCsv,
  toMinor,
  totalSpent,
  undoConversion,
  withNewIds,
} from './lib';

const expense = (overrides: Partial<Expense>): Expense => ({
  id: crypto.randomUUID(),
  kind: 'expense',
  description: '',
  amount: 0,
  currency: 'AED',
  paidBy: 'a',
  mode: 'equal',
  weights: { a: 1, b: 1, c: 1 },
  category: 'other',
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
    expect(splitError(expense({ amount: 0 }))).toMatch(/above zero/);
    expect(splitError(expense({ amount: 100, weights: {} }))).toMatch(/at least one/);
    expect(splitError(expense({ amount: 1000, mode: 'exact', weights: { a: 400, b: 500 } }))).toBe('Amounts are short by 1.00');
    expect(splitError(expense({ amount: 1000, mode: 'exact', weights: { a: 600, b: 500 } }))).toBe('Amounts exceed the total by 1.00');
    expect(splitError(expense({ amount: 1000, mode: 'percent', weights: { a: 50, b: 40 } }))).toMatch(/90%/);
    expect(splitError(expense({ amount: 1000, mode: 'percent', weights: { a: 33.5, b: 66.5 } }))).toBeUndefined();
    expect(splitError(expense({ amount: 1000, mode: 'shares', weights: { a: -1, b: 2 } }))).toMatch(/zero or more/);
  });
});

describe('owed', () => {
  it('splits by mode', () => {
    expect(owed(expense({ amount: 900 }))).toEqual({ a: 300, b: 300, c: 300 });
    expect(owed(expense({ amount: 900, mode: 'shares', weights: { a: 2, b: 1 } }))).toEqual({ a: 600, b: 300 });
    expect(owed(expense({ amount: 900, mode: 'percent', weights: { a: 10, c: 90 } }))).toEqual({ a: 90, c: 810 });
    expect(owed(expense({ amount: 900, mode: 'exact', weights: { a: 0, b: 100, c: 800 } }))).toEqual({ b: 100, c: 800 });
  });
});

describe('balances and settle', () => {
  it('nets expenses and payments, ignoring invalid ones', () => {
    const g = group([
      expense({ amount: 9000, paidBy: 'a' }),
      expense({ amount: 3000, paidBy: 'b' }),
      expense({ kind: 'payment', amount: 1000, paidBy: 'c', mode: 'exact', weights: { a: 1000 } }),
      expense({ amount: 500, paidBy: 'a', mode: 'exact', weights: { b: 100 } }),
      expense({ amount: 500, paidBy: 'gone', weights: { a: 1 } }),
    ]);
    const net = balances(g, 'AED');
    expect(net).toEqual({ a: 4000, b: -1000, c: -3000 });
    expect(settle(net)).toEqual([
      { from: 'c', to: 'a', amount: 3000 },
      { from: 'b', to: 'a', amount: 1000 },
    ]);
    expect(totalSpent(g, 'AED')).toBe(12000);
    expect(breakdown(g, 'AED').c).toEqual({ paid: 0, share: 4000, sent: 1000, received: 0, net: -3000 });
  });

  it('keeps currencies apart', () => {
    const g = group([
      expense({ amount: 3000, paidBy: 'a' }),
      expense({ amount: 30000, currency: 'INR', paidBy: 'b' }),
    ]);
    expect(currenciesOf(g)).toEqual(['AED', 'INR']);
    expect(balances(g, 'AED')).toEqual({ a: 2000, b: -1000, c: -1000 });
    expect(balances(g, 'INR')).toEqual({ a: -10000, b: 20000, c: -10000 });
    expect(isSettled(g)).toBe(false);
    expect(isSettled(group([]))).toBe(true);
  });

  it('needs at most n-1 transfers and clears every balance', () => {
    const net = { a: 500, b: 300, c: -200, d: -400, e: -200 };
    const transfers = settle(net);
    expect(transfers.length).toBeLessThanOrEqual(4);
    const after: Record<string, number> = { ...net };
    for (const t of transfers) {
      after[t.from]! += t.amount;
      after[t.to]! -= t.amount;
    }
    expect(Object.values(after).every((v) => v === 0)).toBe(true);
  });

  it('sums spend by category', () => {
    const g = group([
      expense({ amount: 100, category: 'food' }),
      expense({ amount: 300, category: 'stay' }),
      expense({ amount: 50, category: 'food' }),
      expense({ kind: 'payment', amount: 999, mode: 'exact', weights: { b: 999 } }),
    ]);
    expect(byCategory(g, 'AED')).toEqual([
      { category: 'stay', amount: 300 },
      { category: 'food', amount: 150 },
    ]);
  });
});

describe('conversion', () => {
  const expenses = [
    expense({ id: '1', amount: 1000 }),
    expense({ id: '2', amount: 100000, currency: 'INR', mode: 'exact', weights: { a: 33333, b: 66667 } }),
  ];

  it('converts other currencies, keeps exact splits whole and can be undone', () => {
    const converted = convertExpenses(expenses, 'AED', { INR: 0.04397 }, 'c1');
    expect(converted[0]).toBe(expenses[0]);
    const inr = converted[1]!;
    expect(inr).toMatchObject({ amount: 4397, currency: 'AED', weights: { a: 1466, b: 2931 } });
    expect(splitError(inr)).toBeUndefined();
    expect(inr.previous).toMatchObject({ amount: 100000, currency: 'INR', rate: 0.04397, conversionId: 'c1' });
    expect(undoConversion(converted, 'c1')).toEqual(expenses.map((e) => ({ ...e, previous: undefined })));
    expect(undoConversion(converted, 'other')).toEqual(converted);
  });

  it('requires a rate for every source currency', () => {
    expect(() => convertExpenses(expenses, 'AED', {}, 'c1')).toThrow(/rate for INR/);
    expect(() => convertExpenses(expenses, 'AED', { INR: -1 }, 'c1')).toThrow(/rate for INR/);
  });
});

describe('filterExpenses', () => {
  const list = [
    expense({ id: '1', description: 'Dinner at Ravi', amount: 12050, category: 'food', paidBy: 'a', weights: { a: 1, b: 1 } }),
    expense({ id: '2', description: 'Taxi', amount: 4000, category: 'transport', date: '2026-09-02', paidBy: 'b', weights: { b: 1, c: 1 } }),
  ];
  const ids = (f: Parameters<typeof filterExpenses>[1]) => filterExpenses(list, f).map((e) => e.id);

  it('filters by text, amount, member, category and month', () => {
    expect(ids({})).toEqual(['1', '2']);
    expect(ids({ query: 'ravi' })).toEqual(['1']);
    expect(ids({ query: '120.50' })).toEqual(['1']);
    expect(ids({ member: 'c' })).toEqual(['2']);
    expect(ids({ member: 'a' })).toEqual(['1']);
    expect(ids({ category: 'transport' })).toEqual(['2']);
    expect(ids({ month: '2026-10' })).toEqual(['1']);
  });
});

describe('summary and CSV', () => {
  it('summarises each currency for chat', () => {
    expect(summary(group([expense({ amount: 3000 })]))).toBe(
      'Trip\n\n30.00 AED spent\nBilal pays Asha 10.00 AED\nChen pays Asha 10.00 AED',
    );
    expect(summary(group([]))).toBe('Trip\nNo expenses yet.');
  });

  it('writes CSV with owed columns and defuses formulas', () => {
    const csv = toCsv(group([expense({ description: '=HYPERLINK("x")', amount: 1000, category: 'food' })]));
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('Date,Description,Category,Type,Currency,Amount,Paid by,Asha,Bilal,Chen');
    expect(row).toBe(`2026-10-20,"'=HYPERLINK(""x"")",Food and drink,Expense,AED,10,Asha,3.34,3.33,3.33`);
  });
});

describe('export and import', () => {
  const g = group([
    expense({ amount: 3000, category: 'food', previous: { amount: 1, currency: 'INR', weights: { a: 1 }, rate: 2, conversionId: 'x' } }),
  ]);

  it('round-trips a group', () => {
    expect(parseExport(exportGroup(g))).toEqual({ ...g, archived: false, lastConversion: undefined });
  });

  it('rejects files that are not exports', () => {
    expect(() => parseExport('nope')).toThrow(/JSON/);
    expect(() => parseExport('{}')).toThrow(/Split bills export/);
    expect(() => parseExport(JSON.stringify({ format: 'quiver-split-bills', version: 2, group: {} }))).toThrow(/newer/);
    const bad = JSON.parse(exportGroup(g));
    bad.group.expenses[0].amount = 1.5;
    expect(() => parseExport(JSON.stringify(bad))).toThrow(/Invalid expense/);
  });

  it('drops unknown fields and falls back to the Other category', () => {
    const extra = JSON.parse(exportGroup(g));
    extra.group.evil = '<script>';
    extra.group.expenses[0].category = 'nope';
    const parsed = parseExport(JSON.stringify(extra));
    expect(parsed).not.toHaveProperty('evil');
    expect(parsed.expenses[0]!.category).toBe('other');
  });

  it('copies with fresh ids and keeps the maths the same', () => {
    let n = 0;
    const copy = withNewIds(g, () => `n${n++}`);
    expect(copy.id).not.toBe(g.id);
    expect(copy.members.map((m) => m.name)).toEqual(['Asha', 'Bilal', 'Chen']);
    expect(Object.values(balances(copy, 'AED'))).toEqual(Object.values(balances(g, 'AED')));
  });
});

describe('expense form', () => {
  const members = group([]).members;
  const draft = emptyDraft({ members, currency: 'AED' }, '2026-10-20');
  const build = (patch: Partial<typeof draft>) => buildExpense({ ...draft, ...patch }, members, () => 'new');

  it('builds equal, exact, percent and share splits from text', () => {
    expect(build({ description: ' Lunch ', amount: '60+30' })).toEqual({
      expense: expect.objectContaining({ id: 'new', description: 'Lunch', amount: 9000, mode: 'equal', weights: { a: 1, b: 1, c: 1 } }),
    });
    expect(build({ amount: '90', mode: 'exact', values: { a: '10', b: '80.00' } })).toEqual({
      expense: expect.objectContaining({ weights: { a: 1000, b: 8000, c: 0 } }),
    });
    expect(build({ amount: '90', mode: 'percent', values: { a: '50', b: '50' } })).toMatchObject({ expense: { weights: { a: 50, b: 50, c: 0 } } });
    expect(build({ amount: '90', mode: 'shares', values: { a: '2', b: 'x' } })).toEqual({ error: 'Values must be zero or more' });
    expect(build({ amount: '' })).toEqual({ error: 'Enter the amount' });
    expect(build({ amount: '90', included: {} })).toEqual({ error: 'Pick at least one person' });
  });

  it('builds payments to one person', () => {
    expect(build({ kind: 'payment', amount: '25', paidBy: 'b', to: 'a' })).toMatchObject({
      expense: { kind: 'payment', description: 'Payment', mode: 'exact', weights: { a: 2500 } },
    });
    expect(build({ kind: 'payment', amount: '25', paidBy: 'a', to: 'a' })).toEqual({ error: 'Pick who received the money' });
  });

  it('round-trips an expense and keeps conversion history only if the money is unchanged', () => {
    const previous = { amount: 1, currency: 'INR', weights: {}, rate: 1, conversionId: 'c' };
    const e = expense({ amount: 9000, mode: 'exact', weights: { a: 1000, b: 8000 }, previous });
    const d = draftFromExpense(e, members);
    expect(d.values).toEqual({ a: '10', b: '80' });
    const rename = buildExpense({ ...d, description: 'Renamed' }, members, () => 'x', e);
    expect(rename).toMatchObject({ expense: { id: e.id, previous } });
    const changed = buildExpense({ ...d, amount: '91', values: { a: '11', b: '80' } }, members, () => 'x', e);
    expect('expense' in changed && changed.expense.previous).toBeUndefined();
  });
});
