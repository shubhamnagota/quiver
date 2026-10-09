import { evaluate } from './math';

describe('evaluate', () => {
  it('handles precedence, parentheses and unary minus', () => {
    expect(evaluate('2500*12')).toBe(30000);
    expect(evaluate('1,000 + 2 * (3 - 1)')).toBe(1004);
    expect(evaluate('-5 + 10 / 4')).toBe(-2.5);
    expect(evaluate('.5x4')).toBe(2);
  });

  it('rejects junk and division by zero', () => {
    expect(() => evaluate('2 +')).toThrow();
    expect(() => evaluate('alert(1)')).toThrow();
    expect(() => evaluate('1/0')).toThrow(/finite/);
    expect(() => evaluate('')).toThrow();
  });
});
