import { useEffect, useState } from 'react';
import { CurrencyInput } from '@/components/fx/CurrencyInput';
import { RatesStatus } from '@/components/fx/RatesStatus';
import { buttonClass, ErrorMessage, Panel } from '@/components/tool/Panel';
import { rateFor } from '@/lib/fx/rates';
import { useFx } from '@/lib/fx/store';
import { cn } from '@/lib/utils';
import { field } from './ExpenseForm';
import { currenciesOf, type Group } from './lib';

/** Mid-market rate as an editable string, or '' when there are no rates for the pair. */
function midRate(from: string, to: string, snapshot: ReturnType<typeof useFx.getState>['snapshot']): string {
  try {
    return snapshot ? String(Number(rateFor(from, to, snapshot).toPrecision(6))) : '';
  } catch {
    return '';
  }
}

export function ConvertPanel({
  group,
  onConvert,
  onClose,
}: {
  group: Group;
  onConvert: (to: string, rates: Record<string, number>) => void;
  onClose: () => void;
}) {
  const { snapshot, load } = useFx();
  const [to, setTo] = useState(group.currency);
  // Rates the user typed, keyed by "FROM>TO"; untouched pairs follow the live mid-market rate.
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();

  useEffect(() => {
    void load();
  }, [load]);

  const sources = currenciesOf(group).filter((c) => c !== to);
  const rateText = (from: string) => typed[`${from}>${to}`] ?? midRate(from, to, snapshot);

  return (
    <Panel title="Convert to one currency">
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Rewrites every bill in the chosen currency so the group settles in one currency. Each bill keeps its original
          amount and rate, and you can undo the latest conversion. Rates start at today's mid-market rate; change them to
          what your bank or card actually charged.
        </p>
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Convert everything to</span>
          <CurrencyInput value={to} onChange={(c) => { setTo(c); setError(undefined); }} label="Target currency" />
        </label>
        {sources.length === 0 ? (
          <p className="text-muted-foreground">Every bill is already in {to}.</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((from) => (
              <li key={from} className="flex flex-wrap items-center gap-2">
                <span className="w-16 font-mono">1 {from} =</span>
                <input
                  aria-label={`Rate from ${from} to ${to}`}
                  value={rateText(from)}
                  onChange={(e) => { setTyped({ ...typed, [`${from}>${to}`]: e.target.value }); setError(undefined); }}
                  inputMode="decimal"
                  placeholder="Rate"
                  className={cn(field, 'w-36 font-mono')}
                />
                <span className="font-mono">{to}</span>
              </li>
            ))}
          </ul>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!sources.length || !/^[A-Z]{3}$/.test(to)}
            onClick={() => {
              const rates: Record<string, number> = {};
              for (const from of sources) {
                const rate = Number(rateText(from));
                if (!(rate > 0) || !Number.isFinite(rate)) return setError(`Enter a rate for ${from}`);
                rates[from] = rate;
              }
              onConvert(to, rates);
            }}
            className={cn(buttonClass, 'bg-primary text-primary-foreground hover:bg-primary/90')}
          >
            Convert {sources.length ? `${sources.join(', ')} → ` : ''}{to}
          </button>
          <button type="button" onClick={onClose} className={buttonClass}>Cancel</button>
        </div>
        <RatesStatus />
      </div>
    </Panel>
  );
}
