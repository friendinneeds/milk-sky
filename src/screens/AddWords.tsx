import { useState } from 'react';
import { db } from '../db';
import { addBatch, type AddBatchResult } from '../db/words';
import { SAMPLE_PACK, SAMPLE_PACK_NAME } from '../data/sample';
import { BackIcon } from '../components/Icons';
import type { Route } from '../hooks/useRoute';

/**
 * Minimal version: one starter pack. Pack list, batch size, paste and CSV
 * import and the sorted summary come in the next build step.
 */
export function AddWords({ go }: { go: (r: Route) => void }) {
  const [result, setResult] = useState<AddBatchResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      setResult(await addBatch(db, { name: SAMPLE_PACK_NAME, source: 'pack' }, SAMPLE_PACK));
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
        <div className="card" style={{ background: 'var(--acc-bg)' }}>
          <div className="list-row" style={{ minHeight: 64 }}>
            <span>
              <span className="t" style={{ fontWeight: 600 }}>{SAMPLE_PACK_NAME}</span>
              <span className="s" style={{ color: 'var(--acc-soft)' }}>{SAMPLE_PACK.length} words, starter pack</span>
            </span>
          </div>
        </div>
      </div>

      {result && (
        <div className={`notice ${result.added > 0 ? 'ok' : ''}`} role="status">
          {result.added > 0
            ? `${result.added} words added. ${result.introduced} start today, the rest follow a few a day.`
            : 'You already have all of these words.'}
          {result.skipped > 0 && result.added > 0 && ` ${result.skipped} duplicates skipped.`}
        </div>
      )}

      <p className="sub-text">
        New words wait in a queue and join your session a few at a time, so a big batch never
        lands on you in one day.
      </p>

      <div className="col" style={{ marginTop: 'auto' }}>
        {result && result.added > 0 ? (
          <button className="btn" onClick={() => go('words')}>View words</button>
        ) : (
          <button className="btn" disabled={busy} onClick={add}>Download {SAMPLE_PACK.length} words</button>
        )}
      </div>
    </div>
  );
}
