/**
 * Ranks a palette item for a query (0 = hidden, 1 = best). Every word of the
 * query must match; the weakest word decides the score. Fuzzy letter-skipping
 * only applies to the item's name, so long descriptions don't produce noise.
 */
export function paletteScore(value: string, search: string, keywords: string[] = []): number {
  const name = value.replace(/^[a-z]+:/, '').toLowerCase();
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const keys = keywords.map((k) => k.toLowerCase());
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;

  let score = 1;
  for (const t of terms) {
    let s = 0;
    if (name.startsWith(t)) s = 1;
    else if (words.some((w) => w.startsWith(t))) s = 0.9;
    else if (keys.includes(t)) s = 0.85;
    else if (keys.some((k) => k.split(/\s+/).some((w) => w.startsWith(t)))) s = 0.7;
    else if (name.includes(t)) s = 0.6;
    else if (t.length >= 3 && keys.some((k) => k.includes(t))) s = 0.4;
    else if (isSubsequence(t, name)) s = 0.2;
    if (s === 0) return 0;
    score = Math.min(score, s);
  }
  return score;
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const c of hay) if (c === needle[i]) i++;
  return i === needle.length;
}
