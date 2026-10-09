import { base64ToBytes, bytesToBase64, bytesToHex, utf8 } from '@/lib/encoding';
import { md5 } from './md5';

export const ALGORITHMS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
export type Algorithm = (typeof ALGORITHMS)[number];
export const HMAC_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;
export type HmacAlgorithm = (typeof HMAC_ALGORITHMS)[number];
export type OutputFormat = 'hex' | 'base64';

export async function digest(alg: Algorithm, data: Uint8Array): Promise<Uint8Array> {
  if (alg === 'MD5') return md5(data);
  return new Uint8Array(await crypto.subtle.digest(alg, data as BufferSource));
}

export async function hmac(alg: HmacAlgorithm, key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: alg }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data as BufferSource));
}

export function format(bytes: Uint8Array, as: OutputFormat): string {
  return as === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
}

export async function hashText(alg: Algorithm, text: string, as: OutputFormat = 'hex') {
  return format(await digest(alg, utf8(text)), as);
}

/** Parses a provided webhook signature: "sha256=<hex>", hex or base64. */
export function parseSignature(sig: string): Uint8Array | null {
  const t = sig.trim().replace(/^(?:sha(?:1|256|384|512)|v1)=/i, '');
  if (/^(?:[0-9a-f]{2})+$/i.test(t)) return Uint8Array.from(t.match(/../g)!, (h) => parseInt(h, 16));
  try {
    return base64ToBytes(t);
  } catch {
    return null;
  }
}

/** Constant-time comparison so the check itself doesn't leak timing. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function verifyWebhook(alg: HmacAlgorithm, secret: string, body: string, signature: string) {
  const expected = parseSignature(signature);
  if (!expected) return false;
  return timingSafeEqual(await hmac(alg, utf8(secret), utf8(body)), expected);
}
