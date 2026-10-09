import { Link } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { usePrefs } from '@/stores/prefs';
import type { ToolManifest } from '@/tools/types';
import { CategoryIcon } from './CategoryIcon';

export function ToolCard({ tool }: { tool: ToolManifest }) {
  const favorite = usePrefs((s) => s.favorites.includes(tool.id));
  const toggleFavorite = usePrefs((s) => s.toggleFavorite);

  return (
    <div className="group relative rounded-lg border border-border p-4 transition-colors hover:bg-accent has-[a:focus-visible]:bg-accent has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <Link data-nav-item to="/t/$toolId" params={{ toolId: tool.id }} className="block outline-none after:absolute after:inset-0">
        <div className="flex items-center gap-2 font-medium">
          <CategoryIcon category={tool.category} className="size-4 text-muted-foreground" />
          {tool.name}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(tool.id)}
        aria-label={favorite ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
        aria-pressed={favorite}
        className="absolute top-3 right-3 z-10 rounded p-1 text-muted-foreground hover:text-foreground"
      >
        <Star className="size-4" fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
