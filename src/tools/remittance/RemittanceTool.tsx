import { Plus, Trophy, X } from 'lucide-react';
import { useEffect } from 'react';
import { CurrencyInput } from '@/components/fx/CurrencyInput';
import { RatesStatus } from '@/components/fx/RatesStatus';
import { buttonClass, ErrorMessage, Panel } from '@/components/tool/Panel';
import { formatAmount, formatRate } from '@/lib/fx/currencies';
import { rateFor } from '@/lib/fx/rates';
import { useFx } from '@/lib/fx/store';
import { evaluate } from '@/lib/math';
import { cn } from '@/lib/utils';
import { bestQuote, evaluateQuote } from './lib';
import { MAX_QUOTES, useRemittance } from './store';

const field = 'w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 font-mono text-sm';

export default function RemittanceTool() {
  const { send, sendCurrency, receiveCurrency, quotes, set, updateQuote, addQuote, removeQuote } = useRemittance();
  const { snapshot, load } = useFx();

  useEffect(() => {
    void load();
  }, [load]);

  let sendAmount: number | undefined;
  try {
    sendAmount = evaluate(send);
  } catch {
    sendAmount = undefined;
  }
  let mid: number | undefined;
  let midError: string | undefined;
  try {
    mid = snapshot ? rateFor(sendCurrency, receiveCurrency, snapshot) : undefined;
  } catch (e) {
    midError = (e as Error).message;
  }

  const results = sendAmount && sendAmount > 0 && mid ? quotes.map((q) => evaluateQuote(sendAmount, mid, q)) : [];
  const best = bestQuote(results);

  return (
    <div className="space-y-4">
      <Panel title="Transfer">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-muted-foreground">You send</span>
            <span className="mt-1 flex gap-2">
              <input aria-label="Send amount" inputMode="decimal" value={send} onChange={(e) => set({ send: e.target.value })} className={cn(field, 'w-36 text-base')} />
              <CurrencyInput value={sendCurrency} onChange={(c) => set({ sendCurrency: c })} label="Send currency" />
            </span>
          </label>
          <label className="text-sm">
            <span className="block text-muted-foreground">They receive</span>
            <span className="mt-1 flex">
              <CurrencyInput value={receiveCurrency} onChange={(c) => set({ receiveCurrency: c })} label="Receive currency" />
            </span>
          </label>
          <div className="text-sm">
            <span className="block text-muted-foreground">Mid-market</span>
            <span className="mt-1 block font-mono text-base">
              {mid ? `1 ${sendCurrency} = ${formatRate(mid)} ${receiveCurrency}` : '—'}
            </span>
          </div>
        </div>
        {sendAmount === undefined && <div className="mt-3"><ErrorMessage>Enter the amount you send</ErrorMessage></div>}
        {midError && <div className="mt-3"><ErrorMessage>{midError}</ErrorMessage></div>}
        {mid && sendAmount && sendAmount > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            At mid-market with no fees, {formatAmount(sendAmount, sendCurrency)} {sendCurrency} ={' '}
            <span className="font-mono text-foreground">{formatAmount(sendAmount * mid, receiveCurrency)} {receiveCurrency}</span>
          </p>
        )}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quotes.map((q, i) => {
          const r = results[i];
          const isBest = i === best && results.filter((x) => 'received' in x).length > 1;
          return (
            <section key={q.id} className={cn('rounded-lg border p-3', isBest ? 'border-success/60 bg-success/5' : 'border-border')}>
              <div className="mb-3 flex items-center gap-2">
                <input aria-label="Provider name" value={q.name} onChange={(e) => updateQuote(q.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent font-medium" />
                {isBest && <span className="inline-flex items-center gap-1 text-xs text-success"><Trophy className="size-3.5" /> Best</span>}
                <button type="button" onClick={() => removeQuote(q.id)} aria-label={`Remove ${q.name}`} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <label className="block">
                  <span className="text-muted-foreground">Rate (1 {sendCurrency} = ? {receiveCurrency})</span>
                  <input aria-label={`${q.name} rate`} inputMode="decimal" value={q.rate} onChange={(e) => updateQuote(q.id, { rate: e.target.value })} placeholder={mid ? formatRate(mid) : ''} className={field} />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-muted-foreground">Flat fee ({sendCurrency})</span>
                    <input aria-label={`${q.name} flat fee`} inputMode="decimal" value={q.flatFee} onChange={(e) => updateQuote(q.id, { flatFee: e.target.value })} placeholder="0" className={field} />
                  </label>
                  <label className="block">
                    <span className="text-muted-foreground">Fee %</span>
                    <input aria-label={`${q.name} percent fee`} inputMode="decimal" value={q.pctFee} onChange={(e) => updateQuote(q.id, { pctFee: e.target.value })} placeholder="0" className={field} />
                  </label>
                </div>
              </div>
              {r && 'received' in r && (
                <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Received</dt><dd className="font-mono font-medium">{formatAmount(r.received, receiveCurrency)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Effective rate</dt><dd className="font-mono">{formatRate(r.effectiveRate)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Fees</dt><dd className="font-mono">{formatAmount(r.totalFee, sendCurrency)}</dd></div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Markup vs mid</dt>
                    <dd className={cn('font-mono', r.markupPct > 0 ? 'text-amber-500' : 'text-success')}>
                      {r.markupPct.toFixed(2)}% · {formatAmount(r.costInSend, sendCurrency)} {sendCurrency}
                    </dd>
                  </div>
                </dl>
              )}
              {r && 'error' in r && q.rate && <p className="mt-3 text-sm text-red-500">{r.error}</p>}
            </section>
          );
        })}
        {quotes.length < MAX_QUOTES && (
          <button type="button" onClick={addQuote} className={cn(buttonClass, 'min-h-24 justify-center border-dashed text-sm')}>
            <Plus className="size-4" /> Add provider
          </button>
        )}
      </div>

      <RatesStatus />
      <p className="text-xs text-muted-foreground">
        Rates are mid-market references. Your provider's rate will differ. Fees are assumed to come out of the amount you send.
      </p>
    </div>
  );
}
