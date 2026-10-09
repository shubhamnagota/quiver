export type Unit = 's' | 'ms' | 'µs' | 'ns';

export const UNIT_LABELS: Record<Unit, string> = { s: 'seconds', ms: 'milliseconds', µs: 'microseconds', ns: 'nanoseconds' };

const DIVISORS: Record<Unit, number> = { s: 0.001, ms: 1, µs: 1000, ns: 1_000_000 };

/** Picks the unit from digit count: up to 11 digits is seconds, 12–14 ms, 15–17 µs, 18+ ns. */
export function detectUnit(digits: string): Unit {
  const n = digits.replace(/^-/, '').split('.')[0]!.length;
  if (n <= 11) return 's';
  if (n <= 14) return 'ms';
  if (n <= 17) return 'µs';
  return 'ns';
}

export type Parsed = { kind: 'epoch'; ms: number; unit: Unit } | { kind: 'date'; ms: number };

/** Parses an epoch in any unit, or a date string, into epoch milliseconds. */
export function parseTime(input: string, unit?: Unit): Parsed | null {
  const t = input.trim();
  if (!t) return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) {
    const u = unit ?? detectUnit(t);
    const ms = Number(t) / DIVISORS[u];
    if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return null;
    return { kind: 'epoch', ms, unit: u };
  }
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? null : { kind: 'date', ms };
}

export function toUnits(ms: number) {
  return {
    s: String(Math.floor(ms / 1000)),
    ms: String(Math.floor(ms)),
    µs: String(BigInt(Math.floor(ms)) * 1000n),
    ns: String(BigInt(Math.floor(ms)) * 1_000_000n),
  } satisfies Record<Unit, string>;
}

const MIN = Date.UTC(1990, 0, 1);
const MAX = Date.UTC(2100, 0, 1);

/** A bare integer of 10, 13, 16 or 19 digits that lands between 1990 and 2100. */
export function looksLikeEpoch(input: string): boolean {
  const t = input.trim();
  if (!/^\d{10}$|^\d{13}$|^\d{16}$|^\d{19}$/.test(t)) return false;
  const p = parseTime(t);
  return !!p && p.ms >= MIN && p.ms < MAX;
}
