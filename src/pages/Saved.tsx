import { ToolCard } from '@/components/ToolCard';
import { usePrefs } from '@/stores/prefs';
import { getTool } from '@/tools/registry';
import type { ToolManifest } from '@/tools/types';

export function Saved() {
  const favorites = usePrefs((s) => s.favorites).map(getTool).filter((t): t is ToolManifest => !!t);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Saved tools</h1>
      {favorites.length === 0 ? (
        <p className="text-muted-foreground">Star a tool to save it here.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}
    </div>
  );
}
