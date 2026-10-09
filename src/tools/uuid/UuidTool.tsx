import { useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { generateUuids } from './lib';

export default function UuidTool() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [ids, setIds] = useState(() => generateUuids(5));
  const output = ids.join('\n');

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="space-y-4 rounded-lg border border-border p-4">
        <label className="block text-sm">
          <span className="text-muted-foreground">How many</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
          Uppercase
        </label>
        <button
          type="button"
          onClick={() => setIds(generateUuids(count, uppercase))}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Generate
        </button>
      </section>
      <section className="rounded-lg border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm text-muted-foreground">Output</h2>
          <CopyButton value={output} />
        </div>
        <pre aria-label="Generated UUIDs" className="overflow-x-auto font-mono text-sm leading-6">
          {output}
        </pre>
      </section>
    </div>
  );
}
