import { padTitle, usePads } from './store';

const state = () => usePads.getState();

describe('scratchpad store', () => {
  it('creates, edits, selects and removes pads', () => {
    const initial = state().activeId;
    state().create();
    const created = state().activeId;
    expect(created).not.toBe(initial);
    expect(state().pads[0]!.id).toBe(created);

    state().update(created, '# Standup\n- ship M2');
    expect(padTitle(state().pads[0]!)).toBe('Standup');

    state().select(initial);
    state().remove(initial);
    expect(state().activeId).toBe(created);
  });

  it('always keeps at least one pad', () => {
    for (const p of [...state().pads]) state().remove(p.id);
    expect(state().pads).toHaveLength(1);
    expect(padTitle(state().pads[0]!)).toBe('Untitled');
  });
});
