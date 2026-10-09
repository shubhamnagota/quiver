import { looksLikeEpoch, parseTime } from '@/tools/epoch/lib';
import { formatAmount, formatRate } from './fx/currencies';
import { convert } from './fx/rates';
import { useFx } from './fx/store';
import { evaluate } from './math';
import { formatInZone } from './time';

export interface QuickAnswer {
  id: string;
  title: string;
  hint: string;
  /** Text copied when the answer is chosen. */
  copy: () => string;
}

/** Answers shown inline in the palette, without opening a tool. */
export function quickAnswers(query: string): QuickAnswer[] {
  const q = query.trim();
  const answers: QuickAnswer[] = [];
  if (looksLikeEpoch(q)) {
    const ms = parseTime(q)!.ms;
    answers.push({
      id: 'epoch',
      title: formatInZone(ms, 'Asia/Dubai'),
      hint: `${formatInZone(ms, 'UTC')} · copy ISO`,
      copy: () => new Date(ms).toISOString(),
    });
  }
  const fx = /^(?:([\d.,+\-*/() ]+?)\s*)?([a-z]{3})\s+(?:to\s+|in\s+)?([a-z]{3})$/i.exec(q);
  const snapshot = useFx.getState().snapshot;
  if (fx && snapshot) {
    const from = fx[2]!.toUpperCase();
    const to = fx[3]!.toUpperCase();
    try {
      const amount = fx[1] ? evaluate(fx[1]) : 1;
      const value = convert(amount, from, to, snapshot);
      answers.push({
        id: 'fx',
        title: `${formatAmount(amount, from)} ${from} = ${formatAmount(value, to)} ${to}`,
        hint: `1 ${from} = ${formatRate(value / amount)} ${to} · mid-market`,
        copy: () => formatAmount(value, to).replace(/,/g, ''),
      });
    } catch {
      // unknown currency or bad amount: no answer
    }
  }
  if (/^(uuid|guid)$/i.test(q)) {
    answers.push({ id: 'uuid', title: 'Copy a fresh UUID', hint: 'v4', copy: () => crypto.randomUUID() });
  }
  return answers;
}
