import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { GRAMMAR, type GrammarTopic } from '../data/grammar';
import { BackIcon } from '../components/Icons';

export function Grammar() {
  const progress = useLiveQuery(() => db.grammar.toArray(), []);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!progress) return <div className="screen" />;
  const done = new Set(progress.map((p) => p.id));

  const open = GRAMMAR.find((t) => t.id === openId);
  if (open) {
    return (
      <Lesson
        topic={open}
        index={GRAMMAR.indexOf(open)}
        done={done.has(open.id)}
        onBack={() => setOpenId(null)}
        onToggle={() => (done.has(open.id) ? db.grammar.delete(open.id) : db.grammar.put({ id: open.id, doneAt: Date.now() }))}
      />
    );
  }

  const next = GRAMMAR.find((t) => !done.has(t.id));
  const upNext = GRAMMAR.filter((t) => !done.has(t.id) && t !== next);
  const finished = GRAMMAR.filter((t) => done.has(t.id));

  return (
    <div className="screen">
      <header>
        <h1>Grammar</h1>
        <p className="sub-text">{done.size} of {GRAMMAR.length} topics understood.</p>
      </header>

      {next ? (
        <button className="card pad continue" onClick={() => setOpenId(next.id)}>
          <span className="label">{done.size === 0 ? 'Start here' : 'Continue'}</span>
          <span className="title">{next.title}</span>
          <span className="muted" style={{ fontSize: 14 }}>{next.summary}</span>
          <span className="bar"><span style={{ width: `${(done.size / GRAMMAR.length) * 100}%` }} /></span>
        </button>
      ) : (
        <div className="card empty"><h2>All topics done</h2><p style={{ marginBottom: 0 }}>Open any topic below to review it.</p></div>
      )}

      {upNext.length > 0 && <TopicList label="Up next" topics={upNext} done={done} onOpen={setOpenId} />}
      {finished.length > 0 && <TopicList label="Done" topics={finished} done={done} onOpen={setOpenId} />}
    </div>
  );
}

function TopicList({
  label,
  topics,
  done,
  onOpen,
}: {
  label: string;
  topics: GrammarTopic[];
  done: Set<string>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="col">
      <span className="label">{label}</span>
      <div className="card">
        {topics.map((t) => (
          <button key={t.id} className="list-row" style={{ minHeight: 68 }} onClick={() => onOpen(t.id)}>
            <span>
              <span className="t" style={{ fontWeight: 600, fontSize: 16 }}>{t.title}</span>
              <span className="s">{t.summary}</span>
            </span>
            {done.has(t.id) && <span className="status known"><i />Done</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Lesson({
  topic,
  index,
  done,
  onBack,
  onToggle,
}: {
  topic: GrammarTopic;
  index: number;
  done: boolean;
  onBack: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="screen sub" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>
      <header className="row-between" style={{ justifyContent: 'flex-start', gap: 8 }}>
        <button className="back" aria-label="Back to grammar topics" onClick={onBack}><BackIcon /></button>
        <span className="sub-text" style={{ margin: 0 }}>Grammar, topic {index + 1} of {GRAMMAR.length}</span>
      </header>

      <div>
        <h1 style={{ fontSize: 28, lineHeight: '34px' }}>{topic.title}</h1>
        <div className="col" style={{ gap: 10, marginTop: 12 }}>
          {topic.paragraphs.map((p) => (
            <p key={p} style={{ margin: 0, fontSize: 16, lineHeight: '24px', color: '#c9c9d1' }}>{p}</p>
          ))}
        </div>
      </div>

      {topic.table && (
        <div
          className="card gtable"
          style={{ gridTemplateColumns: `1.2fr repeat(${topic.table.head.length - 1}, minmax(0, 1fr))` }}
        >
          {topic.table.head.map((h, i) => (
            <span key={i} className="th">{h}</span>
          ))}
          {topic.table.rows.flatMap((row, r) =>
            row.map((cell, c) => (
              <span key={`${r}-${c}`} className={c === 0 ? 'rowhead' : undefined}>{cell}</span>
            )),
          )}
        </div>
      )}

      <div className="col">
        <span className="label">Examples</span>
        <div className="card">
          {topic.examples.map((e) => (
            <div key={e.de} className="list-row" style={{ display: 'block', padding: '14px 20px' }}>
              <div style={{ fontSize: 17, fontWeight: 500 }}>{e.de}</div>
              <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{e.en}</div>
            </div>
          ))}
        </div>
      </div>

      {topic.tip && (
        <div className="tip">
          <div className="th">{topic.tip.title}</div>
          <div>{topic.tip.text}</div>
        </div>
      )}

      <div className="col" style={{ marginTop: 'auto' }}>
        <button className={`btn${done ? ' secondary' : ''}`} onClick={onToggle}>
          {done ? 'Mark as not done' : 'Mark as understood'}
        </button>
      </div>
    </div>
  );
}
