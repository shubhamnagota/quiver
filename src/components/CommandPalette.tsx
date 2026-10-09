import { useNavigate } from '@tanstack/react-router';
import { Command } from 'cmdk';
import { ArrowUpRight, Check, Info, House, Settings, Star, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { handOff } from '@/lib/handoff';
import { quickAnswers } from '@/lib/quick';
import { usePalette } from '@/stores/palette';
import { usePrefs } from '@/stores/prefs';
import { detectTools, getTool, tools } from '@/tools/registry';
import { CATEGORIES, type ToolManifest } from '@/tools/types';
import { CategoryIcon } from './CategoryIcon';

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent';
const groupClass =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground';

export function CommandPalette() {
  const { open, setOpen } = usePalette();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const recents = usePrefs((s) => s.recents);
  const favorites = usePrefs((s) => s.favorites);

  const detected = useMemo(() => detectTools(search), [search]);
  const answers = useMemo(() => quickAnswers(search), [search]);
  const [copied, setCopied] = useState(false);
  const pinned = favorites.map(getTool).filter((t): t is ToolManifest => !!t);
  const recent = recents.map(getTool).filter((t): t is ToolManifest => !!t);

  const close = () => {
    setOpen(false);
    setSearch('');
    setCopied(false);
  };
  const go = (to: string, params?: Record<string, string>) => {
    close();
    void navigate({ to, params } as never);
  };
  const openTool = (tool: ToolManifest) => {
    close();
    void navigate({ to: '/t/$toolId', params: { toolId: tool.id }, search: {} });
  };

  const toolItem = (tool: ToolManifest, prefix = '') => (
    <Command.Item
      key={prefix + tool.id}
      value={`${prefix}${tool.name}`}
      keywords={[...tool.keywords, tool.description, CATEGORIES[tool.category].label]}
      onSelect={() => openTool(tool)}
      className={itemClass}
    >
      <CategoryIcon category={tool.category} className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{tool.name}</span>
      <span className="ml-auto truncate text-xs text-muted-foreground">{tool.description}</span>
    </Command.Item>
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => (o ? setOpen(true) : close())}
      label="Command palette"
      overlayClassName="fixed inset-0 z-40 bg-black/50"
      contentClassName="fixed inset-x-3 top-[12vh] z-50 mx-auto max-w-xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Search tools or paste anything…"
        className="w-full border-b border-border bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground"
      />
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        {answers.length === 0 && detected.length === 0 && (
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
            No tools found.
          </Command.Empty>
        )}

        {copied && (
          <p role="status" className="flex items-center gap-2 px-3 py-2 text-sm text-success">
            <Check className="size-4" /> Copied to clipboard
          </p>
        )}

        {answers.length > 0 && (
          <Command.Group heading="Quick answer" className={groupClass} forceMount>
            {answers.map((a) => (
              <Command.Item
                key={`answer-${a.id}`}
                value={`answer-${a.id}`}
                forceMount
                onSelect={() => {
                  void navigator.clipboard.writeText(a.copy());
                  setCopied(true);
                  setTimeout(close, 600);
                }}
                className={itemClass}
              >
                <Zap className="size-4 text-primary" />
                <span className="truncate">{a.title}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{a.hint}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {detected.length > 0 && (
          <Command.Group heading="Detected from your input" className={groupClass} forceMount>
            {detected.map((tool) => (
              <Command.Item
                key={`detect-${tool.id}`}
                value={`detect-${tool.id}`}
                forceMount
                onSelect={() => {
                  handOff(tool.id, search.trim());
                  openTool(tool);
                }}
                className={itemClass}
              >
                <ArrowUpRight className="size-4 text-primary" />
                Open in {tool.name}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {!search && pinned.length > 0 && (
          <Command.Group heading="Pinned" className={groupClass}>
            {pinned.map((t) => toolItem(t, 'pinned:'))}
          </Command.Group>
        )}
        {!search && recent.length > 0 && (
          <Command.Group heading="Recent" className={groupClass}>
            {recent.map((t) => toolItem(t, 'recent:'))}
          </Command.Group>
        )}

        <Command.Group heading="Tools" className={groupClass}>
          {tools.map((t) => toolItem(t))}
        </Command.Group>

        <Command.Group heading="Go to" className={groupClass}>
          <Command.Item value="Home" onSelect={() => go('/')} className={itemClass}>
            <House className="size-4 text-muted-foreground" /> Home
          </Command.Item>
          <Command.Item value="Saved" keywords={['favorites', 'pinned']} onSelect={() => go('/saved')} className={itemClass}>
            <Star className="size-4 text-muted-foreground" /> Saved tools
          </Command.Item>
          <Command.Item value="Settings" keywords={['theme', 'preferences']} onSelect={() => go('/settings')} className={itemClass}>
            <Settings className="size-4 text-muted-foreground" /> Settings
          </Command.Item>
          <Command.Item value="About" keywords={['credits', 'shubham']} onSelect={() => go('/about')} className={itemClass}>
            <Info className="size-4 text-muted-foreground" /> About Quiver
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
