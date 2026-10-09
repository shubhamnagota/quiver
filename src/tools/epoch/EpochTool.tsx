import { useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { buttonClass, ErrorMessage, Field, Panel, selectClass, Split } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { DEFAULT_ZONES, formatInZone, relativeTime } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { parseTime, toUnits, UNIT_LABELS, type Unit } from './lib';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-border py-2 first:border-t-0">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 font-mono text-sm break-all">{value}</span>
      <CopyButton value={value} className="shrink-0" />
    </div>
  );
}

export default function EpochTool() {
  const [input, setInput] = useToolInput('epoch');
  const [unit, setUnit] = useState<Unit | 'auto'>('auto');
  const now = useNow();

  const parsed = parseTime(input, unit === 'auto' ? undefined : unit);
  const units = parsed ? toUnits(parsed.ms) : undefined;
  const iso = parsed ? new Date(parsed.ms).toISOString() : '';

  return (
    <div>
      <ActionsBar
        toolId="epoch"
        input={input}
        output={iso}
        onClear={() => setInput('')}
        onSample={() => setInput(String(Math.floor(Date.now() / 1000)))}
      />
      <Split>
        <Panel
          title="Epoch or date"
          actions={
            <button type="button" onClick={() => setInput(String(Math.floor(Date.now() / 1000)))} className={buttonClass}>
              Now
            </button>
          }
        >
          <input
            aria-label="Epoch or date input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1700000000, 1700000000000 or 2026-10-09T10:00:00+04:00"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Field label="Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit | 'auto')} className={selectClass}>
                <option value="auto">Auto-detect</option>
                {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
              </select>
            </Field>
            {parsed?.kind === 'epoch' && unit === 'auto' && (
              <span className="text-xs text-muted-foreground">Read as {UNIT_LABELS[parsed.unit]}</span>
            )}
          </div>
          {input.trim() && !parsed && <div className="mt-3"><ErrorMessage>Not a recognised epoch or date.</ErrorMessage></div>}
          <p className="mt-6 text-sm text-muted-foreground">
            Now: <span className="font-mono text-foreground">{Math.floor(now / 1000)}</span>
          </p>
        </Panel>
        <Panel title={parsed ? relativeTime(parsed.ms, now) : 'Result'}>
          {parsed && units ? (
            <div>
              {DEFAULT_ZONES.map((z) => <Row key={z.zone} label={z.label} value={formatInZone(parsed.ms, z.zone)} />)}
              <Row label="Your time" value={new Date(parsed.ms).toString()} />
              <Row label="ISO 8601" value={iso} />
              <Row label="Seconds" value={units.s} />
              <Row label="Milliseconds" value={units.ms} />
              <Row label="Microseconds" value={units.µs} />
              <Row label="Nanoseconds" value={units.ns} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter an epoch in any unit, or a date to get its epoch.</p>
          )}
        </Panel>
      </Split>
    </div>
  );
}
