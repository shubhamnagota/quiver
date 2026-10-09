import { base64ToBytes, bytesToBase64, bytesToHex, decodeUtf8, hexToBytes, isPrintable, utf8 } from './encoding';

describe('encoding helpers', () => {
  it('round-trips base64, including unicode and url-safe', () => {
    const bytes = utf8('Ünïcødé ✓ ₹ د.إ');
    expect(decodeUtf8(base64ToBytes(bytesToBase64(bytes)))).toBe('Ünïcødé ✓ ₹ د.إ');
    const urlSafe = bytesToBase64(Uint8Array.from([251, 255, 254]), true);
    expect(urlSafe).toBe('-__-');
    expect(Array.from(base64ToBytes(urlSafe))).toEqual([251, 255, 254]);
  });

  it('accepts unpadded input and rejects garbage', () => {
    expect(decodeUtf8(base64ToBytes('aGk'))).toBe('hi');
    expect(() => base64ToBytes('a')).toThrow();
    expect(() => base64ToBytes('not base64!')).toThrow();
  });

  it('converts hex', () => {
    expect(bytesToHex(Uint8Array.from([0, 15, 255]))).toBe('000fff');
    expect(Array.from(hexToBytes('000fff'))).toEqual([0, 15, 255]);
    expect(() => hexToBytes('abc')).toThrow();
  });

  it('flags control characters', () => {
    expect(isPrintable('hello\nworld\t!')).toBe(true);
    expect(isPrintable('a\u0001b')).toBe(false);
  });
});
