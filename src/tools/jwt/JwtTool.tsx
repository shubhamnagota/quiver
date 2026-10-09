import { Fragment, useEffect, useMemo, useState } from 'react';
import { ActionsBar } from '@/components/tool/ActionsBar';
import { ErrorMessage, Output, Panel, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { DEFAULT_ZONES, formatInZone, relativeTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { decodeJwt, isHmacAlg, SAMPLE, TIME_CLAIMS, tokenStatus, verifyHmac, type DecodedJwt } from './lib';

const STATUS = {
  valid: { label: 'Valid', className: 'border-success/40 text-success' },
  expired: { label: 'Expired', className: 'border-red-500/40 text-red-500' },
  'not-yet-valid': { label: 'Not yet valid', className: 'border-amber-500/40 text-amber-500' },
  'no-expiry': { label: 'No expiry', className: 'border-border text-muted-foreground' },
};

function Verify({ token }: { token: DecodedJwt }) {
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState<{ ok: boolean } | { error: string } | null>(null);
  const alg = token.header.alg;

  useEffect(() => {
    if (!secret) return;
    let cancelled = false;
    verifyHmac(token, secret).then(
      (ok) => !cancelled && setResult({ ok }),
      (e: Error) => !cancelled && setResult({ error: e.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [token, secret]);

  if (!isHmacAlg(alg)) {
    return <p className="text-sm text-muted-foreground">Signature verification supports HS256/384/512; this token uses {String(alg)}.</p>;
  }
  const shown = secret ? result : null;
  return (
    <div className="space-y-2">
      <input
        type="password"
        aria-label="HMAC secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder={`${alg} secret`}
        autoComplete="off"
        className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 font-mono text-sm"
      />
      {shown && 'ok' in shown && (
        <p role="status" className={cn('text-sm', shown.ok ? 'text-success' : 'text-red-500')}>
          {shown.ok ? 'Signature verified' : 'Invalid signature'}
        </p>
      )}
      {shown && 'error' in shown && <ErrorMessage>{shown.error}</ErrorMessage>}
    </div>
  );
}

export default function JwtTool() {
  const [input, setInput] = useToolInput('jwt');

  const decoded = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { token: decodeJwt(input) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [input]);

  const token = decoded && 'token' in decoded ? decoded.token : undefined;
  const status = token ? tokenStatus(token.payload) : undefined;
  const payloadText = token ? JSON.stringify(token.payload, null, 2) : '';
  const times = token
    ? TIME_CLAIMS.filter((c) => typeof token.payload[c] === 'number').map((c) => [c, (token.payload[c] as number) * 1000] as const)
    : [];

  return (
    <div>
      <ActionsBar toolId="jwt" input={input} output={payloadText} onClear={() => setInput('')} onSample={() => setInput(SAMPLE)} />
      <Split>
        <Panel title="Token">
          <TextArea label="JWT" value={input} onChange={setInput} placeholder="eyJhbGciOi…" rows={8} invalid={!!decoded && 'error' in decoded} />
          {decoded && 'error' in decoded && <div className="mt-3"><ErrorMessage>{decoded.error}</ErrorMessage></div>}
          {token && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm text-muted-foreground">Verify signature</h3>
              <Verify key={token.signingInput} token={token} />
            </div>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel
            title="Payload"
            actions={status && (
              <span className={cn('rounded-full border px-2 py-0.5 text-xs', STATUS[status.state].className)}>
                {STATUS[status.state].label}
                {status.expiresAt && ` · ${relativeTime(status.expiresAt)}`}
              </span>
            )}
          >
            <Output value={payloadText} label="JWT payload" />
          </Panel>
          {times.length > 0 && (
            <Panel title="Timestamps">
              <div className="space-y-4">
                {times.map(([claim, ms]) => (
                  <div key={claim}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="font-mono text-sm">{claim}</span>
                      <span className="text-xs text-muted-foreground">{relativeTime(ms)}</span>
                    </div>
                    <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-0.5 text-sm">
                      {DEFAULT_ZONES.map((z) => (
                        <Fragment key={z.zone}>
                          <dt className="text-muted-foreground">{z.label}</dt>
                          <dd className="font-mono text-xs leading-5">{formatInZone(ms, z.zone)}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {token && (
            <Panel title="Header">
              <Output value={JSON.stringify(token.header, null, 2)} label="JWT header" />
            </Panel>
          )}
        </div>
      </Split>
    </div>
  );
}
