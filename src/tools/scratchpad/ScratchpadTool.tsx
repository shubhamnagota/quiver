import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { buttonClass, Panel, Segmented, TextArea } from '@/components/tool/Panel';
import { relativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { renderMarkdown } from './markdown';
import { padTitle, usePads } from './store';

type View = 'edit' | 'split' | 'preview';

export default function ScratchpadTool() {
  const { pads, activeId, create, update, remove, select } = usePads();
  const [view, setView] = useState<View>('split');
  const pad = pads.find((p) => p.id === activeId) ?? pads[0]!;
  const html = useMemo(() => (view === 'edit' ? '' : renderMarkdown(pad.content)), [pad.content, view]);
  const sorted = [...pads].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
      <Panel
        title="Pads"
        actions={
          <button type="button" onClick={create} className={buttonClass}>
            <Plus className="size-3.5" /> New
          </button>
        }
      >
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {sorted.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => select(p.id)}
                aria-current={p.id === pad.id}
                className={cn(
                  'w-full rounded-md px-2 py-1.5 text-left text-sm whitespace-nowrap',
                  p.id === pad.id ? 'bg-accent' : 'text-muted-foreground hover:bg-accent',
                )}
              >
                <span className="block truncate">{padTitle(p)}</span>
                <span className="text-xs text-muted-foreground">{relativeTime(p.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={`${padTitle(pad)} · saved locally`}
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: 'edit', label: 'Edit' },
                { value: 'split', label: 'Split' },
                { value: 'preview', label: 'Preview' },
              ]}
            />
            <CopyButton value={pad.content} />
            <button
              type="button"
              onClick={() => (!pad.content || confirm(`Delete "${padTitle(pad)}"?`)) && remove(pad.id)}
              className={buttonClass}
              aria-label="Delete pad"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        }
      >
        <div className={cn('grid gap-4', view === 'split' && 'md:grid-cols-2')}>
          {view !== 'preview' && (
            <TextArea label="Pad content" value={pad.content} onChange={(v) => update(pad.id, v)} placeholder="# Notes\n\nMarkdown supported. Saves as you type." rows={22} />
          )}
          {view !== 'edit' && (
            <div
              className="prose-sm max-w-none space-y-3 overflow-auto text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_table]:w-full [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2"
              // Sanitised with DOMPurify in renderMarkdown.
              dangerouslySetInnerHTML={{ __html: html || '<p class="text-muted-foreground">Nothing to preview.</p>' }}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
