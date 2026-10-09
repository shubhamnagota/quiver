import { base64ToBytes, bytesToBase64, decodeUtf8, isPrintable, utf8 } from '@/lib/encoding';

export type Direction = 'encode' | 'decode';

export function encodeText(text: string, urlSafe: boolean): string {
  return bytesToBase64(utf8(text), urlSafe);
}

export type DecodeResult = { kind: 'text'; text: string; bytes: Uint8Array } | { kind: 'binary'; bytes: Uint8Array };

export function decodeBase64(input: string): DecodeResult {
  const bytes = base64ToBytes(input.trim());
  try {
    const text = decodeUtf8(bytes);
    if (isPrintable(text)) return { kind: 'text', text, bytes };
  } catch {
    // not UTF-8; fall through to binary
  }
  return { kind: 'binary', bytes };
}

/** Base64 that decodes to readable text: the signal for auto-detecting direction and paste-to-open. */
export function looksLikeBase64(input: string): boolean {
  const t = input.trim();
  if (t.length < 8 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(t)) return false;
  if (/^\d+$/.test(t) || /^[0-9a-f-]+$/i.test(t)) return false; // epochs, hex, UUIDs
  try {
    const r = decodeBase64(t);
    return r.kind === 'text' && r.text.trim().length > 0;
  } catch {
    return false;
  }
}

export function detectDirection(input: string): Direction {
  return looksLikeBase64(input) ? 'decode' : 'encode';
}

export function guessMime(bytes: Uint8Array): string {
  const sig = (...b: number[]) => b.every((v, i) => bytes[i] === v);
  if (sig(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (sig(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (sig(0x47, 0x49, 0x46, 0x38)) return 'image/gif';
  if (sig(0x25, 0x50, 0x44, 0x46)) return 'application/pdf';
  if (sig(0x50, 0x4b, 0x03, 0x04)) return 'application/zip';
  return 'application/octet-stream';
}

export const SAMPLE = 'eyJ0eG5JZCI6InR4bl84ODIxIiwiYW1vdW50IjoiMjUwMC4wMCIsImN1cnJlbmN5IjoiQUVEIn0=';
