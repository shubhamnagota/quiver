/** ISO 4217 minor units where they differ from 2. */
const MINOR_UNITS: Record<string, number> = {
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0, PYG: 0, RWF: 0, UGX: 0, VND: 0, VUV: 0,
  XAF: 0, XOF: 0, XPF: 0,
};

export function minorUnits(code: string): number {
  return MINOR_UNITS[code] ?? 2;
}

let names: Intl.DisplayNames | undefined;
export function currencyName(code: string): string {
  try {
    names ??= new Intl.DisplayNames(['en'], { type: 'currency' });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Shown in pickers before any rates have loaded. */
export const COMMON_CURRENCIES = [
  'AED', 'INR', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'PKR', 'BDT', 'LKR', 'NPR', 'PHP',
  'SGD', 'HKD', 'CNY', 'JPY', 'AUD', 'CAD', 'CHF', 'EGP', 'ZAR', 'TRY',
];

export function roundTo(value: number, code: string): number {
  const f = 10 ** minorUnits(code);
  return Math.round(value * f) / f;
}

export function formatAmount(value: number, code: string): string {
  const digits = minorUnits(code);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

/** Rates get more decimals than money: 1 AED = 22.7461 INR, 1 INR = 0.043964 AED. */
export function formatRate(rate: number): string {
  return rate >= 1
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(rate)
    : new Intl.NumberFormat('en-US', { maximumSignificantDigits: 5 }).format(rate);
}
