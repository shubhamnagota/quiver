import { useMemo } from 'react';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { ErrorMessage, Panel, Split, ValueRow } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { cn } from '@/lib/utils';
import { validateIban } from './lib';

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
              {result.warnings.map((w) => <p key={w} className="text-sm text-warning">{w}</p>)}
            </div>
          )}
        </Panel>
        <Panel
          title="Details"
          actions={result && (
            <span className={cn('rounded-full border px-2 py-0.5 text-xs', result.valid ? 'border-success/40 text-success' : 'border-danger/40 text-danger')}>
              {result.valid ? 'Valid IBAN' : 'Invalid'}
            </span>
          )}
        >
          {result ? (
            <div>
              <ValueRow label="Formatted" value={result.formatted} copy />
              <ValueRow label="Electronic" value={result.iban} copy />
              <ValueRow label="Country" value={result.countryName ? `${result.countryName} (${result.country})` : result.country} />
              <ValueRow label="Check digits" value={result.checkDigits} />
              <ValueRow label="Bank code" value={result.bankCode} />
              <ValueRow label={result.branchLabel ?? 'Branch code'} value={result.branchCode} />
              <ValueRow label="BBAN" value={result.bban} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Enter an IBAN with or without spaces.</p>
          )}
        </Panel>
      </Split>
    </div>
  );
}
