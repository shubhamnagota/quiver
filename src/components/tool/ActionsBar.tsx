import { Eraser, FlaskConical, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { isTyping } from '@/lib/keyboard';
import { stringifySearch } from '@/lib/search';
import { getTool } from '@/tools/registry';
import { buttonClass } from './Panel';

/**
 * Copy, Clear, Share link and Sample input. ⌘C copies the output when nothing
 * is selected and focus is not in a field.
 */
export function ActionsBar({
  toolId,
  input,
  output,
  onClear,
  onSample,
}: {
  toolId: string;
  input: string;
  output: string;
  onClear: () => void;
  onSample?: () => void;
}) {
  const tool = getTool(toolId);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'c' || !(e.metaKey || e.ctrlKey) || !output) return;
      if (isTyping(e.target) || window.getSelection()?.toString()) return;
      e.preventDefault();
      void navigator.clipboard.writeText(output);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [output]);

  useEffect(() => {
    if (!shared) return;
    const t = setTimeout(() => setShared(false), 1500);
    return () => clearTimeout(t);
  }, [shared]);

  const share = async () => {
    if (
      tool?.sensitive &&
      input &&
      !confirm('This tool handles sensitive data. The link will contain your input. Continue?')
    ) {
      return;
    }
    const url = `${location.origin}/t/${toolId}${stringifySearch({ input })}`;
    await navigator.clipboard.writeText(url);
    setShared(true);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <CopyButton value={output} />
      <button type="button" onClick={onClear} className={buttonClass} disabled={!input}>
        <Eraser className="size-3.5" /> Clear
      </button>
      <button type="button" onClick={share} className={buttonClass} disabled={!input}>
        <Link2 className="size-3.5" /> {shared ? 'Link copied' : 'Share link'}
      </button>
      {onSample && (
        <button type="button" onClick={onSample} className={buttonClass}>
          <FlaskConical className="size-3.5" /> Sample input
        </button>
      )}
      {tool?.sensitive && (
        <span className="text-xs text-muted-foreground">Input stays out of the URL unless you share a link.</span>
      )}
    </div>
  );
}
