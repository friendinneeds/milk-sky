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
