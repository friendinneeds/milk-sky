import type { Status, Word } from '../db/schema';

export function WordLabel({ word }: { word: Pick<Word, 'article' | 'de'> }) {
  return (
    <>
      {word.article && <span className={word.article}>{word.article} </span>}
      {word.de}
    </>
  );
}

const STATUS_LABEL: Record<Status, string> = {
  pool: 'Queued',
  new: 'New',
  learning: 'Learning',
  known: 'Known',
};

export function StatusTag({ status }: { status: Status }) {
  return (
    <span className={`status ${status}`}>
      <i />
      {STATUS_LABEL[status]}
    </span>
  );
}
