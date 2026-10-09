import { looksLikeEpoch, parseTime } from '@/tools/epoch/lib';
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
  if (/^(uuid|guid)$/i.test(q)) {
    answers.push({ id: 'uuid', title: 'Copy a fresh UUID', hint: 'v4', copy: () => crypto.randomUUID() });
  }
  return answers;
}
