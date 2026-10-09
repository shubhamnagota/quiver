import { isFresh, providerById } from '@/lib/fx/rates';
import { useFx } from '@/lib/fx/store';
import { formatInZone, relativeTime } from '@/lib/time';
import { useNow } from '@/lib/useNow';

/** As-of time, provider (with the attribution ExchangeRate-API requires), and stale/offline state. */
export function RatesStatus() {
  const { snapshot, loading, error } = useFx();
  const now = useNow(60_000);
  if (!snapshot) {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {loading ? 'Loading rates…' : (error ?? 'No rates yet.')}
      </p>
    );
  }
  const provider = providerById(snapshot.provider);
  const stale = !isFresh(snapshot, now);
  return (
    <p className="text-xs text-muted-foreground" role="status">
      Mid-market rates as of {formatInZone(snapshot.asOf, 'Asia/Dubai')} ·{' '}
      <a href={provider.site} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
        Rates by {provider.name}
      </a>{' '}
      · fetched {relativeTime(snapshot.fetchedAt, now)}
      {loading && ' · refreshing…'}
      {stale && !loading && (
        <span className="ml-2 rounded-full border border-warning/40 px-1.5 text-warning">stale{error ? ', offline' : ''}</span>
      )}
    </p>
  );
}
