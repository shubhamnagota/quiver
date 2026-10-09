import { formatInZone, relativeTime } from './time';

describe('time helpers', () => {
  it('formats a timestamp in a zone', () => {
    const ms = Date.UTC(2023, 10, 14, 22, 13, 20);
    expect(formatInZone(ms, 'UTC')).toContain('22:13:20');
    expect(formatInZone(ms, 'Asia/Dubai')).toContain('02:13:20');
    expect(formatInZone(ms, 'Asia/Kolkata')).toContain('03:43:20');
  });

  it('describes relative time', () => {
    const now = Date.UTC(2024, 0, 1);
    expect(relativeTime(now - 3 * 3600 * 1000, now)).toBe('3 hours ago');
    expect(relativeTime(now + 2 * 24 * 3600 * 1000, now)).toBe('in 2 days');
    expect(relativeTime(now, now)).toBe('now');
  });
});
