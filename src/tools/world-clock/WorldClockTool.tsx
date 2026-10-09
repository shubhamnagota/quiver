import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { buttonClass, Panel } from '@/components/tool/Panel';
import { useNow } from '@/lib/useNow';
import { cn } from '@/lib/utils';
import { useClock } from '@/stores/clock';
import { allZones, cityLabel, formatDay, formatOffset, formatTime, isWorkingHour, localHours, offsetMinutes, startOfDay, workingOverlap } from './lib';

const zones = allZones();

function AddCity() {
  const add = useClock((s) => s.add);
  const [zone, setZone] = useState('');
  const id = useId();
  const valid = zones.includes(zone);
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) {
          add({ zone, label: cityLabel(zone) });
          setZone('');
        }
      }}
    >
      <input
        aria-label="Add city by time zone"
        list={id}
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        placeholder="Search a city, e.g. London"
        className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm"
      />
      <datalist id={id}>
        {zones.map((z) => <option key={z} value={z}>{cityLabel(z)}</option>)}
      </datalist>
      <button type="submit" disabled={!valid} className={buttonClass}>
        <Plus className="size-3.5" /> Add
      </button>
    </form>
  );
}

export default function WorldClockTool() {
  const now = useNow();
  const { cities, remove, move } = useClock();
  const base = cities[0]?.zone ?? 'UTC';
  const dayStart = startOfDay(base, now);
  const [slot, setSlot] = useState(() => Math.floor(localHours(base, Date.now()) * 2));
  const at = dayStart + slot * 30 * 60_000;
  const overlap = workingOverlap(cities.map((c) => c.zone), dayStart);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c, i) => {
          const working = isWorkingHour(localHours(c.zone, now));
          return (
            <section key={c.zone} className="relative rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-xs text-muted-foreground">{formatOffset(offsetMinutes(c.zone, now))}</span>
                {i === 0 && <span className="rounded-full border border-border px-1.5 text-xs text-muted-foreground">base</span>}
                <div className="ml-auto flex">
                  <button type="button" onClick={() => move(c.zone, -1)} disabled={i === 0} aria-label={`Move ${c.label} up`} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="size-4" /></button>
                  <button type="button" onClick={() => move(c.zone, 1)} disabled={i === cities.length - 1} aria-label={`Move ${c.label} down`} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="size-4" /></button>
                  <button type="button" onClick={() => remove(c.zone)} aria-label={`Remove ${c.label}`} className="rounded p-0.5 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
              </div>
              <p className="mt-2 font-mono text-3xl tabular-nums">{formatTime(c.zone, now, true)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDay(c.zone, now)} · <span className={working ? 'text-success' : ''}>{working ? 'working hours' : 'outside 9–18'}</span>
              </p>
            </section>
          );
        })}
      </div>
      <AddCity />

      {cities.length > 0 && (
        <Panel title="Meeting planner">
          <label className="block text-sm">
            <span className="text-muted-foreground">
              {formatTime(base, at)} in {cities[0]!.label} ({formatDay(base, at)})
            </span>
            <input
              type="range"
              min={0}
              max={47}
              value={slot}
              onChange={(e) => setSlot(Number(e.target.value))}
              aria-label="Meeting time"
              className="mt-2 w-full accent-[var(--primary)]"
            />
          </label>
          <ul className="mt-3 divide-y divide-border">
            {cities.map((c) => {
              const ok = isWorkingHour(localHours(c.zone, at));
              return (
                <li key={c.zone} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{c.label}</span>
                  <span className={cn('font-mono', ok ? 'text-success' : 'text-muted-foreground')}>
                    {formatTime(c.zone, at)} <span className="text-xs">{formatDay(c.zone, at)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm" role="status">
            {cities.length < 2
              ? 'Add another city to find overlapping working hours.'
              : overlap.length
                ? `Everyone is in 9–18 working hours: ${overlap.map(([s, e]) => `${formatTime(base, s)}–${formatTime(base, e)}`).join(', ')} ${cities[0]!.label} time.`
                : 'No overlap in 9–18 working hours today.'}
          </p>
        </Panel>
      )}
    </div>
  );
}
