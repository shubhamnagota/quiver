import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function CopyButton({ value, className, ...rest }: { value: string; className?: string; 'data-nav-item'?: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      {...rest}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent',
        className,
      )}
      aria-label={copied ? 'Copied' : 'Copy output'}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
