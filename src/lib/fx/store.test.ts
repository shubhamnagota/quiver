import * as rates from './rates';
import { useFx } from './store';

const snap = (fetchedAt: number): rates.RatesSnapshot => ({ base: 'USD', rates: { USD: 1, INR: 88 }, fetchedAt, asOf: fetchedAt, provider: 'er-api' });

describe('fx store', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads rates and records errors without dropping cached ones', async () => {
    vi.spyOn(rates, 'readCache').mockReturnValue(snap(0));
    vi.spyOn(rates, 'refreshRates').mockResolvedValue({ snapshot: null, error: 'offline' });
    useFx.setState({ snapshot: null, loading: false, error: undefined });
    await useFx.getState().load();
    expect(useFx.getState()).toMatchObject({ loading: false, error: 'offline', snapshot: { fetchedAt: 0 } });
  });

  it('ignores a second load while one is running', async () => {
    const refresh = vi.spyOn(rates, 'refreshRates').mockResolvedValue({ snapshot: snap(Date.now()) });
    useFx.setState({ loading: true });
    await useFx.getState().load();
    expect(refresh).not.toHaveBeenCalled();
    useFx.setState({ loading: false });
  });
});
