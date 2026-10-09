import { ClipboardPaste, Download, ImageUp, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { renderSVG } from 'uqr';
import { CopyButton } from '@/components/CopyButton';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { buttonClass, ErrorMessage, Panel, Segmented, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { isTyping } from '@/lib/keyboard';
import { cn } from '@/lib/utils';
import { decodeQrImage, imageFrom, readClipboard } from './decodeImage';
import { buildEmvQr, CURRENCY_NUMERIC, parseEmvQr, SPEC_SAMPLE, validateQrInput, type QrInput, type Tlv } from './lib';

type Mode = 'parse' | 'generate';

function hint(field: Tlv): string | undefined {
  if (field.id === '53') return CURRENCY_NUMERIC[field.value];
  if (field.id === '01') return field.value === '11' ? 'static' : field.value === '12' ? 'dynamic' : undefined;
  return undefined;
}

function FieldList({ fields }: { fields: Tlv[] }) {
  return (
    <ul className="divide-y divide-border">
      {fields.map((f, i) => (
        <li key={`${f.id}-${i}`} className="py-2">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{f.id}</span>
            <span className="min-w-0 flex-1">{f.name ?? 'Unknown'}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground" title="Length">{f.length}</span>
          </div>
          {f.children ? (
            <div className="mt-1 ml-1 border-l-2 border-border pl-3">
              <FieldList fields={f.children} />
            </div>
          ) : (
            <p className="mt-0.5 font-mono text-sm [overflow-wrap:anywhere]">
              {f.value}
              {hint(f) && <span className="ml-2 font-sans text-xs text-muted-foreground">{hint(f)}</span>}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

type Upload = { state: 'decoding'; name: string } | { state: 'done'; name: string } | { state: 'error'; name: string; message: string } | null;

/** Upload, drop or paste a QR image; it is decoded in the browser and never leaves the device. */
const canReadClipboard = typeof navigator !== 'undefined' && typeof navigator.clipboard?.read === 'function';

function useQrUpload(onText: (text: string) => void) {
  const [upload, setUpload] = useState<Upload>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  const decode = useMemo(
    () => async (file: File) => {
      const name = file.name || 'pasted image';
      setUpload({ state: 'decoding', name });
      try {
        onTextRef.current((await decodeQrImage(file)).trim());
        setUpload({ state: 'done', name });
      } catch (e) {
        setUpload({ state: 'error', name, message: (e as Error).message });
      }
    },
    [],
  );

  // Paste a screenshot anywhere on the page (outside other fields) or into the payload box.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFrom(e.clipboardData);
      if (!file) return;
      const target = e.target as HTMLElement | null;
      if (isTyping(target) && target?.getAttribute('aria-label') !== 'EMV QR payload') return;
      e.preventDefault();
      void decode(file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [decode]);

  /** The Paste button: reads an image (or a text payload) straight from the clipboard. */
  const pasteFromClipboard = async () => {
    try {
      const content = await readClipboard();
      if (content.kind === 'image') return void decode(content.file);
      onTextRef.current(content.text.trim());
      setUpload(null);
    } catch (e) {
      setUpload({ state: 'error', name: 'Clipboard', message: (e as Error).message });
    }
  };

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      if (!Array.from(e.dataTransfer.items).some((i) => i.type.startsWith('image/'))) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      const file = imageFrom(e.dataTransfer);
      setDragging(false);
      if (!file) return;
      e.preventDefault();
      void decode(file);
    },
  };

  const button = (
    <>
      <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass} disabled={upload?.state === 'decoding'}>
        {upload?.state === 'decoding' ? <LoaderCircle className="size-3.5 animate-spin" /> : <ImageUp className="size-3.5" />}
        Upload QR image
      </button>
      {canReadClipboard && (
        <button type="button" onClick={() => void pasteFromClipboard()} className={buttonClass} disabled={upload?.state === 'decoding'} title="Paste a copied QR image or payload (or press ⌘V)">
          <ClipboardPaste className="size-3.5" /> Paste
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        aria-label="QR image file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void decode(file);
          e.target.value = '';
        }}
      />
    </>
  );

  const status =
    upload?.state === 'decoding' ? (
      <p role="status" className="mt-3 text-sm text-muted-foreground">Reading {upload.name}…</p>
    ) : upload?.state === 'done' ? (
      <p role="status" className="mt-3 text-sm text-muted-foreground">Read from {upload.name}, decoded on this device.</p>
    ) : upload?.state === 'error' ? (
      <div className="mt-3"><ErrorMessage>{upload.name}: {upload.message}</ErrorMessage></div>
    ) : null;

  return { button, status, dropProps, dragging, clear: () => setUpload(null) };
}

function Parser() {
  const [input, setInput] = useToolInput('emv-qr');
  const upload = useQrUpload(setInput);
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
      <ActionsBar toolId="emv-qr" input={input} output={output} onClear={() => { setInput(''); upload.clear(); }} onSample={() => { setInput(SPEC_SAMPLE); upload.clear(); }} />
      <Split>
        <div {...upload.dropProps} className="relative min-w-0">
          <Panel title="Payload" actions={upload.button} className="h-full">
            <TextArea label="EMV QR payload" value={input} onChange={setInput} placeholder="Paste a payload, or upload, drop or paste a QR image" rows={8} invalid={!!parsed && 'error' in parsed} />
            {upload.status}
            {parsed && 'error' in parsed && <div className="mt-3"><ErrorMessage>{parsed.error}</ErrorMessage></div>}
            {qr && !qr.crc.valid && (
              <p className="mt-3 text-sm text-muted-foreground">
                Correct payload: <span className="font-mono break-all">{input.trim().replace(/[0-9A-Fa-f]{4}$/, qr.crc.expected)}</span>
              </p>
            )}
          </Panel>
          {upload.dragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-background/90 text-sm font-medium">
              Drop the QR image to read it
            </div>
          )}
        </div>
        <Panel
          title="Fields"
          actions={qr && (
            <span className={cn('rounded-full border px-2 py-0.5 text-xs', qr.crc.valid ? 'border-success/40 text-success' : 'border-danger/40 text-danger')}>
              {qr.crc.valid ? `CRC ${qr.crc.actual} valid` : `CRC ${qr.crc.actual ?? 'missing'} ≠ ${qr.crc.expected}`}
            </span>
          )}
        >
          {qr ? (
            <FieldList fields={qr.fields} />
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
