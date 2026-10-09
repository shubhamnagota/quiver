import { Link } from '@tanstack/react-router';
import { Search, Settings, Star } from 'lucide-react';
import { usePalette } from '@/stores/palette';
import { usePrefs } from '@/stores/prefs';
import { getTool, toolsInCategory } from '@/tools/registry';
import { CATEGORIES, type Category, type ToolManifest } from '@/tools/types';
import { CategoryIcon } from './CategoryIcon';
import { Footer } from './Credits';
import { Logo } from './Logo';

const linkClass =
  'block truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground';
const activeProps = { className: 'bg-accent text-foreground' };

export function Sidebar() {
  const setOpen = usePalette((s) => s.setOpen);
  const favorites = usePrefs((s) => s.favorites)
    .map(getTool)
    .filter((t): t is ToolManifest => !!t);

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border md:flex">
      <div className="p-4">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <Search className="size-4" />
          Search
          <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-xs">⌘K</kbd>
        </button>
      </div>

      <nav aria-label="Tools" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {favorites.length > 0 && (
          <section>
            <h2 className="mb-1 flex items-center gap-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Star className="size-3.5" /> Favorites
            </h2>
            {favorites.map((tool) => (
              <Link key={tool.id} to="/t/$toolId" params={{ toolId: tool.id }} className={linkClass} activeProps={activeProps}>
                {tool.name}
              </Link>
            ))}
          </section>
        )}
        {(Object.keys(CATEGORIES) as Category[]).map((category) => {
          const list = toolsInCategory(category);
          if (list.length === 0) return null;
          return (
            <section key={category}>
              <Link
                to="/c/$category"
                params={{ category }}
                className="mb-1 flex items-center gap-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground"
              >
                <CategoryIcon category={category} className="size-3.5" />
                {CATEGORIES[category].label}
              </Link>
              {list.map((tool) => (
                <Link key={tool.id} to="/t/$toolId" params={{ toolId: tool.id }} className={linkClass} activeProps={activeProps}>
                  {tool.name}
                </Link>
              ))}
            </section>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-border p-4">
        <Link to="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Settings className="size-4" /> Settings
        </Link>
        <Footer />
      </div>
    </aside>
  );
}
