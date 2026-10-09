/**
 * Evaluates simple arithmetic typed into an amount field: numbers, + - * /,
 * parentheses and unary minus. Commas and underscores are digit separators.
 * No eval: a small recursive-descent parser.
 */
export function evaluate(expression: string): number {
  const src = expression.replace(/[,_\s]/g, '').replace(/[×x]/g, '*').replace(/÷/g, '/');
  if (!src) throw new Error('Empty expression');
  let i = 0;

  const peek = () => src[i];
  const number = () => {
    const m = /^\d*\.?\d+(?:e[+-]?\d+)?/i.exec(src.slice(i));
    if (!m) throw new Error(`Unexpected "${peek() ?? 'end'}"`);
    i += m[0].length;
    return Number(m[0]);
  };
  const factor = (): number => {
    if (peek() === '-') { i++; return -factor(); }
    if (peek() === '+') { i++; return factor(); }
    if (peek() === '(') {
      i++;
      const v = expr();
      if (peek() !== ')') throw new Error('Missing )');
      i++;
      return v;
    }
    return number();
  };
  const term = (): number => {
    let v = factor();
    while (peek() === '*' || peek() === '/') {
      const op = src[i++];
      const r = factor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const expr = (): number => {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const op = src[i++];
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };

  const value = expr();
  if (i !== src.length) throw new Error(`Unexpected "${src[i]}"`);
  if (!Number.isFinite(value)) throw new Error('Result is not a finite number');
  return value;
}
