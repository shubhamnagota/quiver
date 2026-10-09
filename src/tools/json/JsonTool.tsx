import { useMemo, useState } from 'react';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { ErrorMessage, Field, Output, Panel, Segmented, selectClass, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { JsonTree } from './JsonTree';
import { formatJson, minifyJson, parseJson, queryJson, SAMPLE, type Indent } from './lib';

type View = 'pretty' | 'minified' | 'tree';

export default function JsonTool() {
  const [input, setInput] = useToolInput('json');
  const [indent, setIndent] = useState<Indent>('2');
  const [view, setView] = useState<View>('pretty');
  const [path, setPath] = useState('');

  const parsed = useMemo(() => (input.trim() ? parseJson(input) : null), [input]);
  const query = useMemo(() => {
    if (!parsed?.ok || !path.trim()) return null;
    try {
      return { ok: true as const, matches: queryJson(parsed.value, path) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [parsed, path]);

  const output = !parsed?.ok
    ? ''
    : query?.ok
      ? formatJson(query.matches, indent)
      : view === 'minified'
        ? minifyJson(parsed.value)
        : formatJson(parsed.value, indent);

  const errorLine = parsed && !parsed.ok ? input.split('\n')[parsed.error.line - 1] : undefined;

  return (
    <div>
      <ActionsBar
        toolId="json"
        input={input}
        output={output}
        onClear={() => setInput('')}
        onSample={() => setInput(SAMPLE)}
      />
      <Split>
        <Panel title="Input">
          <TextArea label="JSON input" value={input} onChange={setInput} placeholder='{"paste": "JSON here"}' invalid={parsed ? !parsed.ok : false} />
          {parsed && !parsed.ok && (
            <div className="mt-3 space-y-2">
              <ErrorMessage>
                Line {parsed.error.line}, column {parsed.error.column}: {parsed.error.message}
              </ErrorMessage>
              {errorLine !== undefined && (
                <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs">
                  {errorLine}
                  {'\n'}
                  {' '.repeat(Math.max(parsed.error.column - 1, 0))}^
                </pre>
              )}
            </div>
          )}
        </Panel>
        <Panel
          title={query?.ok ? `${query.matches.length} match${query.matches.length === 1 ? '' : 'es'}` : parsed?.ok ? 'Valid JSON' : 'Output'}
          actions={
            <>
              <Segmented
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: 'pretty', label: 'Pretty' },
                  { value: 'minified', label: 'Minified' },
                  { value: 'tree', label: 'Tree' },
                ]}
              />
              <Field label="Indent">
                <select value={indent} onChange={(e) => setIndent(e.target.value as Indent)} className={selectClass}>
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </Field>
            </>
          }
        >
          <input
            aria-label="JSONPath query"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="JSONPath, e.g. $.payment.amount or $..value"
            className="mb-3 w-full rounded-md border border-border bg-transparent px-3 py-1.5 font-mono text-sm"
          />
          {query && !query.ok && <ErrorMessage>{query.error}</ErrorMessage>}
          {parsed?.ok && view === 'tree' && !query?.ok ? <JsonTree value={parsed.value} /> : <Output value={output} label="Formatted JSON" />}
        </Panel>
      </Split>
    </div>
  );
}
