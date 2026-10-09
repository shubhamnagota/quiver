import type { Json } from './lib';

function Leaf({ value }: { value: Json }) {
  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (typeof value === 'string') return <span className="text-success">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-sky-500">{value}</span>;
  return <span className="text-amber-500">{String(value)}</span>;
}

function Node({ name, value, depth }: { name?: string; value: Json; depth: number }) {
  const label = name !== undefined && <span className="text-primary">{name}: </span>;
  if (value === null || typeof value !== 'object') {
    return (
      <div className="pl-4">
        {label}
        <Leaf value={value} />
      </div>
    );
  }
  const entries: [string, Json][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value);
  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`;
  return (
    <details open={depth < 2} className="pl-4">
      <summary className="cursor-pointer -ml-4 marker:text-muted-foreground">
        {label}
        <span className="text-muted-foreground">{summary}</span>
      </summary>
      {entries.map(([k, v]) => (
        <Node key={k} name={k} value={v} depth={depth + 1} />
      ))}
    </details>
  );
}

export function JsonTree({ value }: { value: Json }) {
  return (
    <div className="max-h-[32rem] overflow-auto font-mono text-sm leading-6">
      <Node value={value} depth={0} />
    </div>
  );
}
