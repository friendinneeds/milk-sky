import type { AppDB } from './index';
import { dayKey } from '../lib/dates';
import { schedule } from '../lib/scheduler';
import type { Rating, Word } from './schema';
import { getSettings } from './settings';

/**
 * The first rating of a word in a session sets its schedule. A retry (the word
 * came back after "again") is logged for your history but changes nothing, so
 * practising a missed word never inflates how well you know it.
 */
export async function recordReview(
  db: AppDB,
  wordId: number,
  rating: Rating,
  opts: { retry?: boolean; mode?: 'study' | 'test'; now?: number; fuzz?: boolean } = {},
): Promise<Word | undefined> {
  const now = opts.now ?? Date.now();
  const settings = await getSettings(db);
  const retry = opts.retry ?? false;
  const mode = opts.mode ?? 'study';

  return db.transaction('rw', db.words, db.reviews, db.sessions, async () => {
    const word = await db.words.get(wordId);
    if (!word) return undefined;
    await db.reviews.add({ wordId, at: now, rating, mode, ...(retry ? { retry: true } : {}) });
    if (retry) return word;

    const next = schedule(word.fsrs, rating, now, settings.desiredRetention, opts.fuzz ?? true);
    await db.words.update(wordId, { fsrs: next.fsrs, status: next.status, due: next.due });

    const day = dayKey(now);
    const row = await db.sessions.get(day);
    await db.sessions.put({ day, cards: (row?.cards ?? 0) + 1 });
    return { ...word, fsrs: next.fsrs, status: next.status, due: next.due };
  });
}
