import { base64ToBytes, bytesToBase64, decodeUtf8, utf8 } from '@/lib/encoding';

export const JWT_RE = /^eyJ[\w-]+\.[\w-]+\.[\w-]*$/;

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  signingInput: string;
}

function decodePart(part: string, name: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(decodeUtf8(base64ToBytes(part)));
  } catch {
    throw new Error(`The ${name} is not valid base64url-encoded JSON`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`The ${name} is not a JSON object`);
  return value as Record<string, unknown>;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error(`A JWT has 3 parts separated by dots; this has ${parts.length}`);
  const [h, p, s] = parts as [string, string, string];
  return { header: decodePart(h, 'header'), payload: decodePart(p, 'payload'), signature: s, signingInput: `${h}.${p}` };
}

export const TIME_CLAIMS = ['exp', 'iat', 'nbf', 'auth_time'] as const;

export type Status = { state: 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry'; expiresAt?: number };

export function tokenStatus(payload: Record<string, unknown>, now = Date.now()): Status {
  const exp = typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
  const nbf = typeof payload.nbf === 'number' ? payload.nbf * 1000 : undefined;
  if (nbf !== undefined && now < nbf) return { state: 'not-yet-valid', expiresAt: exp };
  if (exp === undefined) return { state: 'no-expiry' };
  return { state: now >= exp ? 'expired' : 'valid', expiresAt: exp };
}

const HMAC_ALGS = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' } as const;
export type HmacAlg = keyof typeof HMAC_ALGS;

export const isHmacAlg = (alg: unknown): alg is HmacAlg => typeof alg === 'string' && alg in HMAC_ALGS;

export async function signHmac(signingInput: string, secret: string, alg: HmacAlg): Promise<string> {
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: HMAC_ALGS[alg] }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, utf8(signingInput));
  return bytesToBase64(new Uint8Array(sig), true);
}

export async function verifyHmac(token: DecodedJwt, secret: string): Promise<boolean> {
  const alg = token.header.alg;
  if (!isHmacAlg(alg)) throw new Error(`Only HS256, HS384 and HS512 can be verified here (token uses ${String(alg)})`);
  return (await signHmac(token.signingInput, secret, alg)) === token.signature;
}

export const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
