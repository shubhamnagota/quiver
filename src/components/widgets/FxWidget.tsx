import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { formatRate } from '@/lib/fx/currencies';
import { rateFor } from '@/lib/fx/rates';
import { useFx } from '@/lib/fx/store';
import { relativeTime } from '@/lib/time';

export function FxWidget({ from = 'AED', to = 'INR' }: { from?: string; to?: string }) {
  const { snapshot, load, loading, error } = useFx();
  useEffect(() => {
    void load();
  }, [load]);

  let rate: number | undefined;
  try {
    rate = snapshot ? rateFor(from, to, snapshot) : undefined;
  } catch {
    rate = undefined;
  }

  return (
    <Link data-nav-item to="/t/$toolId" params={{ toolId: 'fx' }} className="block rounded-lg border border-border p-4 hover:bg-accent">
      <p className="mb-2 text-xs text-muted-foreground">{from} → {to} mid-market</p>
      <p className="font-mono text-2xl tabular-nums">{rate ? formatRate(rate) : loading ? '…' : '—'}</p>
      <p className="text-xs text-muted-foreground">
        {snapshot ? `Updated ${relativeTime(snapshot.asOf)}` : (error ?? 'Loading rates')}
      </p>
    </Link>
  );
}
