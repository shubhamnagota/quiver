import { convert, type RatesSnapshot } from '@/lib/fx/rates';
import { evaluate } from '@/lib/math';

export type AmountResult = { ok: true; value: number; isExpression: boolean } | { ok: false; error: string };

export function parseAmount(input: string): AmountResult | null {
  if (!input.trim()) return null;
  try {
    return { ok: true, value: evaluate(input), isExpression: /[+\-*/x×÷()]/.test(input.trim().replace(/^-/, '')) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export type RowResult = { code: string; value?: number; error?: string };

/** Converts one amount to every target; an unknown code fails only its own row. */
export function convertAll(amount: number, from: string, targets: string[], snapshot: RatesSnapshot): RowResult[] {
  return targets.map((code) => {
    try {
      return { code, value: convert(amount, from, code, snapshot) };
    } catch (e) {
      return { code, error: (e as Error).message };
    }
  });
}

export const isCurrencyCode = (code: string) => /^[A-Z]{3}$/.test(code);
