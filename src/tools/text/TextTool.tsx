import { ActionsBar } from '@/components/tool/ActionsBar';
import { buttonClass, Panel, Split, TextArea } from '@/components/tool/Panel';
import { useToolInput } from '@/components/tool/useToolInput';
import { CASES, LINE_OPS, stats, type CaseName, type LineOp } from './lib';

const SAMPLE = `settlement batch id
Payment Intent Status
payment intent status
  beneficiary IBAN  `;

export default function TextTool() {
  const [input, setInput] = useToolInput('text');
  const s = stats(input);

  return (
    <div>
      <ActionsBar toolId="text" input={input} output={input} onClear={() => setInput('')} onSample={() => setInput(SAMPLE)} />
      <Split>
        <Panel title="Text">
          <TextArea label="Text" value={input} onChange={setInput} placeholder="Type or paste text; the buttons transform it in place" rows={16} />
          <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
            {Object.entries(s).map(([k, v]) => (
              <div key={k} className="rounded-md bg-muted px-2 py-1.5">
                <dd className="font-mono text-sm">{v.toLocaleString()}</dd>
                <dt className="text-xs text-muted-foreground capitalize">{k}</dt>
              </div>
            ))}
          </dl>
        </Panel>
        <div className="space-y-4">
          <Panel title="Case">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CASES) as CaseName[]).map((c) => (
                <button key={c} type="button" className={buttonClass} disabled={!input} onClick={() => setInput(CASES[c].fn(input))}>
                  {CASES[c].label}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Lines and cleanup">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LINE_OPS) as LineOp[]).map((op) => (
                <button key={op} type="button" className={buttonClass} disabled={!input} onClick={() => setInput(LINE_OPS[op].fn(input))}>
                  {LINE_OPS[op].label}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </Split>
    </div>
  );
}
