import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { renderSVG } from 'uqr';
import { CopyButton } from '@/components/CopyButton';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { buttonClass, ErrorMessage, Panel, Segmented, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { cn } from '@/lib/utils';
import { buildEmvQr, CURRENCY_NUMERIC, parseEmvQr, SPEC_SAMPLE, validateQrInput, type QrInput, type Tlv } from './lib';

type Mode = 'parse' | 'generate';

function hint(field: Tlv): string | undefined {
  if (field.id === '53') return CURRENCY_NUMERIC[field.value];
  if (field.id === '01') return field.value === '11' ? 'static' : field.value === '12' ? 'dynamic' : undefined;
  return undefined;
}

function FieldRows({ fields, depth = 0 }: { fields: Tlv[]; depth?: number }) {
  return fields.map((f, i) => (
    <tbody key={`${f.id}-${i}`}>
      <tr className="border-t border-border align-top">
        <td className="py-1.5 pr-3 font-mono text-xs" style={{ paddingLeft: depth * 16 }}>
          {f.id}
        </td>
        <td className="py-1.5 pr-3 text-muted-foreground">{f.name ?? 'Unknown'}</td>
        <td className="py-1.5 pr-3 font-mono text-xs text-muted-foreground">{f.length}</td>
        <td className="py-1.5 font-mono text-xs break-all">
          {f.children ? '' : f.value}
          {hint(f) && <span className="ml-2 font-sans text-muted-foreground">({hint(f)})</span>}
        </td>
      </tr>
      {f.children && <FieldRows fields={f.children} depth={depth + 1} />}
    </tbody>
  ));
}

function Parser() {
  const [input, setInput] = useToolInput('emv-qr');
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { qr: parseEmvQr(input) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [input]);
  const qr = parsed && 'qr' in parsed ? parsed.qr : undefined;
  const output = qr ? qr.fields.map((f) => `${f.id} ${f.name ?? ''}: ${f.value}`).join('\n') : '';

  return (
    <div>
      <ActionsBar toolId="emv-qr" input={input} output={output} onClear={() => setInput('')} onSample={() => setInput(SPEC_SAMPLE)} />
      <Split>
        <Panel title="Payload">
          <TextArea label="EMV QR payload" value={input} onChange={setInput} placeholder="000201010211…6304XXXX" rows={8} invalid={!!parsed && 'error' in parsed} />
          {parsed && 'error' in parsed && <div className="mt-3"><ErrorMessage>{parsed.error}</ErrorMessage></div>}
          {qr && !qr.crc.valid && (
            <p className="mt-3 text-sm text-muted-foreground">
              Correct payload: <span className="font-mono break-all">{input.trim().replace(/[0-9A-Fa-f]{4}$/, qr.crc.expected)}</span>
            </p>
          )}
        </Panel>
        <Panel
          title="Fields"
          actions={qr && (
            <span className={cn('rounded-full border px-2 py-0.5 text-xs', qr.crc.valid ? 'border-success/40 text-success' : 'border-red-500/40 text-red-500')}>
              {qr.crc.valid ? `CRC ${qr.crc.actual} valid` : `CRC ${qr.crc.actual ?? 'missing'} ≠ ${qr.crc.expected}`}
            </span>
          )}
        >
          {qr ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3 font-normal">ID</th>
                    <th className="py-1 pr-3 font-normal">Field</th>
                    <th className="py-1 pr-3 font-normal">Len</th>
                    <th className="py-1 font-normal">Value</th>
                  </tr>
                </thead>
                <FieldRows fields={qr.fields} />
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Paste a merchant-presented EMV QR payload to see its fields.</p>
          )}
        </Panel>
      </Split>
    </div>
  );
}

const DEFAULTS: QrInput = {
  dynamic: false,
  accountTag: '26',
  guid: 'ae.example.pay',
  account: '1234567890',
  mcc: '5411',
  currency: '784',
  amount: '',
  country: 'AE',
  name: 'Corner Grocery',
  city: 'Dubai',
  billNumber: '',
  reference: '',
};

const FIELDS: { key: Exclude<keyof QrInput, 'dynamic'>; label: string; placeholder?: string }[] = [
  { key: 'name', label: 'Merchant name (59)' },
  { key: 'city', label: 'Merchant city (60)' },
  { key: 'country', label: 'Country (58)', placeholder: 'AE' },
  { key: 'currency', label: 'Currency, numeric (53)', placeholder: '784' },
  { key: 'amount', label: 'Amount (54, optional)', placeholder: '25.00' },
  { key: 'mcc', label: 'Merchant category code (52)', placeholder: '5411' },
  { key: 'accountTag', label: 'Account template ID (26–51)' },
  { key: 'guid', label: 'Globally unique ID (xx.00)' },
  { key: 'account', label: 'Merchant account (xx.01)' },
  { key: 'billNumber', label: 'Bill number (62.01, optional)' },
  { key: 'reference', label: 'Reference label (62.05, optional)' },
];

function Generator() {
  const [q, setQ] = useState(DEFAULTS);
  const errors = validateQrInput(q);
  const payload = errors.length ? '' : buildEmvQr(q);
  const svg = useMemo(() => (payload ? renderSVG(payload, { ecc: 'M', border: 2 }) : ''), [payload]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emv-qr.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Split>
      <Panel title="Merchant details">
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="text-sm">
              <span className="text-muted-foreground">{f.label}</span>
              <input
                value={q[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setQ({ ...q, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 font-mono text-sm"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={q.dynamic} onChange={(e) => setQ({ ...q, dynamic: e.target.checked })} />
            Dynamic QR (point of initiation 12; one-time use)
          </label>
        </div>
        {CURRENCY_NUMERIC[q.currency] && <p className="mt-2 text-xs text-muted-foreground">Currency {q.currency} is {CURRENCY_NUMERIC[q.currency]}.</p>}
      </Panel>
      <Panel title="QR code" actions={payload && (
        <>
          <CopyButton value={payload} />
          <button type="button" onClick={download} className={buttonClass}>
            <Download className="size-3.5" /> SVG
          </button>
        </>
      )}>
        {errors.length > 0 ? (
          <ErrorMessage>{errors.join('. ')}.</ErrorMessage>
        ) : (
          <div className="space-y-3">
            <div
              role="img"
              aria-label="Generated QR code"
              className="mx-auto w-full max-w-64 rounded-md bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p aria-label="Generated payload" className="font-mono text-xs break-all">{payload}</p>
          </div>
        )}
      </Panel>
    </Split>
  );
}

export default function EmvQrTool() {
  const [mode, setMode] = useState<Mode>('parse');
  return (
    <div className="space-y-4">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'parse', label: 'Parse' }, { value: 'generate', label: 'Generate' }]} />
      {mode === 'parse' ? <Parser /> : <Generator />}
    </div>
  );
}
