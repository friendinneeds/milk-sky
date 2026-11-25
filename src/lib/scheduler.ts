import { createEmptyCard, fsrs, generatorParameters, Rating as FsrsRating, State, type Card, type Grade } from 'ts-fsrs';
import type { Rating, Status, StoredCard } from '../db/schema';

/** A word counts as known once it is in review and the memory lasts this long. */
export const KNOWN_STABILITY_DAYS = 21;

const GRADE: Record<Rating, Grade> = { again: FsrsRating.Again, good: FsrsRating.Good };

export function makeScheduler(desiredRetention: number, fuzz = true) {
  // No short learning steps: this app is used once a day, so a wrong answer
  // comes back tomorrow (and again later in the same session as practice).
  return fsrs(generatorParameters({ request_retention: desiredRetention, enable_fuzz: fuzz, enable_short_term: false }));
}

export function toStored(c: Card): StoredCard {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduledDays: c.scheduled_days,
    learningSteps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review?.getTime(),
  };
}

export function fromStored(s: StoredCard): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: 0,
    scheduled_days: s.scheduledDays,
    learning_steps: s.learningSteps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.lastReview === undefined ? undefined : new Date(s.lastReview),
  };
}

export interface Scheduled {
  fsrs: StoredCard;
  status: Status;
  due: number;
}

/** The new schedule for a word after one rating. `prev` is undefined for a new word. */
export function schedule(
  prev: StoredCard | undefined,
  rating: Rating,
  now: number,
  desiredRetention: number,
  fuzz = true,
): Scheduled {
  const card = prev ? fromStored(prev) : createEmptyCard(new Date(now));
  const next = makeScheduler(desiredRetention, fuzz).next(card, new Date(now), GRADE[rating]).card;
  const stored = toStored(next);
  const known = rating === 'good' && next.state === State.Review && next.stability >= KNOWN_STABILITY_DAYS;
  return { fsrs: stored, status: known ? 'known' : 'learning', due: stored.due };
}
