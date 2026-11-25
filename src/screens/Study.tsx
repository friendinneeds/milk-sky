import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db';
import type { Rating, Word } from '../db/schema';
import { recordReview } from '../db/review';
import { getSettings } from '../db/settings';
import { buildQueue, requeueAfter } from '../lib/queue';
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

export function Study({ go }: { go: (r: Route) => void }) {
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
    const q = await buildQueue(db);
    const rows = await db.words.bulkGet(q.ids);
    const map = new Map<number, Word>();
    for (const w of rows) if (w) map.set(w.id!, w);
    wordsRef.current = map;
    seenRef.current = new Set();
    const ids = q.ids.filter((id) => map.has(id));
    setQueue(ids);
    setTotal(ids.length);
    setMoreDue(q.dueTotal > q.reviewCount);
    setStats({ good: 0, again: 0 });
    setFlipped(false);
    setLoaded(true);
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
        const updated = await recordReview(db, id, rating, { retry });
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
        <Header go={go} title="Study" count="" progress={0} />
        <div className="card empty" style={{ marginTop: 24 }}>
          <h2>Nothing to study right now</h2>
          <p>Everything due is done. New words arrive tomorrow, or add more now.</p>
          <button className="btn" onClick={() => go('add')}>Add words</button>
        </div>
        <button className="btn quiet" onClick={() => go('home')}>Back home</button>
      </div>
    );
  }

  const done = stats.good + stats.again;

  if (queue.length === 0) {
    return (
      <Finished
        stats={stats}
        moreDue={moreDue}
        go={go}
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
      <Header go={go} title="Today's session" count={`${done} / ${total}`} progress={(done / total) * 100} />

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

function Header({ go, title, count, progress }: { go: (r: Route) => void; title: string; count: string; progress: number }) {
  return (
    <>
      <header className="row-between">
        <button className="back" aria-label="Close" onClick={() => go('home')}>
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
  go,
  onMore,
}: {
  stats: { good: number; again: number };
  moreDue: boolean;
  go: (r: Route) => void;
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
        <button className="back" style={{ marginRight: -10 }} aria-label="Close" onClick={() => go('home')}>
          <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>×</span>
        </button>
      </header>

      <div className="col" style={{ gap: 6 }}>
        <span className="ok-badge" aria-hidden="true">✓</span>
        <h1 className="small" style={{ fontSize: 28, lineHeight: '34px' }}>Done for today</h1>
        <p className="sub-text" style={{ fontSize: 15, lineHeight: '22px' }}>
          {moreDue ? 'More reviews are waiting. Start another session when you want them.' : 'Come back tomorrow. Extra study is optional.'}
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
        {moreDue && <button className="btn" onClick={onMore}>Start another session</button>}
        <button className={`btn${moreDue ? ' quiet' : ''}`} onClick={() => go('home')}>Back home</button>
      </div>
    </div>
  );
}
