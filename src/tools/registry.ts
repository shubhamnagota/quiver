import { CATEGORIES, type Category, type ToolManifest } from './types';

const modules = import.meta.glob<ToolManifest>('./*/manifest.ts', {
  eager: true,
  import: 'default',
});

export function buildRegistry(manifests: ToolManifest[]): ToolManifest[] {
  const seen = new Set<string>();
  for (const tool of manifests) {
    if (seen.has(tool.id)) throw new Error(`Duplicate tool id: ${tool.id}`);
    if (!(tool.category in CATEGORIES)) {
      throw new Error(`Unknown category "${tool.category}" for tool ${tool.id}`);
    }
    seen.add(tool.id);
  }
  return [...manifests].sort((a, b) => a.name.localeCompare(b.name));
}

export const tools = buildRegistry(Object.values(modules));

const byId = new Map(tools.map((tool) => [tool.id, tool]));

export function getTool(id: string): ToolManifest | undefined {
  return byId.get(id);
}

export function toolsInCategory(category: Category): ToolManifest[] {
  return tools.filter((tool) => tool.category === category);
}

/** Tools whose detect() matches the pasted text, for paste-to-open. */
export function detectTools(input: string, list: ToolManifest[] = tools): ToolManifest[] {
  const text = input.trim();
  if (!text) return [];
  return list.filter((tool) => {
    try {
      return tool.detect?.(text) ?? false;
    } catch {
      return false;
    }
  });
}
