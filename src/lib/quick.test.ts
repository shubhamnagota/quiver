import { useFx } from './fx/store';
import { quickAnswers } from './quick';

describe('quickAnswers', () => {
  it('answers epochs with the Dubai time and copies ISO', () => {
    const [a] = quickAnswers('1700000000');
    expect(a?.title).toContain('02:13:20');
    expect(a?.copy()).toBe('2023-11-14T22:13:20.000Z');
  });

  it('offers a fresh UUID', () => {
    const [a] = quickAnswers(' UUID ');
    expect(a?.copy()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('converts currencies with cached rates', () => {
    useFx.setState({ snapshot: { base: 'USD', rates: { USD: 1, AED: 3.6725, INR: 88.2 }, fetchedAt: 0, asOf: 0, provider: 'er-api' } });
    expect(quickAnswers('100 aed inr')[0]?.title).toBe('100.00 AED = 2,401.63 INR');
    expect(quickAnswers('2500*12 AED to INR')[0]?.copy()).toBe('720490.13');
    expect(quickAnswers('usd in aed')[0]?.title).toBe('1.00 USD = 3.67 AED');
    expect(quickAnswers('100 aed xyz')).toEqual([]);
    useFx.setState({ snapshot: null });
    expect(quickAnswers('100 aed inr')).toEqual([]);
  });

  it('stays quiet otherwise', () => {
    expect(quickAnswers('json')).toEqual([]);
  });
});
