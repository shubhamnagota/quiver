import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { Field, Panel, Segmented, selectClass, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { utf8 } from '@/lib/encoding';
import { cn } from '@/lib/utils';
import { ALGORITHMS, digest, format, HMAC_ALGORITHMS, hmac, verifyWebhook, type HmacAlgorithm, type OutputFormat } from './lib';

type Mode = 'hash' | 'hmac';

const inputClass = 'w-full rounded-md border border-border bg-transparent px-3 py-1.5 font-mono text-sm';

export default function HashTool() {
  const [input, setInput] = useToolInput('hash');
  const [mode, setMode] = useState<Mode>('hash');
  const [as, setAs] = useState<OutputFormat>('hex');
  const [key, setKey] = useState('');
  const [hmacAlg, setHmacAlg] = useState<HmacAlgorithm>('SHA-256');
  const [signature, setSignature] = useState('');
  const [results, setResults] = useState<{ alg: string; value: string }[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const data = utf8(input);
    const run =
      mode === 'hash'
        ? Promise.all(ALGORITHMS.map(async (alg) => ({ alg, value: format(await digest(alg, data), as) })))
        : hmac(hmacAlg, utf8(key), data).then((mac) => [{ alg: `HMAC-${hmacAlg}`, value: format(mac, as) }]);
    void run.then((r) => !cancelled && setResults(r));
    return () => {
      cancelled = true;
    };
  }, [input, mode, as, key, hmacAlg]);

  useEffect(() => {
    let cancelled = false;
    const check = mode === 'hmac' && signature.trim() ? verifyWebhook(hmacAlg, key, input, signature) : Promise.resolve(null);
    void check.then((v) => !cancelled && setVerified(v));
    return () => {
      cancelled = true;
    };
  }, [mode, signature, hmacAlg, key, input]);

  const output = results.map((r) => (results.length > 1 ? `${r.alg}: ${r.value}` : r.value)).join('\n');

  return (
    <div>
      <ActionsBar
        toolId="hash"
        input={input}
        output={output}
        onClear={() => setInput('')}
        onSample={() => setInput('{"event":"payment.settled","id":"evt_1"}')}
      />
      <Split>
        <Panel
          title="Input"
          actions={
            <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'hash', label: 'Hash' }, { value: 'hmac', label: 'HMAC' }]} />
          }
        >
          <TextArea label="Text to hash" value={input} onChange={setInput} placeholder="Text or a webhook body" rows={8} />
          {mode === 'hmac' && (
            <div className="mt-3 space-y-3">
              <input type="password" aria-label="HMAC secret" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Secret key" autoComplete="off" className={inputClass} />
              <Field label="Algorithm">
                <select value={hmacAlg} onChange={(e) => setHmacAlg(e.target.value as HmacAlgorithm)} className={selectClass}>
                  {HMAC_ALGORITHMS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <div>
                <input aria-label="Signature to verify" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Webhook signature to check (hex, sha256=…, or base64)" className={inputClass} />
                {verified !== null && (
                  <p role="status" className={cn('mt-2 text-sm', verified ? 'text-success' : 'text-red-500')}>
                    {verified ? 'Signature matches' : 'Signature does not match'}
                  </p>
                )}
              </div>
            </div>
          )}
        </Panel>
        <Panel
          title={mode === 'hash' ? 'Digests' : 'HMAC'}
          actions={<Segmented label="Output format" value={as} onChange={setAs} options={[{ value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]} />}
        >
          <div className="space-y-3">
            {results.map((r) => (
              <div key={r.alg}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{r.alg}</span>
                  <CopyButton value={r.value} />
                </div>
                <p className="font-mono text-sm break-all">{r.value}</p>
              </div>
            ))}
          </div>
        </Panel>
      </Split>
    </div>
  );
}
