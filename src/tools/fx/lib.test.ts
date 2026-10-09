import type { RatesSnapshot } from '@/lib/fx/rates';
import { convertAll, parseAmount } from './lib';

const snapshot: RatesSnapshot = { base: 'USD', rates: { USD: 1, AED: 3.6725, INR: 88.2 }, fetchedAt: 0, asOf: 0, provider: 'er-api' };

describe('fx tool lib', () => {
  it('evaluates math in the amount field', () => {
    expect(parseAmount('2500*12')).toEqual({ ok: true, value: 30000, isExpression: true });
    expect(parseAmount('1,500')).toEqual({ ok: true, value: 1500, isExpression: false });
    expect(parseAmount('12 +')).toMatchObject({ ok: false });
    expect(parseAmount('  ')).toBeNull();
  });

  it('keeps other rows working when one code is unknown', () => {
    const rows = convertAll(100, 'AED', ['INR', 'XYZ', 'USD'], snapshot);
    expect(rows[0]!.value).toBeCloseTo(2401.63, 2);
    expect(rows[1]!.error).toMatch(/XYZ/);
    expect(rows[2]!.value).toBeCloseTo(27.23, 2);
  });
});
