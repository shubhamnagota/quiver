import { Download, FileUp } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { buttonClass, ErrorMessage, Output, Panel, Segmented, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { bytesToBase64, bytesToHex } from '@/lib/encoding';
import { decodeBase64, detectDirection, encodeText, guessMime, SAMPLE, type Direction } from './lib';

type Mode = 'auto' | Direction;

function download(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Base64Tool() {
  const [input, setInput] = useToolInput('base64');
  const [mode, setMode] = useState<Mode>('auto');
  const [urlSafe, setUrlSafe] = useState(false);
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const direction: Direction = mode === 'auto' ? detectDirection(input) : mode;

  const result = useMemo(() => {
    if (file) return { output: bytesToBase64(file.bytes, urlSafe) };
    if (!input) return { output: '' };
    if (direction === 'encode') return { output: encodeText(input, urlSafe) };
    try {
      const decoded = decodeBase64(input);
      return decoded.kind === 'text'
        ? { output: decoded.text }
        : { output: bytesToHex(decoded.bytes.slice(0, 512)), binary: decoded.bytes };
    } catch (e) {
      return { output: '', error: (e as Error).message };
    }
  }, [input, direction, urlSafe, file]);

  const onFile = async (f: File) => {
    setFile({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
  };

  const clear = () => {
    setInput('');
    setFile(null);
  };

  return (
    <div>
      <ActionsBar toolId="base64" input={input || file?.name || ''} output={result.output} onClear={clear} onSample={() => { setFile(null); setInput(SAMPLE); }} />
      <Split>
        <Panel
          title={file ? `File: ${file.name}` : 'Input'}
          actions={
            <>
              <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
                <FileUp className="size-3.5" /> Encode a file
              </button>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = '';
                }}
              />
            </>
          }
        >
          {file ? (
            <p className="text-sm text-muted-foreground">
              Encoded {file.name} locally.{' '}
              <button type="button" className="underline" onClick={() => setFile(null)}>
                Back to text
              </button>
            </p>
          ) : (
            <TextArea label="Base64 input" value={input} onChange={setInput} placeholder="Text to encode, or base64 to decode" invalid={!!result.error} />
          )}
        </Panel>
        <Panel
          title={file ? 'Base64' : direction === 'encode' ? 'Encoded' : result.binary ? `Binary (${result.binary.length} bytes, hex preview)` : 'Decoded'}
          actions={
            <>
              <Segmented
                label="Direction"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'auto', label: mode === 'auto' && input ? `Auto: ${direction}` : 'Auto' },
                  { value: 'encode', label: 'Encode' },
                  { value: 'decode', label: 'Decode' },
                ]}
              />
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
                URL-safe
              </label>
            </>
          }
        >
          {result.error && <ErrorMessage>{result.error}</ErrorMessage>}
          <Output value={result.output} label="Base64 output" />
          {result.binary && (
            <button
              type="button"
              className={`${buttonClass} mt-3`}
              onClick={() => {
                const type = guessMime(result.binary);
                download(result.binary, `decoded.${type.split('/')[1]}`, type);
              }}
            >
              <Download className="size-3.5" /> Download bytes
            </button>
          )}
        </Panel>
      </Split>
    </div>
  );
}
