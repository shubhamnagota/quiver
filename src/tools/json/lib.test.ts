import { formatJson, looksLikeJson, minifyJson, parseJson, parsePath, queryJson, SAMPLE, type Json } from './lib';

describe('json lib', () => {
  it('formats and minifies', () => {
    const r = parseJson('{"a":[1,2]}');
    if (!r.ok) throw new Error('should parse');
    expect(formatJson(r.value, '2')).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    expect(formatJson(r.value, 'tab')).toContain('\t"a"');
    expect(minifyJson(r.value)).toBe('{"a":[1,2]}');
  });

  it('reports the line and column of a syntax error', () => {
    const r = parseJson('{\n  "a": 1,\n  "b": \n}');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.line).toBe(4);
    expect(r.error.message).not.toMatch(/position/);
  });

  it('detects objects and arrays only', () => {
    expect(looksLikeJson(' {"a":1} ')).toBe(true);
    expect(looksLikeJson('[1,2]')).toBe(true);
    expect(looksLikeJson('123')).toBe(false);
    expect(looksLikeJson('{not json}')).toBe(false);
  });

  describe('queryJson', () => {
    const r = parseJson(SAMPLE);
    if (!r.ok) throw new Error('sample should parse');
    const data: Json = r.value;

    it('follows keys and indexes', () => {
      expect(queryJson(data, '$.payment.amount.currency')).toEqual(['AED']);
      expect(queryJson(data, "$['payment']['tags'][1]")).toEqual(['uae-in']);
      expect(queryJson(data, '$.fees[-1].type')).toEqual(['fx_markup']);
    });

    it('supports wildcards and recursive descent', () => {
      expect(queryJson(data, '$.fees[*].value')).toEqual([15, 0.4]);
      expect(queryJson(data, '$..value')).toEqual([2500, 15, 0.4]);
      expect(queryJson(data, '$.payment.amount.*')).toEqual([2500, 'AED']);
    });

    it('returns nothing for missing paths and throws on bad syntax', () => {
      expect(queryJson(data, '$.nope.deeper')).toEqual([]);
      expect(() => parsePath('payment')).toThrow(/start with \$/);
      expect(() => parsePath('$.[')).toThrow();
    });
  });
});
