import { currencyName, formatAmount, formatRate, minorUnits, roundTo } from './currencies';

describe('currencies', () => {
  it('knows minor units', () => {
    expect(minorUnits('INR')).toBe(2);
    expect(minorUnits('KWD')).toBe(3);
    expect(minorUnits('JPY')).toBe(0);
  });

  it('rounds and formats to minor units', () => {
    expect(roundTo(1.23456, 'BHD')).toBe(1.235);
    expect(formatAmount(1234.5, 'INR')).toBe('1,234.50');
    expect(formatAmount(1234.5, 'JPY')).toBe('1,235');
  });

  it('formats rates with enough precision', () => {
    expect(formatRate(24.01634)).toBe('24.0163');
    expect(formatRate(0.0416383)).toBe('0.041638');
  });

  it('names currencies', () => {
    expect(currencyName('AED')).toMatch(/Emirates/);
  });
});
