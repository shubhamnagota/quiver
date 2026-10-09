export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export type ParseResult = { ok: true; value: Json } | { ok: false; error: ParseError };

function lineColumn(text: string, position: number) {
  const before = text.slice(0, position);
  const line = before.split('\n').length;
  const column = position - before.lastIndexOf('\n');
  return { line, column };
}

export function parseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) as Json };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const lc = /line (\d+) column (\d+)/.exec(raw);
    const pos = /position (\d+)/.exec(raw);
    const where = lc
      ? { line: Number(lc[1]), column: Number(lc[2]) }
      : pos
        ? lineColumn(text, Number(pos[1]))
        : lineColumn(text, text.length);
    const message = raw.replace(/^JSON\.parse: /, '').replace(/ in JSON at position \d+.*$/, '');
    return { ok: false, error: { message, ...where } };
  }
}

export type Indent = '2' | '4' | 'tab';

export function formatJson(value: Json, indent: Indent): string {
  return JSON.stringify(value, null, indent === 'tab' ? '\t' : Number(indent));
}

export function minifyJson(value: Json): string {
  return JSON.stringify(value);
}

/** Looks like a JSON object or array, for paste-to-open. */
export function looksLikeJson(text: string): boolean {
  const t = text.trim();
  if (!/^[[{]/.test(t) || !/[\]}]$/.test(t)) return false;
  return parseJson(t).ok;
}

type Segment = { kind: 'key'; key: string } | { kind: 'index'; index: number } | { kind: 'wildcard' } | { kind: 'descend'; key: string | '*' };

export function parsePath(path: string): Segment[] {
  const p = path.trim();
  if (!p.startsWith('$')) throw new Error('Path must start with $');
  const segments: Segment[] = [];
  let i = 1;
  const ident = /^[A-Za-z_$][\w$-]*/;
  while (i < p.length) {
    const rest = p.slice(i);
    if (rest.startsWith('..')) {
      const m = /^\.\.(\*|[A-Za-z_$][\w$-]*)/.exec(rest);
      if (!m) throw new Error(`Expected a key after .. at ${i}`);
      segments.push({ kind: 'descend', key: m[1]! });
      i += m[0].length;
    } else if (rest.startsWith('.*')) {
      segments.push({ kind: 'wildcard' });
      i += 2;
    } else if (rest.startsWith('.')) {
      const m = ident.exec(rest.slice(1));
      if (!m) throw new Error(`Expected a key after . at ${i}`);
      segments.push({ kind: 'key', key: m[0] });
      i += 1 + m[0].length;
    } else if (rest.startsWith('[')) {
      const m = /^\[\s*(?:(\*)|(-?\d+)|'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*\]/.exec(rest);
      if (!m) throw new Error(`Invalid bracket at ${i}`);
      if (m[1]) segments.push({ kind: 'wildcard' });
      else if (m[2] !== undefined) segments.push({ kind: 'index', index: Number(m[2]) });
      else segments.push({ kind: 'key', key: (m[3] ?? m[4] ?? '').replace(/\\(.)/g, '$1') });
      i += m[0].length;
    } else {
      throw new Error(`Unexpected "${rest[0]}" at ${i}`);
    }
  }
  return segments;
}

function children(value: Json): Json[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function descend(value: Json, key: string | '*', out: Json[]) {
  if (value && typeof value === 'object') {
    if (key === '*') out.push(...children(value));
    else if (!Array.isArray(value) && key in value) out.push(value[key]!);
    for (const child of children(value)) descend(child, key, out);
  }
}

/** A practical JSONPath subset: $, .key, ['key'], [n], [-n], [*], .*, ..key, ..* */
export function queryJson(root: Json, path: string): Json[] {
  let current: Json[] = [root];
  for (const seg of parsePath(path)) {
    const next: Json[] = [];
    for (const value of current) {
      if (seg.kind === 'key') {
        if (value && typeof value === 'object' && !Array.isArray(value) && seg.key in value) next.push(value[seg.key]!);
      } else if (seg.kind === 'index') {
        if (Array.isArray(value)) {
          const item = value[seg.index < 0 ? value.length + seg.index : seg.index];
          if (item !== undefined) next.push(item);
        }
      } else if (seg.kind === 'wildcard') {
        next.push(...children(value));
      } else {
        descend(value, seg.key, next);
      }
    }
    current = next;
  }
  return current;
}

export const SAMPLE = `{"payment":{"id":"pay_9f2a","amount":{"value":2500,"currency":"AED"},"status":"settled","tags":["remittance","uae-in"],"beneficiary":{"name":"A. Kumar","iban":"AE070331234567890123456"}},"fees":[{"type":"flat","value":15},{"type":"fx_markup","value":0.4}]}`;
