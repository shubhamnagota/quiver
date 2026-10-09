import { detectUnit, looksLikeEpoch, parseTime, toUnits } from './lib';

const at = Date.UTC(2023, 10, 14, 22, 13, 20);

describe('epoch lib', () => {
  it('detects units from digit count', () => {
    expect(detectUnit('1700000000')).toBe('s');
    expect(detectUnit('1700000000000')).toBe('ms');
    expect(detectUnit('1700000000000000')).toBe('µs');
    expect(detectUnit('1700000000000000000')).toBe('ns');
  });

  it('parses every unit to the same instant', () => {
    for (const v of ['1700000000', '1700000000000', '1700000000000000', '1700000000000000000']) {
      expect(parseTime(v)?.ms).toBe(at);
    }
    expect(parseTime('1700000000.5')?.ms).toBe(at + 500);
  });

  it('honours a forced unit', () => {
    expect(parseTime('1700000000', 'ms')?.ms).toBe(1_700_000_000);
  });

  it('parses date strings', () => {
    expect(parseTime('2023-11-14T22:13:20Z')).toEqual({ kind: 'date', ms: at });
    expect(parseTime('not a date')).toBeNull();
  });

  it('converts to every unit', () => {
    expect(toUnits(at)).toEqual({ s: '1700000000', ms: '1700000000000', µs: '1700000000000000', ns: '1700000000000000000' });
  });

  it('detects plausible epochs only', () => {
    expect(looksLikeEpoch('1700000000')).toBe(true);
    expect(looksLikeEpoch('1700000000000')).toBe(true);
    expect(looksLikeEpoch('9999999999')).toBe(false);
    expect(looksLikeEpoch('12345')).toBe(false);
    expect(looksLikeEpoch('0000000000')).toBe(false);
  });
});
