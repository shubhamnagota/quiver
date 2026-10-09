import { bestQuote, evaluateQuote } from './lib';

describe('remittance lib', () => {
  const mid = 24.0;

  it('computes received amount, effective rate and markup', () => {
    const r = evaluateQuote(1000, mid, { rate: '23.88', flatFee: '15', pctFee: '' });
    if ('error' in r) throw new Error(r.error);
    expect(r.received).toBeCloseTo(23521.8, 1);
    expect(r.effectiveRate).toBeCloseTo(23.5218, 4);
    expect(r.markupPct).toBeCloseTo(1.9925, 3);
    expect(r.costInSend).toBeCloseTo(19.925, 3);
  });

  it('applies percentage fees', () => {
    const r = evaluateQuote(1000, mid, { rate: '24', flatFee: '0', pctFee: '1' });
    if ('error' in r) throw new Error(r.error);
    expect(r.received).toBe(23760);
    expect(r.markupPct).toBeCloseTo(1, 6);
  });

  it('rejects bad input', () => {
    expect(evaluateQuote(1000, mid, { rate: '', flatFee: '', pctFee: '' })).toHaveProperty('error');
    expect(evaluateQuote(10, mid, { rate: '24', flatFee: '15', pctFee: '' })).toHaveProperty('error');
    expect(evaluateQuote(1000, mid, { rate: '24', flatFee: '-1', pctFee: '' })).toHaveProperty('error');
  });

  it('picks the provider that delivers the most', () => {
    const results = [
      evaluateQuote(1000, mid, { rate: '23.9', flatFee: '10', pctFee: '' }),
      evaluateQuote(1000, mid, { rate: '', flatFee: '', pctFee: '' }),
      evaluateQuote(1000, mid, { rate: '23.95', flatFee: '0', pctFee: '' }),
    ];
    expect(bestQuote(results)).toBe(2);
    expect(bestQuote([])).toBe(-1);
  });
});
