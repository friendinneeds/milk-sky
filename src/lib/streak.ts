import { prevDay } from './dates';

/**
 * Current streak in days. A streak stays alive through today even if today's
 * session isn't done yet, so it only breaks once a full day was missed.
 * Freezes are not implemented yet.
 */
export function computeStreak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : prevDay(today);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = prevDay(cursor);
  }
  return count;
}
