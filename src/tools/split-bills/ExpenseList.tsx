import { Pencil, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { buttonClass, Panel, selectClass } from '@/components/tool/Panel';
import { cn } from '@/lib/utils';
import { ExpenseIcon } from './CategoryIcon';
import { field } from './ExpenseForm';
import { CATEGORIES, type CategoryId, counts, type Expense, filterExpenses, type Filter, formatMinor, type Group, owed, splitError } from './lib';

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

export function ExpenseList({
  group,
  editingId,
  onEdit,
  onDelete,
}: {
  group: Group;
  editingId?: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  const [filter, setFilter] = useState<Filter>({});
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? 'Removed member';
  const months = [...new Set(group.expenses.map((e) => e.date.slice(0, 7)))].sort().reverse();
  const sorted = [...group.expenses].sort((a, b) => b.date.localeCompare(a.date));
  const shown = filterExpenses(sorted, filter);
  const filtered = Boolean(filter.query || filter.member || filter.category || filter.month);

  return (
    <Panel title={filtered ? `Expenses · ${shown.length} of ${group.expenses.length}` : `Expenses · ${group.expenses.length}`}>
      {group.expenses.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="relative min-w-40 flex-1">
            <Search className="absolute top-2 left-2 size-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              aria-label="Search expenses"
              value={filter.query ?? ''}
              onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              placeholder="Search"
              className={cn(field, 'pl-8')}
            />
          </label>
          <select aria-label="Filter by person" value={filter.member ?? ''} onChange={(e) => setFilter({ ...filter, member: e.target.value })} className={selectClass}>
            <option value="">Everyone</option>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            aria-label="Filter by category"
            value={filter.category ?? ''}
            onChange={(e) => setFilter({ ...filter, category: e.target.value as CategoryId | '' })}
            className={selectClass}
          >
            <option value="">All categories</option>
            {Object.entries(CATEGORIES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select aria-label="Filter by month" value={filter.month ?? ''} onChange={(e) => setFilter({ ...filter, month: e.target.value })} className={selectClass}>
            <option value="">Any month</option>
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          {filtered && (
            <button type="button" onClick={() => setFilter({})} className={buttonClass}>Clear</button>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{group.expenses.length ? 'Nothing matches these filters.' : 'No expenses yet.'}</p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((e) => {
            const parts = owed(e);
            const problem = splitError(e) ?? (counts(e, group.members) ? undefined : 'Mentions a removed member');
            const detail =
              e.kind === 'payment'
                ? `${name(e.paidBy)} paid ${name(Object.keys(e.weights)[0] ?? '')}`
                : `${name(e.paidBy)} paid · split ${Object.keys(parts).length === group.members.length ? 'between everyone' : `with ${Object.keys(parts).map(name).join(', ')}`}`;
            return (
              <li key={e.id} className={cn('flex items-start gap-3 py-2', editingId === e.id && 'bg-accent/50')}>
                <span className="mt-0.5 rounded-md bg-muted p-1.5">
                  <ExpenseIcon expense={e} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(`${e.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {detail}
                  </p>
                  {e.previous && (
                    <p className="text-xs text-muted-foreground">
                      was {formatMinor(e.previous.amount, e.previous.currency)} {e.previous.currency} @ {e.previous.rate}
                    </p>
                  )}
                  {problem && <p className="text-xs text-danger">{problem}; not counted</p>}
                </div>
                <span className="text-right font-mono text-sm whitespace-nowrap">
                  {formatMinor(e.amount, e.currency)} <span className="text-xs text-muted-foreground">{e.currency}</span>
                </span>
                <button type="button" onClick={() => onEdit(e)} aria-label={`Edit ${e.description}`} className="rounded p-1 text-muted-foreground hover:text-foreground">
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => onDelete(e)} aria-label={`Delete ${e.description}`} className="rounded p-1 text-muted-foreground hover:text-danger">
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
