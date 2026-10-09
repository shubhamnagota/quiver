import { decodeBase64, detectDirection, encodeText, guessMime, looksLikeBase64, SAMPLE } from './lib';

describe('base64 lib', () => {
  it('encodes text, optionally url-safe', () => {
    expect(encodeText('hello?>', false)).toBe('aGVsbG8/Pg==');
    expect(encodeText('hello?>', true)).toBe('aGVsbG8_Pg');
  });

  it('decodes text and flags binary', () => {
    const text = decodeBase64(SAMPLE);
    expect(text.kind).toBe('text');
    if (text.kind === 'text') expect(JSON.parse(text.text).currency).toBe('AED');
    expect(decodeBase64('iVBORw0KGgo=').kind).toBe('binary');
  });

  it('detects base64 but not epochs, UUIDs or plain words', () => {
    expect(looksLikeBase64(SAMPLE)).toBe(true);
    expect(looksLikeBase64('aGVsbG8gd29ybGQ')).toBe(true);
    expect(looksLikeBase64('1700000000')).toBe(false);
    expect(looksLikeBase64('3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90')).toBe(false);
    expect(looksLikeBase64('hello world')).toBe(false);
    expect(looksLikeBase64('iVBORw0KGgo=')).toBe(false);
  });

  it('auto-detects direction', () => {
    expect(detectDirection(SAMPLE)).toBe('decode');
    expect(detectDirection('plain text')).toBe('encode');
  });

  it('guesses common file types', () => {
    expect(guessMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe('image/png');
    expect(guessMime(Uint8Array.from([1, 2, 3]))).toBe('application/octet-stream');
  });
});
