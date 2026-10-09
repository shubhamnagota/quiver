import { ChevronDown, ChevronUp } from 'lucide-react';
import { ToolCard } from '@/components/ToolCard';
import { usePalette } from '@/stores/palette';
import { usePrefs } from '@/stores/prefs';
import { getTool, tools } from '@/tools/registry';
import type { ToolManifest } from '@/tools/types';

const resolve = (ids: string[]) => ids.map(getTool).filter((t): t is ToolManifest => !!t);

export function Home() {
  const favorites = resolve(usePrefs((s) => s.favorites));
  const recents = resolve(usePrefs((s) => s.recents));
  const moveFavorite = usePrefs((s) => s.moveFavorite);
  const setOpen = usePalette((s) => s.setOpen);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Every tool, one keystroke away.</h1>
        <p className="mt-1 text-muted-foreground">
          Press{' '}
          <button type="button" onClick={() => setOpen(true)} className="rounded border border-border px-1.5 font-mono text-sm">
            ⌘K
          </button>{' '}
          to search, or paste anything to jump straight to the right tool.
        </p>
      </section>

      <section aria-labelledby="pinned-heading">
        <h2 id="pinned-heading" className="mb-3 text-sm font-medium text-muted-foreground">Pinned</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Star a tool to pin it here.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((tool, i) => (
              <li key={tool.id} className="flex items-stretch gap-1">
                <div className="flex-1"><ToolCard tool={tool} /></div>
                <div className="flex flex-col justify-center">
                  <button type="button" disabled={i === 0} onClick={() => moveFavorite(tool.id, -1)}
                    aria-label={`Move ${tool.name} up`} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronUp className="size-4" />
                  </button>
                  <button type="button" disabled={i === favorites.length - 1} onClick={() => moveFavorite(tool.id, 1)}
                    aria-label={`Move ${tool.name} down`} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recents.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 text-sm font-medium text-muted-foreground">Recent</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recents.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className="mb-3 text-sm font-medium text-muted-foreground">All tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      </section>
    </div>
  );
}
