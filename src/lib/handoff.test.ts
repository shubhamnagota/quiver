import { clearHandoff, handOff, peekHandoff } from './handoff';

describe('handoff', () => {
  it('hands input to the matching tool only, until cleared', () => {
    handOff('jwt', 'eyJ...');
    expect(peekHandoff('json')).toBeUndefined();
    expect(peekHandoff('jwt')).toBe('eyJ...');
    expect(peekHandoff('jwt')).toBe('eyJ...'); // peek survives StrictMode double render
    clearHandoff('json');
    expect(peekHandoff('jwt')).toBe('eyJ...');
    clearHandoff('jwt');
    expect(peekHandoff('jwt')).toBeUndefined();
  });
});
