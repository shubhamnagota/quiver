import { utf8 } from '@/lib/encoding';
import { format, hashText, hmac, parseSignature, verifyWebhook } from './lib';

const FOX = 'The quick brown fox jumps over the lazy dog';

describe('hash lib', () => {
  it('computes MD5 test vectors', async () => {
    expect(await hashText('MD5', '')).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(await hashText('MD5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(await hashText('MD5', FOX)).toBe('9e107d9d372bb6826bd81d3542a419d6');
    expect(await hashText('MD5', 'a'.repeat(1000))).toBe('cabe45dcc9ae5b66ba86600cca6b8ba8');
  });

  it('computes SHA digests', async () => {
    expect(await hashText('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(await hashText('SHA-256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await hashText('SHA-256', 'abc', 'base64')).toBe('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  });

  it('computes HMAC', async () => {
    const mac = await hmac('SHA-256', utf8('key'), utf8(FOX));
    expect(format(mac, 'hex')).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });

  it('verifies webhook signatures in hex, prefixed and base64 forms', async () => {
    const hex = 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8';
    expect(await verifyWebhook('SHA-256', 'key', FOX, hex)).toBe(true);
    expect(await verifyWebhook('SHA-256', 'key', FOX, `sha256=${hex}`)).toBe(true);
    expect(await verifyWebhook('SHA-256', 'key', FOX, '97yD9DBThCSxMpjmqm+xQ+9NWaFJRhdZl0edvC0aPNg=')).toBe(true);
    expect(await verifyWebhook('SHA-256', 'nope', FOX, hex)).toBe(false);
    expect(await verifyWebhook('SHA-256', 'key', FOX, 'zz!')).toBe(false);
  });

  it('parses signature formats', () => {
    expect(parseSignature('sha1=00ff')).toEqual(Uint8Array.from([0, 255]));
    expect(parseSignature('!!')).toBeNull();
  });
});
