import type { AppDB } from '../db';
import { getSettings } from '../db/settings';

export interface SessionQueue {
  /** Due reviews first (oldest due first), then new words. */
  ids: number[];
  reviewCount: number;
  newCount: number;
  /** All due reviews, including ones over the session cap. */
  dueTotal: number;
}

export async function buildQueue(db: AppDB, now = Date.now()): Promise<SessionQueue> {
  const settings = await getSettings(db);
  const dueWords = await db.words
    .where('status')
    .anyOf('learning', 'known')
    .and((w) => w.due !== undefined && w.due <= now)
    .sortBy('due');
  const reviews = dueWords.slice(0, settings.maxReviews);
  const fresh = await db.words.where('status').equals('new').sortBy('id');
  return {
    ids: [...reviews.map((w) => w.id!), ...fresh.map((w) => w.id!)],
    reviewCount: reviews.length,
    newCount: fresh.length,
    dueTotal: dueWords.length,
  };
}

/**
 * Where a word that was just answered "again" goes back in. A few cards later,
 * or at the end when the queue is shorter than that.
 */
export function requeueAfter(queue: number[], wordId: number, gap = 3): number[] {
  const at = Math.min(gap, queue.length);
  return [...queue.slice(0, at), wordId, ...queue.slice(at)];
}

export type PracticeSource =
  | { kind: 'weak' }
  | { kind: 'all' }
  | { kind: 'batch'; batchId: number }
  | { kind: 'new' };

export type PracticeSize = 10 | 20 | 'all';

function shuffle<T>(list: T[], rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Cards for a practice round. Started words come shuffled. New words come in
 * pack order, straight from the queue, ignoring the daily limit.
 */
export async function buildPracticeQueue(
  db: AppDB,
  source: PracticeSource,
  size: PracticeSize,
  rand: () => number = Math.random,
): Promise<number[]> {
  const take = (ids: number[]) => (size === 'all' ? ids : ids.slice(0, size));
  if (source.kind === 'new') {
    const waiting = (await db.words.where('status').anyOf('new', 'pool').toArray()).sort(
      (a, b) => (a.status === b.status ? a.id! - b.id! : a.status === 'new' ? -1 : 1),
    );
    return take(waiting.map((w) => w.id!));
  }
  let words;
  if (source.kind === 'weak') words = await db.words.where('status').equals('learning').toArray();
  else if (source.kind === 'all') words = await db.words.where('status').anyOf('new', 'learning', 'known').toArray();
  else words = (await db.words.where('batchId').equals(source.batchId).toArray()).filter((w) => w.status !== 'pool');
  return take(shuffle(words.map((w) => w.id!), rand));
}

export interface PracticeCounts {
  /** Words still being learned. */
  weak: number;
  /** Every word you can practise: everything except the waiting queue. */
  practisable: number;
  /** Not started yet: today's new words plus the queue. */
  notStarted: number;
  batches: { id: number; name: string; count: number }[];
}

export async function practiceCounts(db: AppDB): Promise<PracticeCounts> {
  const [words, batches] = await Promise.all([db.words.toArray(), db.batches.orderBy('addedAt').reverse().toArray()]);
  const perBatch = new Map<number, number>();
  const c = { weak: 0, practisable: 0, notStarted: 0 };
  for (const w of words) {
    if (w.status === 'pool' || w.status === 'new') c.notStarted += 1;
    if (w.status === 'pool') continue;
    if (w.status === 'learning') c.weak += 1;
    c.practisable += 1;
    perBatch.set(w.batchId, (perBatch.get(w.batchId) ?? 0) + 1);
  }
  return {
    ...c,
    batches: batches.filter((b) => perBatch.has(b.id!)).map((b) => ({ id: b.id!, name: b.name, count: perBatch.get(b.id!)! })),
  };
}
