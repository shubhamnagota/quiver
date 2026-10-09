import { ArrowLeftRight, Plus, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { CurrencyInput } from '@/components/fx/CurrencyInput';
import { RatesStatus } from '@/components/fx/RatesStatus';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { buttonClass, ErrorMessage, Panel, Split } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { currencyName, formatAmount, formatRate } from '@/lib/fx/currencies';
import { rateFor } from '@/lib/fx/rates';
import { useFx } from '@/lib/fx/store';
import { convertAll, isCurrencyCode, parseAmount } from './lib';
import { useFxPrefs, type Pair } from './store';

function AddCurrency({ onAdd, label }: { onAdd: (code: string) => void; label: string }) {
  const [code, setCode] = useState('');
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (isCurrencyCode(code)) {
          onAdd(code);
          setCode('');
        }
      }}
    >
      <CurrencyInput value={code} onChange={setCode} label={label} />
      <button type="submit" className={buttonClass} disabled={!isCurrencyCode(code)}>
        <Plus className="size-3.5" /> Add
      </button>
    </form>
  );
}

function PairCard({ pair, onRemove }: { pair: Pair; onRemove: () => void }) {
  const snapshot = useFx((s) => s.snapshot);
  const [a, b] = pair;
  let rates: { forward: number; inverse: number } | undefined;
  let error: string | undefined;
  try {
    if (snapshot) rates = { forward: rateFor(a, b, snapshot), inverse: rateFor(b, a, snapshot) };
  } catch (e) {
    error = (e as Error).message;
  }
  let body: ReactNode = <p className="text-sm text-muted-foreground">—</p>;
  if (error) body = <p className="text-sm text-red-500">{error}</p>;
  else if (rates) {
    body = (
      <>
        <p className="font-mono text-lg">{formatRate(rates.forward)}</p>
        <p className="text-xs text-muted-foreground">1 {b} = {formatRate(rates.inverse)} {a}</p>
      </>
    );
  }
  return (
    <div className="relative rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">1 {a} → {b}</p>
      {body}
      <button type="button" onClick={onRemove} aria-label={`Remove ${a} to ${b}`} className="absolute top-2 right-2 rounded p-0.5 text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export default function FxTool() {
  const [input, setInput] = useToolInput('fx');
  const { from, targets, pairs, setFrom, setTargets, setPairs } = useFxPrefs();
  const { snapshot, load, error } = useFx();
  const [pairFrom, setPairFrom] = useState('');

  useEffect(() => {
    void load();
  }, [load]);

  const amount = parseAmount(input || '1');
  const rows = snapshot && amount?.ok && isCurrencyCode(from) ? convertAll(amount.value, from, targets, snapshot) : [];
  const fromKnown = !snapshot || !isCurrencyCode(from) || from in snapshot.rates;
  const output = rows.filter((r) => r.value !== undefined).map((r) => `${formatAmount(r.value!, r.code)} ${r.code}`).join('\n');

  const swap = () => {
    const [first, ...rest] = targets;
    if (!first) return;
    setTargets([from, ...rest]);
    setFrom(first);
  };

  return (
    <div className="space-y-4">
      <ActionsBar toolId="fx" input={input} output={output} onClear={() => setInput('')} onSample={() => setInput('2500*12')} />
      <Split>
        <Panel title="Amount">
          <div className="flex items-center gap-2">
            <input
              aria-label="Amount"
              inputMode="decimal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1"
              className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-2 font-mono text-lg"
            />
            <CurrencyInput value={from} onChange={setFrom} label="From currency" className="py-2.5" />
            <button type="button" onClick={swap} aria-label="Swap with first target" className={buttonClass}>
              <ArrowLeftRight className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {amount?.ok && amount.isExpression && `= ${formatAmount(amount.value, from)} · `}
            {currencyName(from)} · math like 2500*12 works
          </p>
          {amount && !amount.ok && <div className="mt-2"><ErrorMessage>{amount.error}</ErrorMessage></div>}
          {!fromKnown && <div className="mt-2"><ErrorMessage>No rate for {from}</ErrorMessage></div>}
          {error && !snapshot && <div className="mt-2"><ErrorMessage>{error}</ErrorMessage></div>}
        </Panel>
        <Panel title="Converted">
          <ul className="divide-y divide-border">
            {targets.map((code, i) => {
              const row = rows[i];
              return (
                <li key={code} className="flex items-center gap-3 py-2">
                  <span className="w-12 font-mono text-sm" title={currencyName(code)}>{code}</span>
                  {row?.error ? (
                    <span className="flex-1 text-sm text-red-500">{row.error}</span>
                  ) : (
                    <span className="flex-1 font-mono text-lg">{row?.value !== undefined ? formatAmount(row.value, code) : '—'}</span>
                  )}
                  {row?.value !== undefined && <CopyButton value={formatAmount(row.value, code).replace(/,/g, '')} />}
                  <button type="button" onClick={() => setTargets(targets.filter((t) => t !== code))} aria-label={`Remove ${code}`} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3">
            <AddCurrency label="Add target currency" onAdd={(c) => !targets.includes(c) && setTargets([...targets, c])} />
          </div>
        </Panel>
      </Split>

      <Panel title="Pinned rates">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pairs.map((p, i) => (
            <PairCard key={`${p[0]}-${p[1]}`} pair={p} onRemove={() => setPairs(pairs.filter((_, j) => j !== i))} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <CurrencyInput value={pairFrom} onChange={setPairFrom} label="Pair from currency" />
          <span className="text-muted-foreground">→</span>
          <AddCurrency
            label="Pair to currency"
            onAdd={(to) => {
              if (isCurrencyCode(pairFrom) && pairFrom !== to) {
                setPairs([...pairs, [pairFrom, to]]);
                setPairFrom('');
              }
            }}
          />
        </div>
      </Panel>

      <RatesStatus />
      <p className="text-xs text-muted-foreground">Rates are mid-market references for information only; your bank or provider's rate will differ.</p>
    </div>
  );
}
