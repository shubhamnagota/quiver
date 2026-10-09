import { generateUuids, isUuid } from './lib';

describe('uuid lib', () => {
  it('generates the requested number of unique v4 UUIDs', () => {
    const ids = generateUuids(50);
    expect(ids).toHaveLength(50);
    expect(new Set(ids).size).toBe(50);
    expect(ids.every((id) => isUuid(id) && id[14] === '4')).toBe(true);
  });

  it('clamps the count to 1..1000', () => {
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(5000)).toHaveLength(1000);
  });

  it('supports uppercase output', () => {
    expect(generateUuids(1, true)[0]).toMatch(/^[0-9A-F-]+$/);
  });

  it('recognises UUIDs', () => {
    expect(isUuid(' 3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90 ')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});
