import { ArrowRight } from 'lucide-react';
import { buttonClass, Panel } from '@/components/tool/Panel';
import { cn } from '@/lib/utils';
import { ExpenseIcon } from './CategoryIcon';
import { breakdown, byCategory, CATEGORIES, currenciesOf, formatMinor, type Group, settle, type Transfer, totalSpent } from './lib';

const signed = (v: number, currency: string) => (v > 0 ? '+' : v < 0 ? '−' : '') + formatMinor(Math.abs(v), currency);

/** Balances, settle-up, per-person and per-category totals, one section per currency. */
export function Overview({ group, onRecord }: { group: Group; onRecord: (t: Transfer, currency: string) => void }) {
  const currencies = currenciesOf(group);
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';

  if (!currencies.length) {
    return (
      <Panel title="Balances">
        <p className="text-sm text-muted-foreground">No expenses yet. Add one below and balances appear here.</p>
      </Panel>
    );
  }

  return (
    <>
      {currencies.map((c) => {
        const people = breakdown(group, c);
        const transfers = settle(Object.fromEntries(Object.entries(people).map(([id, t]) => [id, t.net])));
        const total = totalSpent(group, c);
        const categories = byCategory(group, c);
        return (
          <Panel key={c} title={<>Balances in <span className="font-mono text-foreground">{c}</span> · {formatMinor(total, c)} spent</>}>
            <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
              <section>
                <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Settle up</h3>
                {transfers.length === 0 ? (
                  <p className="text-sm text-success">All settled up.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {transfers.map((t) => (
                      <li key={`${t.from}-${t.to}`} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{name(t.from)}</span>
                        <ArrowRight className="size-3.5 text-muted-foreground" aria-label="pays" />
                        <span className="font-medium">{name(t.to)}</span>
                        <span className="font-mono">{formatMinor(t.amount, c)}</span>
                        <button type="button" onClick={() => onRecord(t, c)} className={cn(buttonClass, 'ml-auto')}>
                          Record payment
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="overflow-x-auto">
                <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Per person</h3>
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1 text-left font-normal">Name</th>
                      <th className="py-1 text-right font-normal" title="Spent on the group's behalf">Paid</th>
                      <th className="py-1 text-right font-normal" title="Their part of the group's expenses">Share</th>
                      <th className="py-1 text-right font-normal" title="Positive means they're owed money">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.members.map((m) => {
                      const t = people[m.id]!;
                      return (
                        <tr key={m.id} className="border-t border-border">
                          <td className="py-1">{m.name}</td>
                          <td className="py-1 text-right font-mono">{formatMinor(t.paid, c)}</td>
                          <td className="py-1 text-right font-mono">{formatMinor(t.share, c)}</td>
                          <td className={cn('py-1 text-right font-mono', t.net > 0 && 'text-success', t.net < 0 && 'text-danger')}>
                            {signed(t.net, c)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              {categories.length > 0 && (
                <section className="lg:col-span-2">
                  <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">By category</h3>
                  <ul className="space-y-1.5">
                    {categories.map(({ category, amount }) => (
                      <li key={category} className="grid grid-cols-[1.25rem_8rem_1fr_auto] items-center gap-2 text-sm">
                        <ExpenseIcon expense={{ kind: 'expense', category }} className="size-4 text-muted-foreground" />
                        <span className="truncate">{CATEGORIES[category]}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary" style={{ width: `${(amount / total) * 100}%` }} />
                        </span>
                        <span className="font-mono">{formatMinor(amount, c)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </Panel>
        );
      })}
    </>
  );
}
