import { useMemo } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { ErrorMessage, Panel, Split } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { cn } from '@/lib/utils';
import { validateIban } from './lib';

function Row({ label, value, copy }: { label: string; value?: string; copy?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 border-t border-border py-2 first:border-t-0">
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 font-mono text-sm break-all">{value}</span>
      {copy && <CopyButton value={value} />}
    </div>
  );
}

export default function IbanTool() {
  const [input, setInput] = useToolInput('iban');
  const result = useMemo(() => (input.trim() ? validateIban(input) : null), [input]);

  return (
    <div>
      <ActionsBar toolId="iban" input={input} output={result?.formatted ?? ''} onClear={() => setInput('')} onSample={() => setInput('AE070331234567890123456')} />
      <Split>
        <Panel title="IBAN">
          <input
            aria-label="IBAN input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AE07 0331 2345 6789 0123 456"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono"
          />
          {result && (
            <div className="mt-3 space-y-2">
              {result.errors.map((e) => <ErrorMessage key={e}>{e}</ErrorMessage>)}
              {result.warnings.map((w) => <p key={w} className="text-sm text-amber-500">{w}</p>)}
            </div>
          )}
        </Panel>
        <Panel
          title="Details"
          actions={result && (
            <span className={cn('rounded-full border px-2 py-0.5 text-xs', result.valid ? 'border-success/40 text-success' : 'border-red-500/40 text-red-500')}>
              {result.valid ? 'Valid IBAN' : 'Invalid'}
            </span>
          )}
        >
          {result ? (
            <div>
              <Row label="Formatted" value={result.formatted} copy />
              <Row label="Electronic" value={result.iban} copy />
              <Row label="Country" value={result.countryName ? `${result.countryName} (${result.country})` : result.country} />
              <Row label="Check digits" value={result.checkDigits} />
              <Row label="Bank code" value={result.bankCode} />
              <Row label={result.branchLabel ?? 'Branch code'} value={result.branchCode} />
              <Row label="BBAN" value={result.bban} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter an IBAN with or without spaces.</p>
          )}
        </Panel>
      </Split>
    </div>
  );
}
