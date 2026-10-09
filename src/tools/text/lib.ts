/** Splits "someText", "some_text", "Some-Text here" into lowercase words. */
export function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export const CASES = {
  upper: { label: 'UPPER', fn: (t: string) => t.toUpperCase() },
  lower: { label: 'lower', fn: (t: string) => t.toLowerCase() },
  title: { label: 'Title Case', fn: (t: string) => t.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) },
  sentence: {
    label: 'Sentence case',
    fn: (t: string) => t.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase()),
  },
  camel: { label: 'camelCase', fn: (t: string) => words(t).map((w, i) => (i ? cap(w) : w)).join('') },
  pascal: { label: 'PascalCase', fn: (t: string) => words(t).map(cap).join('') },
  snake: { label: 'snake_case', fn: (t: string) => words(t).join('_') },
  constant: { label: 'CONSTANT_CASE', fn: (t: string) => words(t).join('_').toUpperCase() },
  kebab: { label: 'kebab-case', fn: (t: string) => words(t).join('-') },
} as const;

export type CaseName = keyof typeof CASES;

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const lines = (t: string) => t.split(/\r?\n/);

export const LINE_OPS = {
  trim: { label: 'Trim lines', fn: (t: string) => lines(t).map((l) => l.trim()).join('\n') },
  dedupe: { label: 'Remove duplicate lines', fn: (t: string) => [...new Set(lines(t))].join('\n') },
  sortAsc: { label: 'Sort A→Z', fn: (t: string) => lines(t).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join('\n') },
  sortDesc: { label: 'Sort Z→A', fn: (t: string) => lines(t).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).join('\n') },
  removeEmpty: { label: 'Remove empty lines', fn: (t: string) => lines(t).filter((l) => l.trim()).join('\n') },
  reverse: { label: 'Reverse lines', fn: (t: string) => lines(t).reverse().join('\n') },
  collapse: { label: 'Collapse spaces', fn: (t: string) => t.replace(/[ \t]+/g, ' ') },
  slugify: { label: 'Slugify', fn: slugify },
} as const;

export type LineOp = keyof typeof LINE_OPS;

export function stats(text: string) {
  return {
    characters: [...text].length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? lines(text).length : 0,
    bytes: new TextEncoder().encode(text).length,
  };
}
