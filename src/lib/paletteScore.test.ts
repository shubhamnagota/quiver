import { paletteScore } from './paletteScore';

const tool = (name: string, keywords: string[]) => (q: string) => paletteScore(name, q, keywords);
const support = tool('Support Quiver', ['donate', 'support', 'sponsor', 'coffee', 'tip', 'crypto']);
const fx = tool('FX converter', ['fx', 'currency', 'exchange', 'Convert to many currencies at once with cached mid-market rates', 'Life']);
const text = tool('Text utilities', ['case', 'count', 'Change case, count, dedupe, sort, trim and slugify', 'Productivity']);
const json = tool('pinned:JSON formatter', ['json', 'pretty', 'Format, validate, minify and query JSON', 'Dev']);

describe('paletteScore', () => {
  it('puts keyword hits above loose matches in descriptions', () => {
    expect(support('donate')).toBeGreaterThan(fx('donate'));
    expect(fx('donate')).toBe(0);
    expect(support('support')).toBeGreaterThan(text('support'));
    expect(support('sponsor')).toBeGreaterThan(text('sponsor'));
  });

  it('ranks name prefixes highest and ignores the pinned:/recent: prefix', () => {
    expect(json('json')).toBe(1);
    expect(json('form')).toBe(0.9);
    expect(fx('exch')).toBe(0.7);
  });

  it('requires every word to match', () => {
    expect(fx('fx rates')).toBeGreaterThan(0);
    expect(fx('fx banana')).toBe(0);
  });

  it('keeps fuzzy matching on names', () => {
    expect(json('jsfm')).toBe(0.2);
    expect(support('')).toBe(1);
  });
});
