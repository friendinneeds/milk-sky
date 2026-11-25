import type { AppDB } from '../db';
import { getSettings } from '../db/settings';

export interface Plan {
  /** Reviews in the next session, capped. */
  due: number;
  /** All reviews that are due, including ones over the cap. */
  dueTotal: number;
  newCount: number;
  /** Words downloaded but not introduced yet. */
  waiting: number;
  total: number;
  minutes: number;
  /** Batch the next new words come from. */
  newFromBatch?: string;
  totalWords: number;
}

const SECONDS_PER_CARD = 15;

export async function todayPlan(db: AppDB, now = Date.now()): Promise<Plan> {
  const [dueTotal, newCount, waiting, totalWords, firstNew, settings] = await Promise.all([
    db.words
      .where('status')
      .anyOf('learning', 'known')
      .and((w) => w.due !== undefined && w.due <= now)
      .count(),
    db.words.where('status').equals('new').count(),
    db.words.where('status').equals('pool').count(),
    db.words.count(),
    db.words.where('status').equals('new').first(),
    getSettings(db),
  ]);
  const due = Math.min(dueTotal, settings.maxReviews);
  const batch = firstNew ? await db.batches.get(firstNew.batchId) : undefined;
  const total = due + newCount;
  const minutes = total === 0 ? 0 : Math.max(1, Math.round((total * SECONDS_PER_CARD) / 60));
  return { due, dueTotal, newCount, waiting, total, minutes, newFromBatch: batch?.name, totalWords };
}
