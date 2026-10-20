import { Archive, ArchiveRestore, ArrowRightLeft, Download, FileSpreadsheet, Plus, Trash2, Undo2, Upload, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { CurrencyInput } from '@/components/fx/CurrencyInput';
import { buttonClass, ErrorMessage, Panel } from '@/components/tool/Panel';
import { cn } from '@/lib/utils';
import { ConvertPanel } from './ConvertPanel';
import { ExpenseForm, field } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import {
  type Draft,
  draftFromExpense,
  emptyDraft,
  type Expense,
  exportGroup,
  fromMinor,
  type Group,
  isSettled,
  parseExport,
  summary,
  toCsv,
} from './lib';
import { Overview } from './Overview';
import { memberInUse, useSplitBills } from './store';

const today = () => new Date().toLocaleDateString('en-CA');
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';

function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function NewGroupForm({ onCreated, onCancel }: { onCreated: () => void; onCancel?: () => void }) {
  const createGroup = useSplitBills((s) => s.createGroup);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [people, setPeople] = useState('');
  const [error, setError] = useState<string>();
  return (
    <Panel title="New group">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const names = people.split(/[,\n]/).map((n) => n.trim()).filter(Boolean);
          if (!/^[A-Z]{3}$/.test(currency)) return setError('Pick a currency');
          if (names.length < 2) return setError('Add at least two people, separated by commas');
          createGroup(name, currency, names);
          onCreated();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-sm">
            <span className="text-muted-foreground">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa trip, Flat 4B…" className={field} />
          </label>
          <div className="text-sm">
            <span className="text-muted-foreground">Main currency</span>
            <div className="flex">
              <CurrencyInput value={currency} onChange={setCurrency} label="Group currency" />
            </div>
          </div>
        </div>
        <label className="block text-sm">
          <span className="text-muted-foreground">People</span>
          <input
            value={people}
            onChange={(e) => { setPeople(e.target.value); setError(undefined); }}
            placeholder="Asha, Bilal, Chen"
            className={field}
          />
        </label>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="flex gap-2">
          <button type="submit" className={cn(buttonClass, 'bg-primary text-primary-foreground hover:bg-primary/90')}>
            Create group
          </button>
          {onCancel && <button type="button" onClick={onCancel} className={buttonClass}>Cancel</button>}
        </div>
        <p className="text-xs text-muted-foreground">
          Groups are saved in this browser only. Use Export to send a group to someone else, who can import it in their Quiver.
        </p>
      </form>
    </Panel>
  );
}

function Members({ group }: { group: Group }) {
  const { addMember, renameMember, removeMember } = useSplitBills();
  const [name, setName] = useState('');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Users className="size-4 text-muted-foreground" aria-label="People" />
      {group.members.map((m) => {
        const inUse = memberInUse(group, m.id);
        return (
          <span key={m.id} className="inline-flex items-center rounded-full border border-border pr-1 pl-2.5 text-sm">
            <input
              aria-label={`Rename ${m.name}`}
              value={m.name}
              onChange={(e) => renameMember(group.id, m.id, e.target.value)}
              size={Math.max(m.name.length, 3)}
              className="bg-transparent py-0.5"
            />
            <button
              type="button"
              disabled={inUse}
              onClick={() => removeMember(group.id, m.id)}
              aria-label={`Remove ${m.name}`}
              title={inUse ? 'In use by an expense; delete or edit those first' : `Remove ${m.name}`}
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <X className="size-3.5" />
            </button>
          </span>
        );
      })}
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          addMember(group.id, name);
          setName('');
        }}
      >
        <input aria-label="New person" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add person" className={cn(field, 'w-32 py-1')} />
        <button type="submit" disabled={!name.trim()} className={buttonClass} aria-label="Add person">
          <Plus className="size-3.5" />
        </button>
      </form>
    </div>
  );
}

interface FormState {
  draft: Draft;
  original?: Expense;
  /** Remounts the form when a new draft is loaded. */
  key: number;
}

