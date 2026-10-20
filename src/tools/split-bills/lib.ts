import { formatAmount, minorUnits } from '@/lib/fx/currencies';
import { evaluate } from '@/lib/math';

export interface Member {
  id: string;
  name: string;
}

export type SplitMode = 'equal' | 'exact' | 'percent' | 'shares';

export const CATEGORIES = {
  food: 'Food and drink',
  groceries: 'Groceries',
  transport: 'Transport',
  stay: 'Stay',
  home: 'Rent and bills',
  shopping: 'Shopping',
  fun: 'Entertainment',
  other: 'Other',
} as const;

export type CategoryId = keyof typeof CATEGORIES;

/** The amounts an expense had before a conversion, so the conversion can be undone. */
export interface Previous {
  amount: number;
  currency: string;
  weights: Record<string, number>;
  /** Target-currency units per 1 unit of `currency`. */
  rate: number;
  conversionId: string;
  previous?: Previous;
}

export interface Expense {
  id: string;
  /** A payment settles a debt: `paidBy` paid the single member in `weights`. */
  kind: 'expense' | 'payment';
  description: string;
  /** Minor units of `currency` (cents, fils, paise). */
  amount: number;
  currency: string;
  paidBy: string;
  mode: SplitMode;
  /**
   * Per member: equal = 1 if included, exact = minor units owed,
   * percent = percent of the total, shares = relative weight.
   */
  weights: Record<string, number>;
  category: CategoryId;
  /** YYYY-MM-DD */
  date: string;
  previous?: Previous;
}

export interface Group {
  id: string;
  name: string;
  /** Default currency for new expenses. */
  currency: string;
  members: Member[];
  expenses: Expense[];
  archived?: boolean;
  /** The most recent conversion, which Undo reverts. */
  lastConversion?: { id: string; to: string };
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export function toMinor(value: number, currency: string): number {
  return Math.round(value * 10 ** minorUnits(currency));
}

export function fromMinor(value: number, currency: string): number {
  return value / 10 ** minorUnits(currency);
}

export function formatMinor(value: number, currency: string): string {
  return formatAmount(fromMinor(value, currency), currency);
}

export const money = (value: number, currency: string) => `${formatMinor(value, currency)} ${currency}`;

/**
 * Splits an integer total in proportion to the weights, largest remainder
 * first, so the parts always sum to the total. Ties go to the earlier member.
 */
export function allocate(total: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights).filter((id) => weights[id]! > 0);
  const sum = ids.reduce((s, id) => s + weights[id]!, 0);
  const out: Record<string, number> = {};
  if (!ids.length || sum <= 0) return out;
  const raw = ids.map((id) => (total * weights[id]!) / sum);
  const floors = raw.map(Math.floor);
  let left = total - floors.reduce((s, v) => s + v, 0);
  const order = ids.map((_, i) => i).sort((a, b) => raw[b]! - floors[b]! - (raw[a]! - floors[a]!) || a - b);
  for (const i of order) {
    if (left <= 0) break;
    floors[i]!++;
    left--;
  }
  ids.forEach((id, i) => (out[id] = floors[i]!));
  return out;
}

/** Returns a message when the split can't be applied, otherwise undefined. */
export function splitError(expense: Pick<Expense, 'amount' | 'mode' | 'weights' | 'currency'>): string | undefined {
  const values = Object.values(expense.weights).filter((v) => v > 0);
  if (!(expense.amount > 0)) return 'Enter an amount above zero';
  if (Object.values(expense.weights).some((v) => !Number.isFinite(v) || v < 0)) return 'Values must be zero or more';
  if (!values.length) return 'Pick at least one person';
  const sum = values.reduce((s, v) => s + v, 0);
  if (expense.mode === 'exact' && sum !== expense.amount) {
    const diff = expense.amount - sum;
    return `Amounts ${diff > 0 ? 'are short by' : 'exceed the total by'} ${formatMinor(Math.abs(diff), expense.currency)}`;
  }
  if (expense.mode === 'percent' && Math.abs(sum - 100) > 1e-9) return `Percentages add up to ${+sum.toFixed(4)}%, not 100%`;
  return undefined;
}

