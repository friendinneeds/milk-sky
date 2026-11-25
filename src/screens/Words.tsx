import { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Pos, Word } from '../db/schema';
import { WordLabel, StatusTag } from '../components/WordLabel';
import { PlusIcon } from '../components/Icons';
import { restoreBackupFile, saveBackupFile } from '../lib/backupFile';
import type { Route } from '../hooks/useRoute';

type Filter = 'all' | Pos;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'noun', label: 'Nouns' },
  { id: 'verb', label: 'Verbs' },
  { id: 'adjective', label: 'Adjectives' },
  { id: 'other', label: 'Other' },
];

export function Words({ go }: { go: (r: Route) => void }) {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const batches = useLiveQuery(() => db.batches.orderBy('addedAt').reverse().toArray(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, noun: 0, verb: 0, adjective: 0, other: 0 };
    for (const w of words ?? []) {
      c.all += 1;
      c[w.pos] += 1;
    }
    return c;
  }, [words]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = (words ?? []).filter(
      (w) =>
        (filter === 'all' || w.pos === filter) &&
        (!q || w.de.toLowerCase().includes(q) || w.en.toLowerCase().includes(q)),
    );
    const byBatch = new Map<number, Word[]>();
    for (const w of shown) byBatch.set(w.batchId, [...(byBatch.get(w.batchId) ?? []), w]);
    return (batches ?? [])
      .filter((b) => byBatch.has(b.id!))
      .map((b) => {
        const list = byBatch.get(b.id!)!;
        const known = list.filter((w) => w.status === 'known').length;
        return { batch: b, list, knownPct: Math.round((known / list.length) * 100) };
      });
  }, [words, batches, filter, query]);

  return (
    <div className="screen">
      <header className="row-between">
        <h1>Words</h1>
        <button className="btn small" onClick={() => go('add')}>
          <PlusIcon /> Add
        </button>
      </header>

      <input
        className="search"
        type="search"
        aria-label="Search words"
        placeholder="Search German or English"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chips" role="group" aria-label="Filter by type">
        {FILTERS.map((f) => (
          <button key={f.id} className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} {counts[f.id]}
          </button>
        ))}
      </div>

      {words && words.length === 0 && (
        <div className="card empty">
          <h2>Nothing here yet</h2>
          <p>Words you add show up here, grouped by batch.</p>
          <button className="btn" onClick={() => go('add')}>Add words</button>
        </div>
      )}

      {words && words.length > 0 && groups.length === 0 && <p className="muted">No words match.</p>}

      {groups.map(({ batch, list, knownPct }) => (
        <section key={batch.id} className="col" style={{ gap: 10 }}>
          <div className="row-between" style={{ alignItems: 'baseline' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{batch.name}</span>
            <span className="label">{list.length} words, {knownPct}% known</span>
          </div>
          <div className="card">
            {list.map((w) => (
              <div className="word-row" key={w.id}>
                <div>
                  <div className="de"><WordLabel word={w} /></div>
                  <div className="en">{w.en}</div>
                </div>
                <StatusTag status={w.status} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <BackupPanel />
    </div>
  );
}

function BackupPanel() {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);

  async function onExport() {
    try {
      const result = await saveBackupFile(db);
      if (result !== 'cancelled') setMsg({ kind: 'ok', text: result === 'shared' ? 'Backup shared.' : 'Backup downloaded.' });
    } catch (e) {
      setMsg({ kind: 'bad', text: e instanceof Error ? e.message : 'Export failed.' });
    }
  }

  async function onImport(file: File) {
    if (!window.confirm('Replace everything on this device with this backup?')) return;
    try {
      const n = await restoreBackupFile(db, file);
      setMsg({ kind: 'ok', text: `Restored ${n} words.` });
    } catch (e) {
      setMsg({ kind: 'bad', text: e instanceof Error ? e.message : 'Import failed.' });
    }
  }

  return (
    <section className="col" style={{ gap: 10, marginTop: 8 }}>
      <span className="label">Backup</span>
      <p className="sub-text" style={{ margin: 0 }}>
        Your words live on this device only. Save a copy now and then.
      </p>
      <div className="footer-actions">
        <button className="btn secondary" onClick={onExport}>Export</button>
        <button className="btn secondary" onClick={() => input.current?.click()}>Import</button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onImport(f);
          }}
        />
      </div>
      {msg && <div className={`notice ${msg.kind}`} role="status">{msg.text}</div>}
    </section>
  );
}