function GroupView({ group }: { group: Group }) {
  const { updateGroup, removeGroup, saveExpense, removeExpense, restoreExpense, convert, undoConvert } = useSplitBills();
  const [converting, setConverting] = useState(false);
  const [form, setForm] = useState<FormState>(() => ({ draft: emptyDraft(group, today()), key: 0 }));
  const [deleted, setDeleted] = useState<{ expense: Expense; index: number }>();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deleted) return;
    const t = setTimeout(() => setDeleted(undefined), 8000);
    return () => clearTimeout(t);
  }, [deleted]);

  const load = (draft: Draft, original?: Expense) => {
    setForm((f) => ({ draft, original, key: f.key + 1 }));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const reset = () => setForm((f) => ({ draft: emptyDraft(group, today()), key: f.key + 1 }));
  const settled = isSettled(group);

  return (
    <div className="space-y-4">
      <Panel
        title={
          <input
            aria-label="Group name"
            value={group.name}
            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
            className="bg-transparent font-medium text-foreground"
          />
        }
        actions={
          <>
            <CopyButton value={summary(group)} />
            <button type="button" onClick={() => setConverting((v) => !v)} className={buttonClass} aria-expanded={converting}>
              <ArrowRightLeft className="size-3.5" /> Convert
            </button>
            {group.lastConversion && (
              <button type="button" onClick={() => undoConvert(group.id)} className={buttonClass} title={`Undo the conversion to ${group.lastConversion.to}`}>
                <Undo2 className="size-3.5" /> Undo conversion
              </button>
            )}
            <button type="button" onClick={() => download(exportGroup(group), `${slug(group.name)}.split.json`, 'application/json')} className={buttonClass} title="Download the group to share or back up">
              <Download className="size-3.5" /> Export
            </button>
            <button type="button" onClick={() => download(toCsv(group), `${slug(group.name)}.csv`, 'text/csv')} className={buttonClass} title="Download expenses as CSV for spreadsheets">
              <FileSpreadsheet className="size-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                if (group.archived) return updateGroup(group.id, { archived: false });
                if (settled || confirm(`"${group.name}" isn't settled up yet. Archive it anyway?`)) updateGroup(group.id, { archived: true });
              }}
              className={buttonClass}
            >
              {group.archived ? <><ArchiveRestore className="size-3.5" /> Unarchive</> : <><Archive className="size-3.5" /> Archive</>}
            </button>
            <button
              type="button"
              onClick={() => confirm(`Delete "${group.name}" and all its expenses? This can't be undone.`) && removeGroup(group.id)}
              className={buttonClass}
              aria-label="Delete group"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <Members group={group} />
          {group.archived && (
            <p className="text-sm text-muted-foreground">Archived. Unarchive to add expenses.</p>
          )}
          {!group.archived && settled && group.expenses.length > 0 && (
            <p className="text-sm text-muted-foreground">Everyone's settled up. Archive the group to tidy it away.</p>
          )}
        </div>
      </Panel>

      {converting && (
        <ConvertPanel
          group={group}
          onClose={() => setConverting(false)}
          onConvert={(to, rates) => {
            convert(group.id, to, rates);
            setConverting(false);
            reset();
          }}
        />
      )}

      <Overview
        group={group}
        onRecord={(t, currency) =>
          load({ ...emptyDraft(group, today(), 'payment'), paidBy: t.from, to: t.to, currency, amount: String(fromMinor(t.amount, currency)) })
        }
      />

      {!group.archived && (
        <div ref={formRef} className="scroll-mt-4">
          <ExpenseForm
            key={form.key}
            group={group}
            initial={form.draft}
            original={form.original}
            onCancel={form.draft.id || form.draft.kind === 'payment' ? reset : undefined}
            onSave={(expense) => {
              saveExpense(group.id, expense);
              // Keep the currency and payer for the next entry; clear the rest.
              setForm((f) => ({ draft: { ...emptyDraft(group, today()), currency: expense.currency, paidBy: expense.paidBy, date: expense.date }, key: f.key + 1 }));
            }}
          />
        </div>
      )}

      {deleted && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate">Deleted "{deleted.expense.description}"</span>
          <button
            type="button"
            onClick={() => {
              restoreExpense(group.id, deleted.expense, deleted.index);
              setDeleted(undefined);
            }}
            className={buttonClass}
          >
            <Undo2 className="size-3.5" /> Undo
          </button>
        </div>
      )}

      <ExpenseList
        group={group}
        editingId={form.draft.id}
        onEdit={(e) => (group.archived ? undefined : load(draftFromExpense(e, group.members), e))}
        onDelete={(e) => {
          setDeleted({ expense: e, index: group.expenses.findIndex((x) => x.id === e.id) });
          removeExpense(group.id, e.id);
          if (form.draft.id === e.id) reset();
        }}
      />
    </div>
  );
}

