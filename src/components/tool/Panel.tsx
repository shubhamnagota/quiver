import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-lg border border-border', className)}>
      <div className="flex min-h-11 flex-wrap items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="text-sm text-muted-foreground">{title}</h2>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="flex-1 p-3">{children}</div>
    </section>
  );
}

/** Input on the left, output on the right; stacks below 768px. */
export function Split({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">{children}</div>;
}

export function TextArea({
  value,
  onChange,
  label,
  placeholder,
  rows = 14,
  invalid,
  readOnly,
}: {
  value: string;
  onChange?: (value: string) => void;
  label: string;
  placeholder?: string;
  rows?: number;
  invalid?: boolean;
  readOnly?: boolean;
}) {
  return (
    <textarea
      aria-label={label}
      aria-invalid={invalid || undefined}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      className={cn(
        'block w-full resize-y rounded-md border border-border bg-transparent p-3 font-mono text-sm leading-6',
        invalid && 'border-red-500/70',
      )}
    />
  );
}

export function Output({ value, label = 'Output' }: { value: string; label?: string }) {
  return (
    <pre
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-h-[32rem] min-h-24 overflow-auto font-mono text-sm leading-6 break-all whitespace-pre-wrap"
    >
      {value}
    </pre>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
      {children}
    </p>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const selectClass = 'rounded-md border border-border bg-background px-2 py-1 text-sm';
export const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-40';

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded px-2.5 py-1 text-xs',
            value === o.value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
