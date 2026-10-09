import { buildEmvQr, crc16, looksLikeEmvQr, parseEmvQr, parseTlv, SPEC_SAMPLE, validateQrInput, type QrInput } from './lib';

const input: QrInput = {
  dynamic: false,
  accountTag: '26',
  guid: 'ae.example.pay',
  account: '1234567890',
  mcc: '5411',
  currency: '784',
  amount: '25.50',
  country: 'AE',
  name: 'Corner Grocery',
  city: 'Dubai',
  billNumber: 'INV-1001',
  reference: '',
};

describe('emv qr lib', () => {
  it('computes CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('validates the CRC of the EMVCo specification sample', () => {
    const r = parseEmvQr(SPEC_SAMPLE);
    expect(r.crc).toEqual({ expected: 'A13A', actual: 'A13A', valid: true });
  });

  it('parses nested templates and multi-byte values', () => {
    const r = parseEmvQr(SPEC_SAMPLE);
    const lang = r.fields.find((f) => f.id === '64');
    expect(lang?.children?.find((c) => c.id === '01')?.value).toBe('最佳运输');
    const additional = r.fields.find((f) => f.id === '62');
    expect(additional?.children?.map((c) => c.name)).toEqual(['Store label', 'Customer label', 'Terminal label', 'Additional consumer data request']);
    expect(r.fields.find((f) => f.id === '59')?.value).toBe('BEST TRANSPORT');
  });

  it('flags a tampered payload', () => {
    const tampered = SPEC_SAMPLE.replace('23.72', '93.72');
    expect(parseEmvQr(tampered).crc.valid).toBe(false);
  });

  it('reports malformed TLV', () => {
    expect(() => parseTlv('0002')).toThrow(/ends early/);
    expect(() => parseTlv('0x0201')).toThrow(/Malformed/);
  });

  it('builds a payload that round-trips with a valid CRC', () => {
    const qr = buildEmvQr(input);
    const r = parseEmvQr(qr);
    expect(r.crc.valid).toBe(true);
    expect(r.fields.find((f) => f.id === '54')?.value).toBe('25.50');
    expect(r.fields.find((f) => f.id === '26')?.children?.[0]?.value).toBe('ae.example.pay');
    expect(looksLikeEmvQr(qr)).toBe(true);
  });

  it('validates generator input', () => {
    expect(validateQrInput(input)).toEqual([]);
    expect(validateQrInput({ ...input, mcc: '54', country: 'ae', name: '' })).toHaveLength(3);
  });

  it('detects EMV payloads only', () => {
    expect(looksLikeEmvQr(SPEC_SAMPLE)).toBe(true);
    expect(looksLikeEmvQr('000201 hello')).toBe(false);
  });
});
