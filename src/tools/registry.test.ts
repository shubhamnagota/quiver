import { buildRegistry, detectTools, getTool, tools } from './registry';
import type { ToolManifest } from './types';

const stub = (overrides: Partial<ToolManifest>): ToolManifest => ({
  id: 'stub',
  name: 'Stub',
  description: '',
  category: 'dev',
  keywords: [],
  component: async () => ({ default: () => null }),
  ...overrides,
});

describe('registry', () => {
  it('discovers tool manifests from the tools folder', () => {
    expect(tools.length).toBeGreaterThan(0);
    expect(getTool('uuid')?.name).toBe('UUID generator');
  });

  it('rejects duplicate ids', () => {
    expect(() => buildRegistry([stub({}), stub({})])).toThrow(/Duplicate tool id/);
  });

  it('rejects unknown categories', () => {
    expect(() => buildRegistry([stub({ category: 'nope' as never })])).toThrow(/Unknown category/);
  });

  it('sorts tools by name', () => {
    const list = buildRegistry([stub({ id: 'b', name: 'Beta' }), stub({ id: 'a', name: 'Alpha' })]);
    expect(list.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('detects tools from pasted input and ignores throwing detectors', () => {
    const list = [
      stub({ id: 'num', detect: (s) => /^\d+$/.test(s) }),
      stub({ id: 'boom', detect: () => { throw new Error('bad'); } }),
    ];
    expect(detectTools(' 123 ', list).map((t) => t.id)).toEqual(['num']);
    expect(detectTools('   ', list)).toEqual([]);
  });
});
