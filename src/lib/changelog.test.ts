import changelog from '../../CHANGELOG.md?raw';
import pkg from '../../package.json';
import { parseChangelog, parseInline, visibleReleases } from './changelog';

describe('parseChangelog', () => {
  it('reads releases, sections, wrapped items and intros', () => {
    const releases = parseChangelog(
      [
        '# Changelog',
        'Preamble is skipped.',
        '## [Unreleased]',
        '## [1.1.0] - 2026-10-20',
        'A paragraph.',
        '### Added',
        '- One',
        '- Two that',
        '  wraps',
        '### Fixed',
        '- Three',
        '[1.1.0]: https://example.com',
      ].join('\n'),
    );
    expect(releases).toEqual([
      { version: 'Unreleased', date: undefined, intro: [], sections: [] },
      {
        version: '1.1.0',
        date: '2026-10-20',
        intro: ['A paragraph.'],
        sections: [
          { title: 'Added', items: ['One', 'Two that wraps'] },
          { title: 'Fixed', items: ['Three'] },
        ],
      },
    ]);
    expect(visibleReleases(releases).map((r) => r.version)).toEqual(['1.1.0']);
  });
});

describe('parseInline', () => {
  it('handles bold, code and http links only', () => {
    expect(parseInline('**Split** in `AED`, see [docs](https://x.dev) or [bad](javascript:alert(1))')).toEqual([
      { type: 'strong', text: 'Split' },
      { type: 'text', text: ' in ' },
      { type: 'code', text: 'AED' },
      { type: 'text', text: ', see ' },
      { type: 'link', text: 'docs', href: 'https://x.dev' },
      { type: 'text', text: ' or [bad](javascript:alert(1))' },
    ]);
  });
});

describe('CHANGELOG.md', () => {
  const releases = parseChangelog(changelog);
  const released = releases.filter((r) => r.version !== 'Unreleased');

  it('starts with Unreleased, then dated releases, newest first', () => {
    expect(releases[0]?.version).toBe('Unreleased');
    for (const r of released) expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const dates = released.map((r) => r.date!);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('has the package.json version as its latest release', () => {
    expect(released[0]?.version).toBe(pkg.version);
  });

  it('uses the standard section names', () => {
    for (const r of releases) {
      for (const s of r.sections) expect(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']).toContain(s.title);
    }
  });
});
