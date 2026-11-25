import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { addBatch, unseen, type AddBatchResult, type NewWord } from '../db/words';
import { PACKS } from '../data/packs';
import { summarizeBatch } from '../lib/summary';
import { BackIcon } from '../components/Icons';
import { WordLabel } from '../components/WordLabel';
import type { Route } from '../hooks/useRoute';

type Size = 10 | 25 | 50 | 'all';
const SIZES: { value: Size; label: string }[] = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 'all', label: 'All' },
];

/** Pack download. Paste and CSV import come in a later step. */
export function AddWords({ go }: { go: (r: Route) => void }) {
  const [packId, setPackId] = useState(PACKS[0].id);
  const [size, setSize] = useState<Size>('all');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; result: AddBatchResult } | null>(null);

  const left = useLiveQuery(async () => {
    const entries = await Promise.all(PACKS.map(async (p) => [p.id, await unseen(db, p.words)] as const));
    return Object.fromEntries(entries) as Record<string, NewWord[]>;
  }, []);

  if (done) return <Summary name={done.name} result={done.result} go={go} onMore={() => setDone(null)} />;

  const pack = PACKS.find((p) => p.id === packId)!;
  const remaining = left?.[pack.id] ?? [];
  const take = size === 'all' ? remaining.length : Math.min(size, remaining.length);

  async function download() {
    setBusy(true);
    try {
      const result = await addBatch(db, { name: pack.name, source: 'pack' }, remaining.slice(0, take));
      if (result.added > 0) setDone({ name: pack.name, result });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen sub">
      <header className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
        <button className="back" aria-label="Back" onClick={() => go('words')}><BackIcon /></button>
        <h1 className="small">Add words</h1>
      </header>

      <div className="col">
        <span className="label">Pack</span>
        {PACKS.map((p) => {
          const n = left?.[p.id]?.length;
          const selected = p.id === packId;
          return (
            <button
              key={p.id}
              className={`radio-row${selected ? ' on' : ''}`}
              aria-pressed={selected}
              onClick={() => setPackId(p.id)}
            >
              <span>
                <span className="t">{p.name}</span>
                <span className="s">
                  {n === undefined ? p.description : n === 0 ? 'All added' : `${n} of ${p.words.length} words left`}
                  {n !== undefined && n > 0 && `, ${p.description.toLowerCase()}`}
                </span>
              </span>
              <span className="radio" />
            </button>
          );
        })}
      </div>

      <div className="col">
        <span className="label">How many now</span>
        <div className="seg" role="group" aria-label="Batch size">
          {SIZES.map((s) => (
            <button key={String(s.value)} aria-pressed={size === s.value} onClick={() => setSize(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {remaining.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <span className="label">Next up, in this order</span>
          <div className="col" style={{ gap: 10, marginTop: 10 }}>
            {remaining.slice(0, 3).map((w) => (
              <div key={w.de + w.pos} className="row-between" style={{ fontSize: 15 }}>
                <span style={{ fontWeight: 500 }}><WordLabel word={w} /></span>
                <span className="muted" style={{ textAlign: 'right' }}>{w.en}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="sub-text">
        New words wait in a queue and join your session about ten a day, so a big download
        never lands on you at once.
      </p>

      <div className="col" style={{ marginTop: 'auto' }}>
        <button className="btn" disabled={busy || take === 0} onClick={download}>
          {take === 0 ? 'Nothing left in this pack' : `Download ${take} ${take === 1 ? 'word' : 'words'}`}
        </button>
      </div>
    </div>
  );
}

function Summary({
  name,
  result,
  go,
  onMore,
}: {
  name: string;
  result: AddBatchResult;
  go: (r: Route) => void;
  onMore: () => void;
}) {
  const s = useLiveQuery(() => summarizeBatch(db, result.batchId!), [result.batchId]);
  return (
    <div className="screen sub">
      <header className="row-between" style={{ justifyContent: 'flex-end' }}>
        <button className="back" style={{ marginRight: -10 }} aria-label="Close" onClick={() => go('words')}>
          <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>×</span>
        </button>
      </header>

      <div className="col" style={{ gap: 6 }}>
        <span className="ok-badge" aria-hidden="true">✓</span>
        <h1 className="small" style={{ fontSize: 28, lineHeight: '34px' }}>{result.added} words added</h1>
        <p className="sub-text" style={{ fontSize: 15, lineHeight: '22px' }}>
          {name}, sorted automatically.
          {result.skipped > 0 && ` ${result.skipped} duplicates were skipped.`} {result.introduced} start today,
          the rest follow about ten a day.
        </p>
      </div>

      {s && (
        <>
          <div className="card">
            <div className="sum-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
              <div className="row-between">
                <span className="t">Nouns</span>
                <span className="num">{s.nouns.total}</span>
              </div>
              <div className="chips" style={{ margin: 0, padding: 0 }}>
                <span className="gchip der">der {s.nouns.der}</span>
                <span className="gchip die">die {s.nouns.die}</span>
                <span className="gchip das">das {s.nouns.das}</span>
              </div>
            </div>
            <div className="sum-row"><span className="t">Verbs</span><span className="num">{s.verbs}</span></div>
            <div className="sum-row"><span className="t">Adjectives</span><span className="num">{s.adjectives}</span></div>
            <div className="sum-row">
              <span><span className="t">Other</span><span className="s">Phrases, participles, small words</span></span>
              <span className="num">{s.other}</span>
            </div>
          </div>

          {s.topics.length > 0 && (
            <div className="col">
              <span className="label">Topics found</span>
              <div className="chips" style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
                {s.topics.map((t) => (
                  <span key={t.name} className="chip" style={{ height: 36 }}>{t.name} {t.count}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="col" style={{ marginTop: 'auto' }}>
        <button className="btn" onClick={() => go('study')}>Study these now</button>
        <button className="btn quiet" onClick={() => go('words')}>View in library</button>
        <button className="btn quiet" style={{ background: 'none' }} onClick={onMore}>Add more words</button>
      </div>
    </div>
  );
}
