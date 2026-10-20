export interface Release {
  /** "0.2.0", or "Unreleased". */
  version: string;
  /** YYYY-MM-DD; absent for Unreleased. */
  date?: string;
  /** Paragraphs between the heading and the first section. */
  intro: string[];
  sections: { title: string; items: string[] }[];
}

export type Inline = { type: 'text' | 'strong' | 'code'; text: string } | { type: 'link'; text: string; href: string };

/**
 * Reads the subset of Markdown CHANGELOG.md uses: `## [version] - date`
 * releases, `### Added`-style sections, `- ` items (indented lines continue
 * the item) and plain paragraphs. Anything above the first release is the
 * file's own preamble and is skipped.
 */
export function parseChangelog(source: string): Release[] {
  const releases: Release[] = [];
  let release: Release | undefined;
  let items: string[] | undefined;
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const heading = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/.exec(line);
    if (heading) {
      release = { version: heading[1]!, date: heading[2], intro: [], sections: [] };
      releases.push(release);
      items = undefined;
      continue;
    }
    if (!release || !line.trim() || /^\[[^\]]+\]:\s/.test(line)) continue;
    const section = /^### (.+)/.exec(line);
    if (section) {
      items = [];
      release.sections.push({ title: section[1]!.trim(), items });
    } else if (items && line.startsWith('- ')) {
      items.push(line.slice(2).trim());
    } else if (items?.length && /^\s+\S/.test(line)) {
      items[items.length - 1] += ` ${line.trim()}`;
    } else if (!items) {
      release.intro.push(line.trim());
    }
  }
  return releases;
}

/** Releases with something to show; an empty Unreleased is dropped. */
export const visibleReleases = (releases: Release[]) =>
  releases.filter((r) => r.intro.length || r.sections.some((s) => s.items.length));

/** Bold, inline code and http(s) links; everything else stays text. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1]) out.push({ type: 'strong', text: m[1] });
    else if (m[2]) out.push({ type: 'code', text: m[2] });
    else out.push({ type: 'link', text: m[3]!, href: m[4]! });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}
