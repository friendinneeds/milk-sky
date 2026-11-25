import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { dayKey } from '../lib/dates';
import { todayPlan } from '../lib/plan';
import { computeStreak } from '../lib/streak';
import { getSettings } from '../db/settings';
import type { Route } from '../hooks/useRoute';

const dateFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

export function Home({ go }: { go: (r: Route) => void }) {
  const plan = useLiveQuery(() => todayPlan(db), []);
  const streak = useLiveQuery(async () => {
    const [sessions, settings] = await Promise.all([db.sessions.toArray(), getSettings(db)]);
    const days = sessions.filter((s) => s.cards >= settings.streakMinCards).map((s) => s.day);
    return computeStreak(days, dayKey(Date.now()));
  }, []);
  const batches = useLiveQuery(async () => {
    const latest = await db.batches.orderBy('addedAt').reverse().limit(2).toArray();
    return Promise.all(
      latest.map(async (b) => {
        const words = await db.words.where('batchId').equals(b.id!).toArray();
        const known = words.filter((w) => w.status === 'known').length;
        return { ...b, count: words.length, knownPct: words.length ? Math.round((known / words.length) * 100) : 0 };
      }),
    );
  }, []);

  if (!plan) return <div className="screen" />;

  return (
    <div className="screen">
      <header className="row-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Heute</h1>
          <p className="sub-text">{dateFormat.format(new Date())}</p>
        </div>
        <span className="pill">
          <span className="dot" />
          {streak ? `${streak} ${streak === 1 ? 'day' : 'days'}` : 'No streak yet'}
        </span>
      </header>

      {plan.totalWords === 0 ? (
        <div className="card empty">
          <h2>No words yet</h2>
          <p>Add a first batch and the app sorts it for you.</p>
          <button className="btn" onClick={() => go('add')}>Add words</button>
        </div>
      ) : plan.total === 0 ? (
        <div className="card empty">
          <h2>Done for today</h2>
          <p>
            Nothing is due.
            {plan.waiting > 0 && ` ${plan.waiting} words are waiting and start tomorrow.`}
          </p>
          <button className="btn quiet" style={{ background: 'var(--s2)' }} onClick={() => go('add')}>Add words</button>
        </div>
      ) : (
        <>
          <div className="card pad session">
            <span className="muted" style={{ fontSize: 14 }}>Today's session</span>
            <div className="num">
              <span className="big">{plan.total}</span>
              <span className="muted">cards, about {plan.minutes} min</span>
            </div>
            <button className="btn" onClick={() => go('study')}>Start session</button>
          </div>

          <div className="card">
            <button className="list-row" onClick={() => go('study')}>
              <span className="t">Review</span>
              <span className="muted" style={{ fontSize: 14 }}>
                {plan.dueTotal > plan.due ? `${plan.due} of ${plan.dueTotal} due` : `${plan.due} due`}
              </span>
            </button>
            <button className="list-row" onClick={() => go('study')}>
              <span className="t">New words</span>
              <span className="muted" style={{ fontSize: 14 }}>
                {plan.newCount}
                {plan.newFromBatch ? ` from ${plan.newFromBatch}` : ''}
              </span>
            </button>
          </div>
        </>
      )}

      {batches && batches.length > 0 && (
        <section className="col" style={{ gap: 12 }}>
          <div className="row-between">
            <span style={{ fontSize: 15, fontWeight: 600 }}>Recent batches</span>
            <button
              onClick={() => go('add')}
              style={{ background: 'none', border: 0, color: 'var(--acc)', fontSize: 14, fontWeight: 600, padding: '10px 0' }}
            >
              Add words
            </button>
          </div>
          {batches.map((b) => (
            <button
              key={b.id}
              className="card list-row"
              style={{ borderRadius: 16, padding: '14px 20px' }}
              onClick={() => go('words')}
            >
              <span>
                <span className="t">{b.name}</span>
                <span className="s">{b.count} words, {dayLabel(b.addedAt)}</span>
              </span>
              <span className="muted" style={{ fontSize: 13 }}>{b.knownPct}% known</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function dayLabel(ms: number): string {
  const days = Math.round((new Date(dayKey(Date.now())).getTime() - new Date(dayKey(ms)).getTime()) / 86_400_000);
  if (days <= 0) return 'added today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
