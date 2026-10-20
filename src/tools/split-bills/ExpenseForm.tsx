import { useState } from 'react';
import { CurrencyInput } from '@/components/fx/CurrencyInput';
import { buttonClass, ErrorMessage, Panel, Segmented, selectClass } from '@/components/tool/Panel';
import { cn } from '@/lib/utils';
import {
  buildExpense,
  CATEGORIES,
  type CategoryId,
  type Draft,
  draftAmount,
  draftWeights,
  type Expense,
  formatMinor,
  type Group,
  type SplitMode,
} from './lib';

export const field = 'w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm';

const MODES: { value: SplitMode; label: string }[] = [
  { value: 'equal', label: 'Equally' },
  { value: 'exact', label: 'Amounts' },
  { value: 'percent', label: '%' },
  { value: 'shares', label: 'Shares' },
];

/** A one-line status under the per-member fields: what's left to assign, or each person's part. */
function splitHint(d: Draft, group: Group, amount: number | undefined): string | undefined {
  if (amount === undefined || !(amount > 0)) return undefined;
  const weights = draftWeights(d, group.members);
  const sum = Object.values(weights).filter((v) => v > 0).reduce((s, v) => s + v, 0);
  if (d.mode === 'exact') {
    const left = amount - sum;
    return left === 0 ? 'Adds up' : `${formatMinor(Math.abs(left), d.currency)} ${left > 0 ? 'left to assign' : 'over'}`;
  }
  if (d.mode === 'percent') return `${+sum.toFixed(4)}% of 100%`;
  const people = Object.values(weights).filter((v) => v > 0).length;
  if (d.mode === 'equal' && people) return `${formatMinor(Math.floor(amount / people), d.currency)} each`;
  return undefined;
}

export function ExpenseForm({
  group,
  initial,
  original,
  onSave,
  onCancel,
}: {
  group: Group;
  initial: Draft;
  original?: Expense;
  onSave: (expense: Expense) => void;
  onCancel?: () => void;
}) {
  const [d, setD] = useState(initial);
  const [error, setError] = useState<string>();
  const set = (patch: Partial<Draft>) => {
    setD((prev) => ({ ...prev, ...patch }));
    setError(undefined);
  };
  const payment = d.kind === 'payment';
  const result = buildExpense(d, group.members, () => crypto.randomUUID(), original);
  const hint = payment ? undefined : splitHint(d, group, draftAmount(d));

  return (
    <Panel
      title={d.id ? 'Edit' : payment ? 'Record a payment' : 'Add an expense'}
      actions={
        <Segmented
          label="Entry type"
          value={d.kind}
          onChange={(kind) => set({ kind })}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'payment', label: 'Payment' },
          ]}
        />
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if ('error' in result) return setError(result.error);
          onSave(result.expense);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
          <label className="text-sm">
            <span className="text-muted-foreground">{payment ? 'Note' : 'Description'}</span>
            <input value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder={payment ? 'Payment' : 'Dinner, taxi, rent…'} className={field} />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Amount</span>
            <input value={d.amount} onChange={(e) => set({ amount: e.target.value })} inputMode="decimal" placeholder="0.00" className={cn(field, 'font-mono')} />
          </label>
          <div className="text-sm">
            <span className="text-muted-foreground">Currency</span>
            <div className="flex">
              <CurrencyInput value={d.currency} onChange={(currency) => set({ currency })} label="Expense currency" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="text-sm">
            <span className="block text-muted-foreground">{payment ? 'From' : 'Paid by'}</span>
            <select value={d.paidBy} onChange={(e) => set({ paidBy: e.target.value })} className={selectClass}>
              {group.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          {payment && (
            <label className="text-sm">
              <span className="block text-muted-foreground">To</span>
              <select value={d.to} onChange={(e) => set({ to: e.target.value })} className={selectClass}>
                <option value="">Choose…</option>
                {group.members.filter((m) => m.id !== d.paidBy).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          )}
          {!payment && (
            <label className="text-sm">
              <span className="block text-muted-foreground">Category</span>
              <select value={d.category} onChange={(e) => set({ category: e.target.value as CategoryId })} className={selectClass}>
                {Object.entries(CATEGORIES).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm">
            <span className="block text-muted-foreground">Date</span>
            <input type="date" value={d.date} onChange={(e) => e.target.value && set({ date: e.target.value })} className={selectClass} />
          </label>
        </div>

        {!payment && (
          <fieldset className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <legend className="text-sm text-muted-foreground">Split</legend>
              <Segmented label="Split mode" value={d.mode} onChange={(mode) => set({ mode })} options={MODES} />
              {hint && <span className="text-xs text-muted-foreground" aria-live="polite">{hint}</span>}
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {group.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  {d.mode === 'equal' ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d.included[m.id] ?? false}
                        onChange={(e) => set({ included: { ...d.included, [m.id]: e.target.checked } })}
                      />
                      {m.name}
                    </label>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{m.name}</span>
                      <input
                        aria-label={`${m.name} ${d.mode === 'exact' ? 'amount' : d.mode === 'percent' ? 'percent' : 'shares'}`}
                        value={d.values[m.id] ?? ''}
                        onChange={(e) => set({ values: { ...d.values, [m.id]: e.target.value } })}
                        inputMode="decimal"
                        placeholder="0"
                        className={cn(field, 'w-28 font-mono')}
                      />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="flex gap-2">
          <button type="submit" className={cn(buttonClass, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
            {d.id ? 'Save changes' : payment ? 'Record payment' : 'Add expense'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={buttonClass}>Cancel</button>
          )}
        </div>
      </form>
    </Panel>
  );
}

