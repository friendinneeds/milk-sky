import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db';
import type { Rating, Word } from '../db/schema';
import { recordReview } from '../db/review';
import { getSettings } from '../db/settings';
import {
  buildPracticeQueue,
  buildQueue,
  practiceCounts,
  requeueAfter,
  type PracticeSize,
  type PracticeSource,
} from '../lib/queue';
import { todayPlan } from '../lib/plan';
import { useLiveQuery } from 'dexie-react-hooks';
import { dayKey } from '../lib/dates';
import { streakInfo } from '../lib/streak';
import { WordLabel } from '../components/WordLabel';
import type { Route } from '../hooks/useRoute';

const DIRECTION_KEY = 'deutsch.direction';

function readDirection(): boolean {
  try {
    return localStorage.getItem(DIRECTION_KEY) === 'en-de';
  } catch {
    return false;
  }
}

function speak(w: Word) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${w.article ?? ''} ${w.de}`.trim());
  u.lang = 'de-DE';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

interface Loaded {
  ids: number[];
  moreDue: boolean;
}

/** The daily session: due reviews, then today's new words. Opened from Home. */
export function DailySession({ go }: { go: (r: Route) => void }) {
  return (
    <Session
      go={go}
      title="Today's session"
      practice={false}
      load={async () => {
        const q = await buildQueue(db);
        return { ids: q.ids, moreDue: q.dueTotal > q.reviewCount };
      }}
      onDone={() => go('home')}
    />
  );
}

function Session({
  go,
  title,
  practice,
  load: loadIds,
  onDone,
  learningNew = false,
}: {
  go: (r: Route) => void;
  title: string;
  practice: boolean;
  load: () => Promise<Loaded>;
  onDone: () => void;
  learningNew?: boolean;
}) {
  const wordsRef = useRef(new Map<number, Word>());
  const seenRef = useRef(new Set<number>());
  const busy = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [moreDue, setMoreDue] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [reverse, setReverse] = useState(readDirection);
  const [stats, setStats] = useState({ good: 0, again: 0 });

  const load = useCallback(async () => {
    const q = await loadIds();
    const rows = await db.words.bulkGet(q.ids);
    const map = new Map<number, Word>();
    for (const w of rows) if (w) map.set(w.id!, w);
    wordsRef.current = map;
    seenRef.current = new Set();
    const ids = q.ids.filter((id) => map.has(id));
    setQueue(ids);
    setTotal(ids.length);
    setMoreDue(q.moreDue);
    setStats({ good: 0, again: 0 });
    setFlipped(false);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rate = useCallback(
    async (rating: Rating) => {
      if (busy.current || queue.length === 0) return;
      busy.current = true;
      try {
        const id = queue[0];
        const retry = seenRef.current.has(id);
        const updated = await recordReview(db, id, rating, { retry, practice });
        if (!retry) {
          seenRef.current.add(id);
          setStats((s) => ({ good: s.good + (rating === 'good' ? 1 : 0), again: s.again + (rating === 'again' ? 1 : 0) }));
          if (updated) wordsRef.current.set(id, updated);
        }
        setQueue((q) => {
          const rest = q.slice(1);
          return rating === 'again' ? requeueAfter(rest, id) : rest;
        });
        setFlipped(false);
      } finally {
        busy.current = false;
      }
    },
    [queue],
  );

  // Arrow keys on a keyboard: left = still learning, right = know it, up or down = flip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') void rate('again');
      else if (e.key === 'ArrowRight') void rate('good');
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') setFlipped((f) => !f);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rate]);

  function toggleDirection() {
    const next = !reverse;
    setReverse(next);
    try {
      localStorage.setItem(DIRECTION_KEY, next ? 'en-de' : 'de-en');
    } catch {
      /* storage can be blocked; the choice then lasts for this session */
    }
  }

  if (!loaded) return <div className="screen sub" />;

  if (total === 0) {
    return (
      <div className="screen sub">
        <Header onClose={onDone} title={title} count="" progress={0} />
        <div className="card empty" style={{ marginTop: 24 }}>
          <h2>Nothing to study here</h2>
          <p>{practice ? 'There are no words in this group yet.' : 'Everything due is done. Practise anytime from the Study tab.'}</p>
          <button className="btn" onClick={() => go(practice ? 'add' : 'study')}>{practice ? 'Add words' : 'Practise'}</button>
        </div>
        <button className="btn quiet" onClick={onDone}>Back</button>
      </div>
    );
  }

  const done = stats.good + stats.again;

  if (queue.length === 0) {
    return (
      <Finished
        stats={stats}
        moreDue={moreDue}
        practice={practice}
        learningNew={learningNew}
        go={go}
        onDone={onDone}
        onMore={() => {
          setLoaded(false);
          void load();
        }}
      />
    );
  }

  const w = wordsRef.current.get(queue[0])!;
  const germanShown = reverse ? flipped : !flipped;
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <div className="screen sub study">
      <Header onClose={onDone} title={title} count={`${done} / ${total}`} progress={(done / total) * 100} />

      <div className="flash-wrap">
        <button className="flash" onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Show the other side' : 'Flip card'}>
          <span className="flash-top">
            <span className="tag">
              {w.pos}
              {w.status === 'new' && ' · new'}
              {seenRef.current.has(w.id!) && ' · again'}
            </span>
          </span>

          {!flipped ? (
            <>
              <span className="flash-main">
                {germanShown ? <WordLabel word={w} /> : w.en}
              </span>
              <span className="flash-hint">Tap to flip</span>
            </>
          ) : (
            <>
              <span className="flash-main answer">
                {germanShown ? <WordLabel word={w} /> : w.en}
                {w.plural && (
                  <span className="flash-sub">Plural: {w.plural.includes('/') ? w.plural : `die ${w.plural}`}</span>
                )}
              </span>
              {(w.example || w.note) && (
                <span className="flash-extra">
                  {w.example && (
                    <>
                      <span className="ex">{w.example}</span>
                      {w.exampleEn && <span className="muted">{w.exampleEn}</span>}
                    </>
                  )}
                  {w.note && <span className="muted note">{w.note}</span>}
                </span>
              )}
            </>
          )}
        </button>
        {hasSpeech && (
          <button className="speak" aria-label="Hear the German word" onClick={() => speak(w)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            </svg>
          </button>
        )}
      </div>

      <div className="footer-actions">
        <button className="btn secondary again" onClick={() => void rate('again')}>Still learning</button>
        <button className="btn" onClick={() => void rate('good')}>Know it</button>
      </div>

      <button className="text-btn" onClick={toggleDirection}>
        {reverse ? 'English to German' : 'German to English'}
      </button>
    </div>
  );
}

function Header({ onClose, title, count, progress }: { onClose: () => void; title: string; count: string; progress: number }) {
  return (
    <>
      <header className="row-between">
        <button className="back" aria-label="Close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span className="muted" style={{ minWidth: 54, textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{count}</span>
      </header>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}

function Finished({
  stats,
  moreDue,
  practice,
  learningNew,
  go,
  onDone,
  onMore,
}: {
  stats: { good: number; again: number };
  moreDue: boolean;
  practice: boolean;
  learningNew: boolean;
  go: (r: Route) => void;
  onDone: () => void;
  onMore: () => void;
}) {
  const [after, setAfter] = useState<{ streak: number; todayCards: number; minCards: number } | null>(null);

  useEffect(() => {
    void (async () => {
      const [sessions, settings] = await Promise.all([db.sessions.toArray(), getSettings(db)]);
      const today = dayKey(Date.now());
      const days = sessions.filter((s) => s.cards >= settings.streakMinCards).map((s) => s.day);
      setAfter({
        streak: streakInfo(days, today).count,
        todayCards: sessions.find((s) => s.day === today)?.cards ?? 0,
        minCards: settings.streakMinCards,
      });
    })();
  }, []);

  const cards = stats.good + stats.again;
  return (
    <div className="screen sub">
      <header className="row-between" style={{ justifyContent: 'flex-end' }}>
        <button className="back" style={{ marginRight: -10 }} aria-label="Close" onClick={onDone}>
          <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>×</span>
        </button>
      </header>

      <div className="col" style={{ gap: 6 }}>
        <span className="ok-badge" aria-hidden="true">✓</span>
        <h1 className="small" style={{ fontSize: 28, lineHeight: '34px' }}>{practice ? 'Round done' : 'Done for today'}</h1>
        <p className="sub-text" style={{ fontSize: 15, lineHeight: '22px' }}>
          {learningNew
            ? 'These words are now part of your daily reviews.'
            : practice
              ? 'Practice never moves words you already started to a later date.'
              : moreDue
                ? 'More reviews are waiting. Start another session when you want them.'
                : 'Come back tomorrow, or practise as much as you like from the Study tab.'}
        </p>
      </div>

      <div className="card">
        <div className="sum-row"><span className="t">Cards</span><span className="num">{cards}</span></div>
        <div className="sum-row"><span className="t">Knew it</span><span className="num">{stats.good}</span></div>
        <div className="sum-row"><span className="t">Still learning</span><span className="num">{stats.again}</span></div>
      </div>

      {after && (
        <div className="notice" role="status">
          {after.todayCards >= after.minCards
            ? `${after.streak} ${after.streak === 1 ? 'day' : 'days'} streak.`
            : `${after.minCards - after.todayCards} more ${after.minCards - after.todayCards === 1 ? 'card' : 'cards'} today to count toward your streak.`}
        </div>
      )}

      <div className="col" style={{ marginTop: 'auto' }}>
        {practice ? (
          <>
            <button className="btn" onClick={onDone}>Practise more</button>
            <button className="btn quiet" onClick={() => go('home')}>Back home</button>
          </>
        ) : (
          <>
            {moreDue && <button className="btn" onClick={onMore}>Start another session</button>}
            <button className={`btn${moreDue ? ' quiet' : ''}`} onClick={() => go('study')}>Practise more</button>
            <button className="btn quiet" onClick={() => go('home')}>Back home</button>
          </>
        )}
      </div>
    </div>
  );
}

type Choice = { kind: 'weak' } | { kind: 'all' } | { kind: 'batch'; batchId: number } | { kind: 'new' };
const SIZES: { value: PracticeSize; label: string }[] = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 'all', label: 'All' },
];

/** The Study tab: today's session, and practice whenever you like. */
export function Study({ go }: { go: (r: Route) => void }) {
  const plan = useLiveQuery(() => todayPlan(db), []);
  const counts = useLiveQuery(() => practiceCounts(db), []);
  const [choice, setChoice] = useState<Choice>({ kind: 'all' });
  const [size, setSize] = useState<PracticeSize>(20);
  const [running, setRunning] = useState<{ source: PracticeSource; size: PracticeSize } | null>(null);

  if (running) {
    const learningNew = running.source.kind === 'new';
    return (
      <Session
        go={go}
        title={learningNew ? 'New words' : 'Practice'}
        practice
        learningNew={learningNew}
        load={async () => ({ ids: await buildPracticeQueue(db, running.source, running.size), moreDue: false })}
        onDone={() => setRunning(null)}
      />
    );
  }
  if (!plan || !counts) return <div className="screen" />;

  const same = (a: Choice, b: Choice) =>
    a.kind === b.kind && (a.kind !== 'batch' || (b.kind === 'batch' && a.batchId === b.batchId));
  const options: { choice: Choice; title: string; count: number; hint: string }[] = [
    { choice: { kind: 'weak' }, title: 'Words still learning', count: counts.weak, hint: 'The ones you got wrong or just started' },
    { choice: { kind: 'all' }, title: 'All my words', count: counts.practisable, hint: 'Everything you have started, shuffled' },
    ...counts.batches.map((b) => ({ choice: { kind: 'batch', batchId: b.id } as Choice, title: b.name, count: b.count, hint: 'One pack, shuffled' })),
    { choice: { kind: 'new' }, title: 'Learn new words now', count: counts.notStarted, hint: 'Beyond today\'s ten. They join your reviews.' },
  ];
  const picked = options.find((o) => same(o.choice, choice)) ?? options[1];
  const n = size === 'all' ? picked.count : Math.min(size, picked.count);

  return (
    <div className="screen">
      <header>
        <h1>Study</h1>
      </header>

      {plan.total > 0 ? (
        <div className="card pad session">
          <span className="muted" style={{ fontSize: 14 }}>Today's session</span>
          <div className="num">
            <span className="big">{plan.total}</span>
            <span className="muted">cards, about {plan.minutes} min</span>
          </div>
          <button className="btn" onClick={() => go('session')}>Start session</button>
        </div>
      ) : (
        <div className="notice ok" role="status">Today's session is done. Practise as much as you like below.</div>
      )}

      <div className="col">
        <span className="label">Practice anytime</span>
        <p className="sub-text" style={{ margin: '0 0 4px' }}>
          As often as you want. It never pushes words you already started to a later date.
        </p>
        {options.map((o) => {
          const on = same(o.choice, picked.choice);
          return (
            <button
              key={o.choice.kind === 'batch' ? `b${o.choice.batchId}` : o.choice.kind}
              className={`radio-row${on ? ' on' : ''}`}
              aria-pressed={on}
              disabled={o.count === 0}
              style={o.count === 0 ? { opacity: 0.45 } : undefined}
              onClick={() => setChoice(o.choice)}
            >
              <span>
                <span className="t">{o.title}</span>
                <span className="s">{o.count} {o.count === 1 ? 'word' : 'words'}. {o.hint}</span>
              </span>
              <span className="radio" />
            </button>
          );
        })}
      </div>

      <div className="col">
        <span className="label">How many</span>
        <div className="seg" role="group" aria-label="Round size">
          {SIZES.map((s) => (
            <button key={String(s.value)} aria-pressed={size === s.value} onClick={() => setSize(s.value)}>{s.label}</button>
          ))}
        </div>
      </div>

      <button className="btn" disabled={n === 0} onClick={() => setRunning({ source: picked.choice, size })}>
        {n === 0 ? 'Nothing to practise yet' : picked.choice.kind === 'new' ? `Learn ${n} new words` : `Practise ${n} words`}
      </button>
    </div>
  );
}
