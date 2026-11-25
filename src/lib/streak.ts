import { daysBetween, prevDay } from './dates';

/** A freeze can only be used again after this many days. */
export const FREEZE_SPACING_DAYS = 7;

export interface StreakInfo {
  count: number;
  /** Missed days that a freeze covered. They keep the streak alive but don't add to it. */
  frozenDays: string[];
}

/**
 * Current streak in days. Today only counts once today's session is done, but
 * an unfinished today never breaks the streak.
 *
 * One freeze per week: a single missed day between two studied days is
 * covered, as long as no other freeze fell within the last 7 days. Two missed
 * days in a row always break the streak.
 */
export function streakInfo(days: Iterable<string>, today: string): StreakInfo {
  const set = new Set(days);
  let cursor = set.has(today) ? today : prevDay(today);
  let count = 0;
  const frozenDays: string[] = [];

  for (;;) {
    if (set.has(cursor)) {
      count += 1;
      cursor = prevDay(cursor);
      continue;
    }
    const before = prevDay(cursor);
    const last = frozenDays[frozenDays.length - 1];
    const freezeFree = last === undefined || daysBetween(cursor, last) >= FREEZE_SPACING_DAYS;
    if (set.has(before) && freezeFree) {
      frozenDays.push(cursor);
      cursor = before;
      continue;
    }
    break;
  }
  return { count, frozenDays };
}

export function computeStreak(days: Iterable<string>, today: string): number {
  return streakInfo(days, today).count;
}
