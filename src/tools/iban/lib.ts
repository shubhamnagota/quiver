/** IBAN lengths by country (SWIFT IBAN registry). */
export const IBAN_LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29, BY: 28, CH: 21, CR: 22,
  CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22,
  GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30,
  KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31,
  MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SC: 31, SE: 24,
  SI: 19, SK: 24, SM: 27, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};

/** Where the bank (and branch) code sits inside the BBAN, for countries where it is well defined. */
const BBAN_LAYOUT: Record<string, { bank: [number, number]; branch?: [number, number]; branchLabel?: string }> = {
  AE: { bank: [0, 3] },
  AT: { bank: [0, 5] },
  BE: { bank: [0, 3] },
  BH: { bank: [0, 4] },
  CH: { bank: [0, 5] },
  DE: { bank: [0, 8] },
  ES: { bank: [0, 4], branch: [4, 8] },
  FR: { bank: [0, 5], branch: [5, 10] },
  GB: { bank: [0, 4], branch: [4, 10], branchLabel: 'Sort code' },
  IE: { bank: [0, 4], branch: [4, 10], branchLabel: 'Sort code' },
  IT: { bank: [1, 6], branch: [6, 11] },
  KW: { bank: [0, 4] },
  NL: { bank: [0, 4] },
  PT: { bank: [0, 4], branch: [4, 8] },
  QA: { bank: [0, 4] },
  SA: { bank: [0, 2] },
};

export function normalizeIban(input: string): string {
  return input.replace(/^IBAN[:\s]*/i, '').replace(/[\s-]+/g, '').toUpperCase();
}

/** ISO 7064 mod 97-10 over the rearranged IBAN, computed in chunks to avoid big numbers. */
export function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (let i = 0; i < digits.length; i += 7) rem = Number(String(rem) + digits.slice(i, i + 7)) % 97;
  return rem;
}

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

export interface IbanResult {
  iban: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  country: string;
  countryName?: string;
  checkDigits: string;
  bban: string;
  bankCode?: string;
  branchCode?: string;
  branchLabel?: string;
  formatted: string;
}

export function validateIban(input: string): IbanResult {
  const iban = normalizeIban(input);
  const country = iban.slice(0, 2);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
    errors.push('An IBAN is 2 letters, 2 check digits, then letters and digits only');
  }
  const expected = IBAN_LENGTHS[country];
  if (expected === undefined) warnings.push(`${country} is not in the IBAN registry table here; only the checksum was verified`);
  else if (iban.length !== expected) errors.push(`${country} IBANs are ${expected} characters; this one is ${iban.length}`);
  if (iban.length < 15 || iban.length > 34) errors.push('IBANs are 15 to 34 characters long');
  if (errors.length === 0 && mod97(iban) !== 1) errors.push('Check digits do not match (mod-97 check failed)');

  const bban = iban.slice(4);
  const layout = BBAN_LAYOUT[country];
  let countryName: string | undefined;
  try {
    countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(country);
  } catch {
    countryName = undefined;
  }
  return {
    iban,
    valid: errors.length === 0,
    errors,
    warnings,
    country,
    countryName,
    checkDigits: iban.slice(2, 4),
    bban,
    bankCode: layout ? bban.slice(...layout.bank) : undefined,
    branchCode: layout?.branch ? bban.slice(...layout.branch) : undefined,
    branchLabel: layout?.branch ? (layout.branchLabel ?? 'Branch code') : undefined,
    formatted: formatIban(iban),
  };
}

export function looksLikeIban(input: string): boolean {
  const iban = normalizeIban(input);
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban) && IBAN_LENGTHS[iban.slice(0, 2)] === iban.length && mod97(iban) === 1;
}
