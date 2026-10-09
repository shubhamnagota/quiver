import { Link, useRouter } from '@tanstack/react-router';
import { ShieldCheck, Star } from 'lucide-react';
import { createElement, lazy, Suspense, useEffect } from 'react';
import { isTyping } from '@/lib/keyboard';
import { usePalette } from '@/stores/palette';
import { usePrefs } from '@/stores/prefs';
import { getTool, tools } from '@/tools/registry';
import { CATEGORIES } from '@/tools/types';
import { NotFound } from './NotFound';

// One lazy component per tool, created once so each tool's chunk loads on first visit only.
const toolComponents = new Map(tools.map((tool) => [tool.id, lazy(tool.component)]));


export function ToolPage({ toolId }: { toolId: string }) {
  const tool = getTool(toolId);
  const addRecent = usePrefs((s) => s.addRecent);
  const favorite = usePrefs((s) => s.favorites.includes(toolId));
  const toggleFavorite = usePrefs((s) => s.toggleFavorite);
  const router = useRouter();

  useEffect(() => {
    if (tool) addRecent(tool.id);
  }, [tool, addRecent]);

  // Esc goes back, unless the palette is open or the user is typing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || usePalette.getState().open || isTyping(e.target)) return;
      router.history.back();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [router]);

  const Tool = toolComponents.get(toolId);
  if (!tool || !Tool) return <NotFound />;

  return (
    <div>
      <div className="mb-1 text-sm text-muted-foreground">
        <Link to="/c/$category" params={{ category: tool.category }} className="hover:text-foreground">
          {CATEGORIES[tool.category].label}
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
        {!tool.network && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-success">
            <ShieldCheck className="size-3.5" /> Runs locally
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(tool.id)}
          aria-pressed={favorite}
          aria-label={favorite ? 'Unpin tool' : 'Pin tool'}
          className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <Star className="size-5" fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        {/* Tool components are created once at module load, so their identity is stable across renders. */}
        {createElement(Tool)}
      </Suspense>
    </div>
  );
}
