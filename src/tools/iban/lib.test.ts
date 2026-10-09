import { formatIban, looksLikeIban, mod97, validateIban } from './lib';

describe('iban lib', () => {
  it('validates real-format IBANs from several countries', () => {
    for (const iban of ['GB82 WEST 1234 5698 7654 32', 'DE89370400440532013000', 'AE070331234567890123456', 'SA0380000000608010167519', 'FR1420041010050500013M02606', 'NL91ABNA0417164300']) {
      expect(validateIban(iban).valid).toBe(true);
    }
  });

  it('extracts bank and branch codes', () => {
    const gb = validateIban('GB82WEST12345698765432');
    expect(gb).toMatchObject({ country: 'GB', countryName: 'United Kingdom', bankCode: 'WEST', branchCode: '123456', branchLabel: 'Sort code' });
    expect(validateIban('AE070331234567890123456').bankCode).toBe('033');
  });

  it('explains failures', () => {
    expect(validateIban('GB83WEST12345698765432').errors[0]).toMatch(/mod-97/);
    expect(validateIban('GB82WEST1234569876543').errors[0]).toMatch(/22 characters/);
    expect(validateIban('12345').valid).toBe(false);
  });

  it('warns on countries outside the table but still checks the checksum', () => {
    const r = validateIban('ZZ68539007547034');
    expect(r.warnings).toHaveLength(1);
  });

  it('formats in groups of four and computes mod 97', () => {
    expect(formatIban('DE89370400440532013000')).toBe('DE89 3704 0044 0532 0130 00');
    expect(mod97('DE89370400440532013000')).toBe(1);
  });

  it('detects IBANs for paste-to-open', () => {
    expect(looksLikeIban('iban: de89 3704 0044 0532 0130 00')).toBe(true);
    expect(looksLikeIban('DE00370400440532013000')).toBe(false);
  });
});
