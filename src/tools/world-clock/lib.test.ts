import { cityLabel, formatOffset, localHours, offsetMinutes, startOfDay, workingOverlap } from './lib';

const noonUtc = Date.UTC(2026, 9, 9, 12, 0);

describe('world clock lib', () => {
  it('computes offsets, including half hours and DST', () => {
    expect(offsetMinutes('Asia/Dubai', noonUtc)).toBe(240);
    expect(offsetMinutes('Asia/Kolkata', noonUtc)).toBe(330);
    expect(offsetMinutes('Europe/London', noonUtc)).toBe(60);
    expect(offsetMinutes('Europe/London', Date.UTC(2026, 0, 9, 12))).toBe(0);
    expect(formatOffset(330)).toBe('UTC+5:30');
    expect(formatOffset(-300)).toBe('UTC-5');
  });

  it('gives local hours and start of day', () => {
    expect(localHours('Asia/Kolkata', noonUtc)).toBe(17.5);
    expect(new Date(startOfDay('Asia/Dubai', noonUtc)).toISOString()).toBe('2026-10-08T20:00:00.000Z');
  });

  it('finds the working-hours overlap between Dubai and India', () => {
    const day = startOfDay('Asia/Dubai', noonUtc);
    const [range, ...rest] = workingOverlap(['Asia/Dubai', 'Asia/Kolkata'], day);
    expect(rest).toEqual([]);
    // 09:00–16:30 Dubai = 10:30–18:00 India
    expect(new Date(range![0]).toISOString()).toBe('2026-10-09T05:00:00.000Z');
    expect(new Date(range![1]).toISOString()).toBe('2026-10-09T12:30:00.000Z');
  });

  it('returns no overlap when hours never meet', () => {
    const day = startOfDay('Asia/Dubai', noonUtc);
    expect(workingOverlap(['Asia/Dubai', 'America/Los_Angeles'], day)).toEqual([]);
  });

  it('labels cities from zone names', () => {
    expect(cityLabel('America/New_York')).toBe('New York');
  });
});