/** What each member owes for one expense, in minor units. */
export function owed(expense: Expense): Record<string, number> {
  return expense.mode === 'exact'
    ? Object.fromEntries(Object.entries(expense.weights).filter(([, v]) => v > 0))
    : allocate(expense.amount, expense.weights);
}

/** An expense counts only when its split is valid and everyone in it is still a member. */
export function counts(e: Expense, members: Member[]): boolean {
  const ids = new Set(members.map((m) => m.id));
  return !splitError(e) && ids.has(e.paidBy) && Object.keys(owed(e)).every((id) => ids.has(id));
}

/** Currencies in use, the group's default first, then by first appearance. */
export function currenciesOf(group: Pick<Group, 'currency' | 'expenses'>): string[] {
  const seen = new Set<string>();
  for (const e of group.expenses) seen.add(e.currency);
  return [...seen].sort((a, b) => Number(b === group.currency) - Number(a === group.currency));
}

export interface PersonTotals {
  /** Spent on the group's behalf (expenses only). */
  paid: number;
  /** Their part of the group's expenses: what they consumed. */
  share: number;
  /** Settle-up payments made and received. */
  sent: number;
  received: number;
  /** paid − share + sent − received: positive is owed money. */
  net: number;
}

/** Per-member totals in one currency. Each currency is kept separate until converted. */
export function breakdown(group: Pick<Group, 'members' | 'expenses'>, currency: string): Record<string, PersonTotals> {
  const out: Record<string, PersonTotals> = Object.fromEntries(
    group.members.map((m) => [m.id, { paid: 0, share: 0, sent: 0, received: 0, net: 0 }]),
  );
  for (const e of group.expenses) {
    if (e.currency !== currency || !counts(e, group.members)) continue;
    const payer = out[e.paidBy]!;
    if (e.kind === 'payment') payer.sent += e.amount;
    else payer.paid += e.amount;
    for (const [id, v] of Object.entries(owed(e))) {
      if (e.kind === 'payment') out[id]!.received += v;
      else out[id]!.share += v;
    }
  }
  for (const t of Object.values(out)) t.net = t.paid - t.share + t.sent - t.received;
  return out;
}

export function balances(group: Pick<Group, 'members' | 'expenses'>, currency: string): Record<string, number> {
  return Object.fromEntries(Object.entries(breakdown(group, currency)).map(([id, t]) => [id, t.net]));
}

/** Fewest practical transfers: repeatedly match the largest debtor with the largest creditor. */
export function settle(net: Record<string, number>): Transfer[] {
  const debtors = Object.entries(net).filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }));
  const creditors = Object.entries(net).filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }));
  const transfers: Transfer[] = [];
  const byAmount = (a: { v: number }, b: { v: number }) => b.v - a.v;
  while (debtors.length && creditors.length) {
    debtors.sort(byAmount);
    creditors.sort(byAmount);
    const d = debtors[0]!;
    const c = creditors[0]!;
    const amount = Math.min(d.v, c.v);
    transfers.push({ from: d.id, to: c.id, amount });
    d.v -= amount;
    c.v -= amount;
    if (!d.v) debtors.shift();
    if (!c.v) creditors.shift();
  }
  return transfers;
}

export function isSettled(group: Pick<Group, 'members' | 'expenses' | 'currency'>): boolean {
  return currenciesOf(group).every((c) => Object.values(balances(group, c)).every((v) => v === 0));
}

/** Total spent in one currency, excluding settle-up payments. */
export function totalSpent(group: Pick<Group, 'members' | 'expenses'>, currency: string): number {
  return group.expenses
    .filter((e) => e.kind === 'expense' && e.currency === currency && counts(e, group.members))
    .reduce((s, e) => s + e.amount, 0);
}

