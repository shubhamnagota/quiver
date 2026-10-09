import { decodeJwt, JWT_RE, SAMPLE, signHmac, tokenStatus, verifyHmac } from './lib';

describe('jwt lib', () => {
  it('decodes header and payload', () => {
    const t = decodeJwt(SAMPLE);
    expect(t.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(t.payload.name).toBe('John Doe');
    expect(JWT_RE.test(SAMPLE)).toBe(true);
  });

  it('explains malformed tokens', () => {
    expect(() => decodeJwt('a.b')).toThrow(/3 parts/);
    expect(() => decodeJwt('eyJhbGciOiJIUzI1NiJ9.bm90IGpzb24.x')).toThrow(/payload/);
  });

  it('verifies HS256 signatures', async () => {
    const t = decodeJwt(SAMPLE);
    expect(await verifyHmac(t, 'your-256-bit-secret')).toBe(true);
    expect(await verifyHmac(t, 'wrong')).toBe(false);
  });

  it('signs HS512 and refuses non-HMAC algorithms', async () => {
    const sig = await signHmac('a.b', 'k', 'HS512');
    expect(sig).toMatch(/^[\w-]{86}$/);
    const rs = decodeJwt('eyJhbGciOiJSUzI1NiJ9.e30.x');
    await expect(verifyHmac(rs, 'k')).rejects.toThrow(/RS256/);
  });

  it('computes status from exp and nbf', () => {
    const now = 1_700_000_000_000;
    expect(tokenStatus({ exp: 1_699_999_999 }, now).state).toBe('expired');
    expect(tokenStatus({ exp: 1_700_000_100 }, now).state).toBe('valid');
    expect(tokenStatus({ nbf: 1_700_000_100 }, now).state).toBe('not-yet-valid');
    expect(tokenStatus({}, now).state).toBe('no-expiry');
  });
});
