export interface RatesSnapshot {
  base: 'USD';
  /** Units of each currency per 1 USD. */
  rates: Record<string, number>;
  /** When this browser fetched the rates. */
  fetchedAt: number;
  /** When the provider last updated them (not the device clock). */
  asOf: number;
  provider: ProviderId;
}

export type ProviderId = 'er-api' | 'frankfurter';

/** AED is pegged to USD; Frankfurter (ECB data) doesn't publish it. */
export const AED_PER_USD = 3.6725;

interface Provider {
  id: ProviderId;
  name: string;
  url: string;
  site: string;
  parse: (json: unknown) => Omit<RatesSnapshot, 'fetchedAt' | 'provider'>;
}

const isRates = (v: unknown): v is Record<string, number> =>
  !!v && typeof v === 'object' && Object.values(v).every((n) => typeof n === 'number' && n > 0);

export const PROVIDERS: Provider[] = [
  {
    id: 'er-api',
    name: 'ExchangeRate-API',
    url: 'https://open.er-api.com/v6/latest/USD',
    site: 'https://www.exchangerate-api.com',
    parse: (json) => {
      const j = json as { result?: string; base_code?: string; rates?: unknown; time_last_update_unix?: number };
      if (j.result !== 'success' || j.base_code !== 'USD' || !isRates(j.rates)) throw new Error('Unexpected response');
      return { base: 'USD', rates: j.rates, asOf: (j.time_last_update_unix ?? 0) * 1000 };
    },
  },
  {
    id: 'frankfurter',
    name: 'Frankfurter (ECB)',
    url: 'https://api.frankfurter.dev/v1/latest?base=USD',
    site: 'https://frankfurter.dev',
    parse: (json) => {
      const j = json as { base?: string; date?: string; rates?: unknown };
      if (j.base !== 'USD' || !isRates(j.rates) || !j.date) throw new Error('Unexpected response');
      return { base: 'USD', rates: { AED: AED_PER_USD, ...j.rates, USD: 1 }, asOf: Date.parse(`${j.date}T15:00:00Z`) };
    },
  },
];

export const providerById = (id: ProviderId) => PROVIDERS.find((p) => p.id === id)!;

export const FRESH_FOR = 6 * 3600 * 1000;
export const MIN_FETCH_INTERVAL = 3600 * 1000;
const CACHE_KEY = 'quiver-fx';
const ATTEMPT_KEY = 'quiver-fx-attempt';

type Fetch = (url: string) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface RatesEnv {
  fetch: Fetch;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  now: () => number;
}

const browserEnv = (): RatesEnv => ({ fetch: (url) => fetch(url), storage: localStorage, now: Date.now });

export function readCache(env: Pick<RatesEnv, 'storage'> = browserEnv()): RatesSnapshot | null {
  try {
    const s = JSON.parse(env.storage.getItem(CACHE_KEY) ?? 'null') as RatesSnapshot | null;
    return s && isRates(s.rates) ? s : null;
  } catch {
    return null;
  }
}

/** Tries each provider in order and returns the first good snapshot. */
export async function fetchRates(env: RatesEnv): Promise<RatesSnapshot> {
  const failures: string[] = [];
  for (const p of PROVIDERS) {
    try {
      const res = await env.fetch(p.url);
      if (!res.ok) throw new Error(res.status === 429 ? 'rate limited (429)' : `HTTP ${res.status}`);
      return { ...p.parse(await res.json()), fetchedAt: env.now(), provider: p.id };
    } catch (e) {
      failures.push(`${p.name}: ${(e as Error).message}`);
    }
  }
  throw new Error(`Couldn't fetch rates. ${failures.join('; ')}`);
}

export const isFresh = (s: RatesSnapshot, now: number) => now - s.fetchedAt < FRESH_FOR;

/**
 * Returns rates, fetching only when the cache is older than 6 hours and no
 * fetch was attempted in the last hour. Falls back to the cache on failure.
 */
export async function refreshRates(env: RatesEnv = browserEnv()): Promise<{ snapshot: RatesSnapshot | null; error?: string }> {
  const cached = readCache(env);
  const now = env.now();
  if (cached && isFresh(cached, now)) return { snapshot: cached };
  const lastAttempt = Number(env.storage.getItem(ATTEMPT_KEY) ?? 0);
  if (now - lastAttempt < MIN_FETCH_INTERVAL) {
    return { snapshot: cached, error: cached ? undefined : 'Rates were requested recently; try again within the hour' };
  }
  env.storage.setItem(ATTEMPT_KEY, String(now));
  try {
    const snapshot = await fetchRates(env);
    env.storage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    return { snapshot };
  } catch (e) {
    return { snapshot: cached, error: (e as Error).message };
  }
}

export function convert(amount: number, from: string, to: string, snapshot: RatesSnapshot): number {
  const f = snapshot.rates[from];
  const t = snapshot.rates[to];
  if (!f) throw new Error(`No rate for ${from}`);
  if (!t) throw new Error(`No rate for ${to}`);
  return (amount * t) / f;
}

export const rateFor = (from: string, to: string, snapshot: RatesSnapshot) => convert(1, from, to, snapshot);
