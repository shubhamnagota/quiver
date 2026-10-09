import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

export type Chain = 'evm' | 'tron' | 'bitcoin';

export interface AddressCheck {
  valid: boolean;
  chain?: Chain;
  /** Address format, e.g. "SegWit (bech32)". */
  kind?: string;
  /** Problem when invalid, or a caveat when valid (e.g. no checksum). */
  note?: string;
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Decode(s: string): Uint8Array | null {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) return null;
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n % 256n));
    n /= 256n;
  }
  for (const c of s) {
    if (c !== '1') break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}

/** Payload of a Base58Check string, or null if the 4-byte double-SHA256 checksum fails. */
function base58Check(s: string): Uint8Array | null {
  const raw = base58Decode(s);
  if (!raw || raw.length < 5) return null;
  const payload = raw.slice(0, -4);
  const check = sha256(sha256(payload)).slice(0, 4);
  return check.every((b, i) => b === raw[raw.length - 4 + i]) ? payload : null;
}

export function toChecksumAddress(address: string): string {
  const lower = address.toLowerCase().replace(/^0x/, '');
  const hash = keccak_256(new TextEncoder().encode(lower));
  let out = '0x';
  for (let i = 0; i < 40; i++) {
    const nibble = (hash[i >> 1]! >> (i % 2 ? 0 : 4)) & 0xf;
    out += nibble >= 8 ? lower[i]!.toUpperCase() : lower[i];
  }
  return out;
}

function checkEvm(a: string): AddressCheck {
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) return { valid: false, chain: 'evm', note: 'EVM addresses are 0x followed by 40 hex characters' };
  const body = a.slice(2);
  if (body === body.toLowerCase() || body === body.toUpperCase()) {
    return { valid: true, chain: 'evm', kind: 'EVM', note: 'No checksum (single-case); typos cannot be detected' };
  }
  return toChecksumAddress(a) === a
    ? { valid: true, chain: 'evm', kind: 'EVM (EIP-55 checksum)' }
    : { valid: false, chain: 'evm', note: 'EIP-55 checksum does not match; check for a typo' };
}

function checkTron(a: string): AddressCheck {
  const payload = base58Check(a);
  if (!payload) return { valid: false, chain: 'tron', note: 'Base58Check checksum does not match' };
  if (payload.length !== 21 || payload[0] !== 0x41) return { valid: false, chain: 'tron', note: 'Not a TRON account address' };
  return { valid: true, chain: 'tron', kind: 'TRON (Base58Check)' };
}

const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= G[i]!;
  }
  return chk >>> 0;
}

function convertBits(data: number[], from: number, to: number): number[] | null {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  for (const v of data) {
    acc = (acc << from) | v;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >> bits) & ((1 << to) - 1));
    }
  }
  if (bits >= from || (acc << (to - bits)) & ((1 << to) - 1)) return null;
  return out;
}

function checkSegwit(a: string): AddressCheck {
  if (a !== a.toLowerCase() && a !== a.toUpperCase()) return { valid: false, chain: 'bitcoin', note: 'Mixed case is not allowed in bech32' };
  const s = a.toLowerCase();
  const sep = s.lastIndexOf('1');
  const hrp = s.slice(0, sep);
  const data = [...s.slice(sep + 1)].map((c) => BECH32.indexOf(c));
  if (hrp !== 'bc' || data.length < 6 || data.some((d) => d < 0)) return { valid: false, chain: 'bitcoin', note: 'Not a valid bech32 address' };
  const expanded = [...[...hrp].map((c) => c.charCodeAt(0) >> 5), 0, ...[...hrp].map((c) => c.charCodeAt(0) & 31), ...data];
  const constant = bech32Polymod(expanded);
  const version = data[0]!;
  const program = convertBits(data.slice(1, -6), 5, 8);
  const expected = version === 0 ? 1 : 0x2bc830a3;
  if (constant !== expected) return { valid: false, chain: 'bitcoin', note: 'Bech32 checksum does not match' };
  if (!program || program.length < 2 || program.length > 40 || version > 16 || (version === 0 && program.length !== 20 && program.length !== 32)) {
    return { valid: false, chain: 'bitcoin', note: 'Invalid witness program' };
  }
  return { valid: true, chain: 'bitcoin', kind: version === 0 ? 'Bitcoin SegWit (bech32)' : version === 1 ? 'Bitcoin Taproot (bech32m)' : `Bitcoin witness v${version}` };
}

function checkBase58Btc(a: string): AddressCheck {
  const payload = base58Check(a);
  if (!payload || payload.length !== 21) return { valid: false, chain: 'bitcoin', note: 'Base58Check checksum does not match' };
  if (payload[0] === 0x00) return { valid: true, chain: 'bitcoin', kind: 'Bitcoin legacy (P2PKH)' };
  if (payload[0] === 0x05) return { valid: true, chain: 'bitcoin', kind: 'Bitcoin script (P2SH)' };
  return { valid: false, chain: 'bitcoin', note: 'Not a Bitcoin mainnet address' };
}

/** Detects the chain from the address shape and validates its checksum. Mainnet only. */
export function checkAddress(input: string): AddressCheck {
  const a = input.trim();
  if (/^0x/i.test(a)) return checkEvm(a);
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a)) return checkTron(a);
  if (/^bc1/i.test(a)) return checkSegwit(a);
  if (/^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(a)) return checkBase58Btc(a);
  return { valid: false, note: 'Not a recognised EVM, TRON or Bitcoin address' };
}
