import { CASES, LINE_OPS, slugify, stats, words } from './lib';

describe('text lib', () => {
  it('splits words across conventions', () => {
    expect(words('parseHTTPResponse_code-value now')).toEqual(['parse', 'http', 'response', 'code', 'value', 'now']);
  });

  it('converts case', () => {
    const t = 'payment intent ID';
    expect(CASES.camel.fn(t)).toBe('paymentIntentId');
    expect(CASES.pascal.fn(t)).toBe('PaymentIntentId');
    expect(CASES.snake.fn(t)).toBe('payment_intent_id');
    expect(CASES.constant.fn(t)).toBe('PAYMENT_INTENT_ID');
    expect(CASES.kebab.fn(t)).toBe('payment-intent-id');
    expect(CASES.title.fn('hello wORLD')).toBe('Hello World');
    expect(CASES.sentence.fn('hello. world? yes')).toBe('Hello. World? Yes');
  });

  it('slugifies with accents and symbols', () => {
    expect(slugify('  Crème Brûlée: 100% Done! ')).toBe('creme-brulee-100-done');
  });

  it('runs line operations', () => {
    expect(LINE_OPS.dedupe.fn('a\nb\na')).toBe('a\nb');
    expect(LINE_OPS.sortAsc.fn('item10\nitem2\nItem1')).toBe('Item1\nitem2\nitem10');
    expect(LINE_OPS.trim.fn('  a \n b')).toBe('a\nb');
    expect(LINE_OPS.removeEmpty.fn('a\n\n  \nb')).toBe('a\nb');
  });

  it('counts', () => {
    expect(stats('héllo world\n₹')).toEqual({ characters: 13, words: 3, lines: 2, bytes: 16 });
    expect(stats('')).toEqual({ characters: 0, words: 0, lines: 0, bytes: 0 });
  });
});
