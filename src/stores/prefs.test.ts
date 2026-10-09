import { MAX_RECENTS, usePrefs } from './prefs';

const state = () => usePrefs.getState();

beforeEach(() => state().reset());

describe('prefs store', () => {
  it('toggles favorites', () => {
    state().toggleFavorite('uuid');
    expect(state().favorites).toEqual(['uuid']);
    state().toggleFavorite('uuid');
    expect(state().favorites).toEqual([]);
  });

  it('reorders favorites and ignores moves past the ends', () => {
    ['a', 'b', 'c'].forEach((id) => state().toggleFavorite(id));
    state().moveFavorite('c', -1);
    expect(state().favorites).toEqual(['a', 'c', 'b']);
    state().moveFavorite('a', -1);
    expect(state().favorites).toEqual(['a', 'c', 'b']);
  });

  it('keeps recents unique, newest first, capped', () => {
    for (let i = 0; i < MAX_RECENTS + 3; i++) state().addRecent(`t${i}`);
    state().addRecent('t5');
    expect(state().recents[0]).toBe('t5');
    expect(state().recents).toHaveLength(MAX_RECENTS);
    expect(new Set(state().recents).size).toBe(MAX_RECENTS);
  });

  it('counts tool uses and remembers the thank-you', () => {
    state().addRecent('a');
    state().addRecent('a');
    expect(state().toolUses).toBe(2);
    state().markThanked();
    expect(state().thanked).toBe(true);
  });

  it('imports only valid fields', () => {
    state().importPrefs({ theme: 'light', favorites: ['x'], recents: 'bad' });
    expect(state().theme).toBe('light');
    expect(state().favorites).toEqual(['x']);
    expect(state().recents).toEqual([]);
    expect(() => state().importPrefs(null)).toThrow();
  });
});
