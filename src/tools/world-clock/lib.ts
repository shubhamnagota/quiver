const MINUTE = 60_000;

const partsFormatter = new Map<string, Intl.DateTimeFormat>();
function formatter(zone: string) {
  let f = partsFormatter.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatter.set(zone, f);
  }
  return f;
}

/** Minutes the zone is ahead of UTC at that instant (DST-aware). */
export function offsetMinutes(zone: string, ms: number): number {
  const p = Object.fromEntries(formatter(zone).formatToParts(ms).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / MINUTE);
}

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

/** Local time of day in hours (e.g. 13.5 for 13:30). */
export function localHours(zone: string, ms: number): number {
  const minutes = ((Math.floor(ms / MINUTE) + offsetMinutes(zone, ms)) % 1440 + 1440) % 1440;
  return minutes / 60;
}

/** Midnight in the zone for the day containing ms. */
export function startOfDay(zone: string, ms: number): number {
  return Math.floor(ms / MINUTE) * MINUTE - localHours(zone, ms) * 60 * MINUTE;
}

export function formatTime(zone: string, ms: number, seconds = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds && { second: '2-digit' }),
    hour12: false,
  }).format(ms);
}

export function formatDay(zone: string, ms: number): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' }).format(ms);
}

export const isWorkingHour = (h: number, start = 9, end = 18) => h >= start && h < end;

/** Half-hour slots across a day (from dayStart) when every zone is inside working hours. */
export function workingOverlap(zones: string[], dayStart: number, start = 9, end = 18): [number, number][] {
  const step = 30 * MINUTE;
  const ranges: [number, number][] = [];
  for (let t = dayStart; t < dayStart + 24 * 60 * MINUTE; t += step) {
    if (!zones.every((z) => isWorkingHour(localHours(z, t), start, end))) continue;
    const last = ranges.at(-1);
    if (last && last[1] === t) last[1] = t + step;
    else ranges.push([t, t + step]);
  }
  return ranges;
}

export function cityLabel(zone: string): string {
  return zone.split('/').at(-1)!.replace(/_/g, ' ');
}

export function allZones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'Asia/Dubai', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'Asia/Singapore'];
  }
}
