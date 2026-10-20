import { formatAmount, minorUnits } from '@/lib/fx/currencies';

export interface Member {
  id: string;
  name: string;
}

export type SplitMode = 'equal' | 'exact' | 'percent' | 'shares';

export interface Expense {
  id: string;
  /** A payment settles a debt: `paidBy` paid the single member in `weights`. */
  kind: 'expense' | 'payment';
  description: string;
  /** Minor units of the group currency (cents, fils, paise). */
  amount: number;
  paidBy: string;
  mode: SplitMode;
  /**
   * Per member: equal = 1 if included, exact = minor units owed,
   * percent = percent of the total, shares = relative weight.
   */
  weights: Record<string, number>;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  expenses: Expense[];
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
export function splitError(expense: Pick<Expense, 'amount' | 'mode' | 'weights'>, currency: string): string | undefined {
  const values = Object.values(expense.weights).filter((v) => v > 0);
  if (!(expense.amount > 0)) return 'Enter an amount above zero';
  if (Object.values(expense.weights).some((v) => !Number.isFinite(v) || v < 0)) return 'Values must be zero or more';
  if (!values.length) return 'Pick at least one person';
  const sum = values.reduce((s, v) => s + v, 0);
  if (expense.mode === 'exact' && sum !== expense.amount) {
    const diff = expense.amount - sum;
    return `Amounts ${diff > 0 ? 'are short by' : 'exceed the total by'} ${formatMinor(Math.abs(diff), currency)}`;
  }
  if (expense.mode === 'percent' && Math.abs(sum - 100) > 1e-9) return `Percentages add up to ${+sum.toFixed(4)}%, not 100%`;
  return undefined;
}

/** What each member owes for one expense, in minor units. */
export function owed(expense: Expense): Record<string, number> {
  return expense.mode === 'exact' ? { ...expense.weights } : allocate(expense.amount, expense.weights);
}

/** An expense counts only when its split is valid and everyone in it is still a member. */
function counts(e: Expense, group: Pick<Group, 'members' | 'currency'>): boolean {
  const ids = new Set(group.members.map((m) => m.id));
  return !splitError(e, group.currency) && ids.has(e.paidBy) && Object.keys(owed(e)).every((id) => ids.has(id));
}

/** Net position per member: positive is owed money, negative owes money. Invalid expenses are skipped. */
export function balances(group: Pick<Group, 'members' | 'expenses' | 'currency'>): Record<string, number> {
  const net: Record<string, number> = Object.fromEntries(group.members.map((m) => [m.id, 0]));
  for (const e of group.expenses) {
    if (!counts(e, group)) continue;
    net[e.paidBy]! += e.amount;
    for (const [id, v] of Object.entries(owed(e))) net[id]! -= v;
  }
  return net;
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

/** Total spent by the group, excluding settle-up payments. */
export function totalSpent(group: Pick<Group, 'members' | 'expenses' | 'currency'>): number {
  return group.expenses
    .filter((e) => e.kind === 'expense' && counts(e, group))
    .reduce((s, e) => s + e.amount, 0);
}

/** Plain-text summary for pasting into a chat. */
export function summary(group: Group): string {
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const money = (v: number) => `${formatMinor(v, group.currency)} ${group.currency}`;
  const transfers = settle(balances(group));
  const lines = [`${group.name}: ${money(totalSpent(group))} spent`];
  if (!transfers.length) lines.push('All settled up.');
  for (const t of transfers) lines.push(`${name(t.from)} pays ${name(t.to)} ${money(t.amount)}`);
  return lines.join('\n');
}
