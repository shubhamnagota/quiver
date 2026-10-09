export interface Quote {
  id: string;
  name: string;
  /** Receive-currency units per 1 send-currency unit, as the provider quotes it. */
  rate: string;
  /** In the send currency. */
  flatFee: string;
  /** Percent of the send amount. */
  pctFee: string;
}

export interface QuoteResult {
  received: number;
  totalFee: number;
  effectiveRate: number;
  /** How much worse than mid-market, as a percent of the send amount. */
  markupPct: number;
  /** The same cost expressed in the send currency. */
  costInSend: number;
}

const num = (s: string) => (s.trim() === '' ? 0 : Number(s));

/** Fees are deducted from the amount sent; the rest converts at the provider's rate. */
export function evaluateQuote(send: number, mid: number, q: Pick<Quote, 'rate' | 'flatFee' | 'pctFee'>): QuoteResult | { error: string } {
  const rate = Number(q.rate);
  const flat = num(q.flatFee);
  const pct = num(q.pctFee);
  if (!q.rate.trim() || !Number.isFinite(rate) || rate <= 0) return { error: 'Enter the rate the provider quotes' };
  if (!Number.isFinite(flat) || flat < 0 || !Number.isFinite(pct) || pct < 0 || pct >= 100) return { error: 'Fees must be zero or more (and under 100%)' };
  const totalFee = flat + (send * pct) / 100;
  if (totalFee >= send) return { error: 'Fees exceed the amount sent' };
  const received = (send - totalFee) * rate;
  const effectiveRate = received / send;
  return {
    received,
    totalFee,
    effectiveRate,
    markupPct: (1 - effectiveRate / mid) * 100,
    costInSend: send - received / mid,
  };
}

export function bestQuote(results: (QuoteResult | { error: string })[]): number {
  let best = -1;
  results.forEach((r, i) => {
    if ('received' in r && (best < 0 || r.received > (results[best] as QuoteResult).received)) best = i;
  });
  return best;
}