export default function SplitBillsTool() {
  const { groups, activeId, select, importGroup } = useSplitBills();
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [importError, setImportError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const active = groups.find((g) => g.id === activeId);
  const open = groups.filter((g) => !g.archived);
  const archived = groups.filter((g) => g.archived);

  const onImport = async (file: File) => {
    setImportError(undefined);
    try {
      const group = parseExport(await file.text());
      const existing = groups.find((g) => g.id === group.id);
      const replace =
        existing &&
        confirm(`"${existing.name}" is already in this browser.\n\nOK replaces it with the imported version.\nCancel keeps both.`);
      importGroup(group, replace ? 'replace' : 'copy');
      setCreating(false);
    } catch (e) {
      setImportError((e as Error).message);
    }
  };

  const groupButton = (g: Group) => (
    <li key={g.id}>
      <button
        type="button"
        data-nav-item
        onClick={() => {
          select(g.id);
          setCreating(false);
        }}
        aria-current={g.id === active?.id}
        className={cn(
          'w-full rounded-md px-2 py-1.5 text-left text-sm whitespace-nowrap',
          g.id === active?.id ? 'bg-accent' : 'text-muted-foreground hover:bg-accent',
        )}
      >
        <span className="block truncate">{g.name}</span>
        <span className="text-xs text-muted-foreground">
          {g.members.length} people · {g.expenses.length} {g.expenses.length === 1 ? 'entry' : 'entries'}
        </span>
      </button>
    </li>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_1fr] [&>*]:min-w-0">
      <Panel
        title="Groups"
        actions={
          <>
            <button type="button" onClick={() => fileRef.current?.click()} className={buttonClass} aria-label="Import a group">
              <Upload className="size-3.5" />
            </button>
            <button type="button" onClick={() => setCreating(true)} className={buttonClass}>
              <Plus className="size-3.5" /> New
            </button>
          </>
        }
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
            e.target.value = '';
          }}
        />
        {importError && <div className="mb-2"><ErrorMessage>Couldn't import: {importError}</ErrorMessage></div>}
        {open.length === 0 && <p className="text-sm text-muted-foreground">No groups yet.</p>}
        <ul data-arrow-nav="grid" className="flex gap-1 overflow-x-auto lg:flex-col">
          {open.map(groupButton)}
        </ul>
        {archived.length > 0 && (
          <div className="mt-3 border-t border-border pt-2">
            <button type="button" onClick={() => setShowArchived((v) => !v)} aria-expanded={showArchived} className="text-xs text-muted-foreground hover:text-foreground">
              {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
            </button>
            {showArchived && <ul className="mt-1 flex gap-1 overflow-x-auto lg:flex-col">{archived.map(groupButton)}</ul>}
          </div>
        )}
      </Panel>
      {creating || !active ? (
        <NewGroupForm onCreated={() => setCreating(false)} onCancel={active ? () => setCreating(false) : undefined} />
      ) : (
        <GroupView key={active.id} group={active} />
      )}
    </div>
  );
}
