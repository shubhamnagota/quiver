import { Link } from '@tanstack/react-router';
import { useNow } from '@/lib/useNow';
import { useClock } from '@/stores/clock';
import { formatDay, formatTime } from '@/tools/world-clock/lib';

export function ClockWidget() {
  const cities = useClock((s) => s.cities).slice(0, 3);
  const now = useNow();

  return (
    <Link data-nav-item to="/t/$toolId" params={{ toolId: 'world-clock' }} className="block rounded-lg border border-border p-4 hover:bg-accent">
      <p className="mb-2 text-xs text-muted-foreground">World clock</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {cities.map((c) => (
          <div key={c.zone}>
            <p className="font-mono text-2xl tabular-nums">{formatTime(c.zone, now)}</p>
            <p className="text-xs text-muted-foreground">{c.label} · {formatDay(c.zone, now)}</p>
          </div>
        ))}
        {cities.length === 0 && <p className="text-sm text-muted-foreground">Add cities in the world clock.</p>}
      </div>
    </Link>
  );
}
