import { quickAnswers } from './quick';

describe('quickAnswers', () => {
  it('answers epochs with the Dubai time and copies ISO', () => {
    const [a] = quickAnswers('1700000000');
    expect(a?.title).toContain('02:13:20');
    expect(a?.copy()).toBe('2023-11-14T22:13:20.000Z');
  });

  it('offers a fresh UUID', () => {
    const [a] = quickAnswers(' UUID ');
    expect(a?.copy()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('stays quiet otherwise', () => {
    expect(quickAnswers('json')).toEqual([]);
  });
});
