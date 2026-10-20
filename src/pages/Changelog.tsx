import source from '../../CHANGELOG.md?raw';
import { AUTHOR } from '@/config';
import { type Inline, parseChangelog, parseInline, visibleReleases } from '@/lib/changelog';

const releases = visibleReleases(parseChangelog(source));

function Text({ text }: { text: string }) {
  return parseInline(text).map((part: Inline, i) => {
    if (part.type === 'strong') return <strong key={i} className="font-medium text-foreground">{part.text}</strong>;
    if (part.type === 'code') return <code key={i} className="rounded bg-muted px-1 font-mono text-[0.9em]">{part.text}</code>;
    if (part.type === 'link') {
      return <a key={i} href={part.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">{part.text}</a>;
    }
    return part.text;
  });
}

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function Changelog() {
  return (
    <article className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">What's new</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes in each version of Quiver. The same list is in{' '}
          <a href={`${AUTHOR.repo}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer" className="underline underline-offset-2">CHANGELOG.md</a>.
        </p>
      </header>
      {releases.map((r, i) => (
        <section key={r.version} aria-labelledby={`v-${r.version}`} className="space-y-3 border-t border-border pt-6 first-of-type:border-t-0 first-of-type:pt-0">
          <h2 id={`v-${r.version}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-semibold">{r.version === 'Unreleased' ? 'Coming next' : `Version ${r.version}`}</span>
            {r.date && <time dateTime={r.date} className="text-sm text-muted-foreground">{formatDate(r.date)}</time>}
            {i === 0 && r.date && <span className="rounded-full border border-primary/40 px-2 text-xs text-primary">Latest</span>}
          </h2>
          {r.intro.map((p) => (
            <p key={p} className="text-sm text-muted-foreground"><Text text={p} /></p>
          ))}
          {r.sections.map((s) => (
            <div key={s.title}>
              <h3 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{s.title}</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground marker:text-border">
                {s.items.map((item) => (
                  <li key={item}><Text text={item} /></li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
