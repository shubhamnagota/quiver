import { ToolCard } from '@/components/ToolCard';
import { toolsInCategory } from '@/tools/registry';
import { CATEGORIES, type Category } from '@/tools/types';
import { NotFound } from './NotFound';

export function CategoryPage({ category }: { category: string }) {
  if (!(category in CATEGORIES)) return <NotFound />;
  const meta = CATEGORIES[category as Category];
  const list = toolsInCategory(category as Category);
  return (
    <div data-arrow-nav="grid">
      <h1 className="text-2xl font-semibold tracking-tight">{meta.label}</h1>
      <p className="mb-6 text-muted-foreground">{meta.description}</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tools here yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      )}
    </div>
  );
}