/** Spend per category in one currency, largest first. */
export function byCategory(group: Pick<Group, 'members' | 'expenses'>, currency: string): { category: CategoryId; amount: number }[] {
  const sums = new Map<CategoryId, number>();
  for (const e of group.expenses) {
    if (e.kind !== 'expense' || e.currency !== currency || !counts(e, group.members)) continue;
    sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
  }
  return [...sums].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

/**
 * Rewrites every expense not already in `to` at the given rates (target units
 * per 1 source unit). The total converts once and exact splits are re-split in
 * proportion, so parts still sum to the total.
 */
export function convertExpenses(expenses: Expense[], to: string, rates: Record<string, number>, conversionId: string): Expense[] {
  return expenses.map((e) => {
    if (e.currency === to) return e;
    const rate = rates[e.currency];
    if (!rate || !Number.isFinite(rate) || rate <= 0) throw new Error(`Enter a rate for ${e.currency}`);
    const amount = toMinor(fromMinor(e.amount, e.currency) * rate, to);
    return {
      ...e,
      amount,
      currency: to,
      weights: e.mode === 'exact' ? allocate(amount, e.weights) : e.weights,
      previous: { amount: e.amount, currency: e.currency, weights: e.weights, rate, conversionId, previous: e.previous },
    };
  });
}

/** Restores the expenses changed by one conversion; others are left alone. */
export function undoConversion(expenses: Expense[], conversionId: string): Expense[] {
  return expenses.map((e) => {
    const p = e.previous;
    if (p?.conversionId !== conversionId) return e;
    return { ...e, amount: p.amount, currency: p.currency, weights: p.weights, previous: p.previous };
  });
}

export interface Filter {
  query?: string;
  member?: string;
  category?: CategoryId | '';
  /** YYYY-MM */
  month?: string;
}

/** Matches description and amount text; `member` matches the payer or anyone in the split. */
export function filterExpenses(expenses: Expense[], f: Filter): Expense[] {
  const q = f.query?.trim().toLowerCase();
  return expenses.filter((e) => {
    if (f.member && e.paidBy !== f.member && !(e.weights[f.member]! > 0)) return false;
    if (f.category && e.category !== f.category) return false;
    if (f.month && !e.date.startsWith(f.month)) return false;
    if (q && !`${e.description} ${formatMinor(e.amount, e.currency)} ${e.currency}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

const memberName = (group: Pick<Group, 'members'>, id: string) => group.members.find((m) => m.id === id)?.name ?? '?';

/** Plain-text summary for pasting into a chat. */
export function summary(group: Group): string {
  const name = (id: string) => memberName(group, id);
  const currencies = currenciesOf(group);
  const lines = [`${group.name}`];
  if (!currencies.length) lines.push('No expenses yet.');
  for (const c of currencies) {
    lines.push('', `${money(totalSpent(group, c), c)} spent`);
    const transfers = settle(balances(group, c));
    if (!transfers.length) lines.push('All settled up.');
    for (const t of transfers) lines.push(`${name(t.from)} pays ${name(t.to)} ${money(t.amount, c)}`);
  }
  return lines.join('\n');
}

/** Quotes a CSV cell, and defuses spreadsheet formulas (=, +, -, @) in text cells. */
function cell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** One row per expense, one owed column per member, amounts in major units. */
export function toCsv(group: Group): string {
  const header = ['Date', 'Description', 'Category', 'Type', 'Currency', 'Amount', 'Paid by', ...group.members.map((m) => m.name)];
  const rows = [...group.expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const parts = owed(e);
      return [
        e.date,
        e.description,
        e.kind === 'payment' ? '' : CATEGORIES[e.category],
        e.kind === 'payment' ? 'Payment' : 'Expense',
        e.currency,
        fromMinor(e.amount, e.currency),
        memberName(group, e.paidBy),
        ...group.members.map((m) => fromMinor(parts[m.id] ?? 0, e.currency)),
      ];
    });
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export const EXPORT_FORMAT = 'quiver-split-bills';

export function exportGroup(group: Group): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 1, group }, null, 2);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const isCode = (v: unknown): v is string => typeof v === 'string' && /^[A-Z]{3}$/.test(v);
const isWeights = (v: unknown): v is Record<string, number> =>
  isObject(v) && Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);

function parsePrevious(v: unknown, depth = 0): Previous | undefined {
  if (v === undefined) return undefined;
  if (!isObject(v) || depth > 20) throw new Error('Invalid conversion history');
  if (!Number.isSafeInteger(v.amount) || !isCode(v.currency) || !isWeights(v.weights) || typeof v.rate !== 'number' || !isText(v.conversionId)) {
    throw new Error('Invalid conversion history');
  }
  return {
    amount: v.amount as number,
    currency: v.currency,
    weights: v.weights,
    rate: v.rate,
    conversionId: v.conversionId,
    previous: parsePrevious(v.previous, depth + 1),
  };
}

/** Parses an exported file. The file is untrusted: every field is checked and copied, nothing else is kept. */
export function parseExport(text: string): Group {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a JSON file');
  }
  if (!isObject(data) || data.format !== EXPORT_FORMAT || !isObject(data.group)) throw new Error('Not a Split bills export');
  if (data.version !== 1) throw new Error('This export is from a newer version of Quiver');
  const g = data.group;
  if (!isText(g.id) || !isText(g.name) || !isCode(g.currency) || !Array.isArray(g.members) || !Array.isArray(g.expenses)) {
    throw new Error('The group is missing fields');
  }
  const members = g.members.map((m): Member => {
    if (!isObject(m) || !isText(m.id) || !isText(m.name)) throw new Error('Invalid member');
    return { id: m.id, name: m.name };
  });
  const expenses = g.expenses.map((e): Expense => {
    if (
      !isObject(e) || !isText(e.id) || !isText(e.description) || !Number.isSafeInteger(e.amount) || !isCode(e.currency) ||
      !isText(e.paidBy) || !isWeights(e.weights) || !isText(e.date) || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
      (e.kind !== 'expense' && e.kind !== 'payment') ||
      !['equal', 'exact', 'percent', 'shares'].includes(e.mode as string)
    ) {
      throw new Error('Invalid expense');
    }
    return {
      id: e.id,
      kind: e.kind,
      description: e.description,
      amount: e.amount as number,
      currency: e.currency,
      paidBy: e.paidBy,
      mode: e.mode as SplitMode,
      weights: e.weights,
      category: typeof e.category === 'string' && e.category in CATEGORIES ? (e.category as CategoryId) : 'other',
      date: e.date,
      previous: parsePrevious(e.previous),
    };
  });
  const last = g.lastConversion;
  return {
    id: g.id,
    name: g.name,
    currency: g.currency,
    members,
    expenses,
    archived: g.archived === true,
    lastConversion: isObject(last) && isText(last.id) && isCode(last.to) ? { id: last.id, to: last.to } : undefined,
  };
}

/** A copy with fresh ids, for keeping an import next to the group it came from. */
export function withNewIds(group: Group, newId: () => string): Group {
  const map = new Map(group.members.map((m) => [m.id, newId()]));
  const remap = (id: string) => map.get(id) ?? id;
  const remapWeights = (w: Record<string, number>) => Object.fromEntries(Object.entries(w).map(([id, v]) => [remap(id), v]));
  const remapPrevious = (p?: Previous): Previous | undefined => p && { ...p, weights: remapWeights(p.weights), previous: remapPrevious(p.previous) };
  return {
    ...group,
    id: newId(),
    members: group.members.map((m) => ({ ...m, id: remap(m.id) })),
    expenses: group.expenses.map((e) => ({
      ...e,
      id: newId(),
      paidBy: remap(e.paidBy),
      weights: remapWeights(e.weights),
      previous: remapPrevious(e.previous),
    })),
  };
}

/** What the expense form edits: text fields, parsed on save. */
export interface Draft {
  id?: string;
  kind: Expense['kind'];
  description: string;
  /** Arithmetic allowed: "120+45.5". */
  amount: string;
  currency: string;
  paidBy: string;
  /** Payment recipient. */
  to: string;
  mode: SplitMode;
  /** Equal mode: who's in. */
  included: Record<string, boolean>;
  /** Exact, percent and shares modes: one field per member. */
  values: Record<string, string>;
  category: CategoryId;
  date: string;
}

export function emptyDraft(group: Pick<Group, 'members' | 'currency'>, today: string, kind: Expense['kind'] = 'expense'): Draft {
  return {
    kind,
    description: '',
    amount: '',
    currency: group.currency,
    paidBy: group.members[0]?.id ?? '',
    to: group.members[1]?.id ?? '',
    mode: 'equal',
    included: Object.fromEntries(group.members.map((m) => [m.id, true])),
    values: {},
    category: 'other',
    date: today,
  };
}

export function draftFromExpense(e: Expense, members: Member[]): Draft {
  const value = (v: number) => (e.mode === 'exact' ? String(fromMinor(v, e.currency)) : String(v));
  return {
    id: e.id,
    kind: e.kind,
    description: e.description,
    amount: String(fromMinor(e.amount, e.currency)),
    currency: e.currency,
    paidBy: e.paidBy,
    to: e.kind === 'payment' ? (Object.keys(e.weights)[0] ?? '') : (members.find((m) => m.id !== e.paidBy)?.id ?? ''),
    mode: e.mode,
    included: Object.fromEntries(members.map((m) => [m.id, e.mode === 'equal' && e.weights[m.id]! > 0])),
    values: e.mode === 'equal' ? {} : Object.fromEntries(Object.entries(e.weights).filter(([, v]) => v > 0).map(([id, v]) => [id, value(v)])),
    category: e.category,
    date: e.date,
  };
}

function parseNumber(text: string): number {
  if (!text.trim()) return 0;
  try {
    return evaluate(text);
  } catch {
    return Number.NaN;
  }
}

/** The form's amount in minor units, or undefined while it doesn't parse. */
export function draftAmount(d: Pick<Draft, 'amount' | 'currency'>): number | undefined {
  const n = parseNumber(d.amount);
  return d.amount.trim() && Number.isFinite(n) ? toMinor(n, d.currency) : undefined;
}

/** Weights from the form's per-member fields; exact amounts become minor units. */
export function draftWeights(d: Draft, members: Member[]): Record<string, number> {
  if (d.kind === 'payment') return d.to ? { [d.to]: 1 } : {};
  return Object.fromEntries(
    members.map((m) => {
      if (d.mode === 'equal') return [m.id, d.included[m.id] ? 1 : 0];
      const n = parseNumber(d.values[m.id] ?? '');
      return [m.id, d.mode === 'exact' && Number.isFinite(n) ? toMinor(n, d.currency) : n];
    }),
  );
}

function sameWeights(a: Record<string, number>, b: Record<string, number>): boolean {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...ids].every((id) => (a[id] ?? 0) === (b[id] ?? 0));
}

/**
 * Turns the form into an expense. Editing keeps the conversion history only
 * when the money is unchanged, so Undo conversion never reverts a later edit.
 */
export function buildExpense(d: Draft, members: Member[], newId: () => string, original?: Expense): { expense: Expense } | { error: string } {
  if (!/^[A-Z]{3}$/.test(d.currency)) return { error: 'Pick a currency' };
  const amount = draftAmount(d);
  if (amount === undefined) return { error: 'Enter the amount' };
  if (!members.some((m) => m.id === d.paidBy)) return { error: 'Pick who paid' };
  const payment = d.kind === 'payment';
  if (payment && (!d.to || d.to === d.paidBy)) return { error: 'Pick who received the money' };
  const mode: SplitMode = payment ? 'exact' : d.mode;
  const weights = payment ? { [d.to]: amount } : draftWeights(d, members);
  const draft = { amount, currency: d.currency, mode, weights };
  const error = splitError(draft);
  if (error) return { error };
  const same =
    original && original.amount === amount && original.currency === d.currency && original.mode === mode &&
    sameWeights(original.weights, weights);
  return {
    expense: {
      id: d.id ?? newId(),
      kind: d.kind,
      description: d.description.trim() || (payment ? 'Payment' : 'Expense'),
      ...draft,
      paidBy: d.paidBy,
      category: payment ? 'other' : d.category,
      date: d.date,
      previous: same ? original.previous : undefined,
    },
  };
}
