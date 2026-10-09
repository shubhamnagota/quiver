import { AED_PER_USD, convert, FRESH_FOR, MIN_FETCH_INTERVAL, refreshRates, type RatesEnv, type RatesSnapshot } from './rates';

const erApi = { result: 'success', base_code: 'USD', time_last_update_unix: 1_760_000_000, rates: { USD: 1, AED: 3.6725, INR: 88.2, EUR: 0.86 } };
const frankfurter = { amount: 1, base: 'USD', date: '2026-10-08', rates: { INR: 88.1, EUR: 0.861 } };

function env(responses: Record<string, () => { ok: boolean; status: number; body?: unknown }>, start = 1_760_000_000_000) {
  const store = new Map<string, string>();
  const calls: string[] = [];
  let now = start;
  const e: RatesEnv & { calls: string[]; advance: (ms: number) => void; store: Map<string, string> } = {
    calls,
    store,
    advance: (ms) => (now += ms),
    now: () => now,
    storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) },
    fetch: async (url) => {
      calls.push(url);
      const key = Object.keys(responses).find((k) => url.includes(k));
      if (!key) throw new TypeError('Failed to fetch');
      const r = responses[key]!();
      return { ok: r.ok, status: r.status, json: async () => r.body };
    },
  };
  return e;
}

describe('fx rates', () => {
  it('uses the first provider and caches the result', async () => {
    const e = env({ 'er-api': () => ({ ok: true, status: 200, body: erApi }) });
    const { snapshot } = await refreshRates(e);
    expect(snapshot?.provider).toBe('er-api');
    expect(snapshot?.asOf).toBe(1_760_000_000_000);
    expect(e.calls).toHaveLength(1);

    e.advance(FRESH_FOR - 1);
    await refreshRates(e);
    expect(e.calls).toHaveLength(1);
  });

  it('falls back to Frankfurter on 429 and derives AED from the USD peg', async () => {
    const e = env({
      'er-api': () => ({ ok: false, status: 429 }),
      frankfurter: () => ({ ok: true, status: 200, body: frankfurter }),
    });
    const { snapshot } = await refreshRates(e);
    expect(snapshot?.provider).toBe('frankfurter');
    expect(snapshot?.rates.AED).toBe(AED_PER_USD);
    expect(snapshot?.rates.USD).toBe(1);
  });

  it('serves the stale cache offline and reports why', async () => {
    let online = true;
    const e = env({ 'er-api': () => (online ? { ok: true, status: 200, body: erApi } : { ok: false, status: 503 }) });
    await refreshRates(e);
    online = false;
    e.advance(FRESH_FOR + 1);
    const r = await refreshRates(e);
    expect(r.snapshot?.rates.INR).toBe(88.2);
    expect(r.error).toMatch(/Couldn't fetch rates/);
  });

  it('never fetches more than once per hour', async () => {
    const e = env({});
    expect((await refreshRates(e)).error).toMatch(/Couldn't fetch/);
    const before = e.calls.length;
    e.advance(MIN_FETCH_INTERVAL - 1);
    await refreshRates(e);
    expect(e.calls.length).toBe(before);
    e.advance(2);
    await refreshRates(e);
    expect(e.calls.length).toBeGreaterThan(before);
  });

  it('rejects malformed provider responses', async () => {
    const e = env({ 'er-api': () => ({ ok: true, status: 200, body: { result: 'error' } }) });
    expect((await refreshRates(e)).snapshot).toBeNull();
  });

  it('converts through USD', () => {
    const s: RatesSnapshot = { base: 'USD', rates: erApi.rates, fetchedAt: 0, asOf: 0, provider: 'er-api' };
    expect(convert(100, 'AED', 'INR', s)).toBeCloseTo(2401.63, 2);
    expect(() => convert(1, 'XYZ', 'INR', s)).toThrow(/XYZ/);
  });
});
