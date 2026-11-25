export type Pos = 'noun' | 'verb' | 'adjective' | 'other';
export type Article = 'der' | 'die' | 'das';

/**
 * pool     downloaded, waiting to be introduced
 * new      introduced, not reviewed yet
 * learning reviewed at least once, not stable yet
 * known    stable enough to count as known
 */
export type Status = 'pool' | 'new' | 'learning' | 'known';

export interface Word {
  id?: number;
  /** Bare lemma without the article, e.g. "Apfel". */
  de: string;
  article?: Article;
  pos: Pos;
  en: string;
  plural?: string;
  example?: string;
  exampleEn?: string;
  /** Free note, e.g. verb forms: "er isst, aß, hat gegessen". */
  note?: string;
  topic?: string;
  batchId: number;
  status: Status;
  /** Unique per (pos, lowercase lemma). Used to skip duplicates. */
  dedupeKey: string;
  addedAt: number;
  introducedAt?: number;
  /** Next review time in ms since epoch. */
  due?: number;
  /** Scheduler state, filled in after the first review. */
  fsrs?: StoredCard;
}

/** A ts-fsrs card with dates stored as milliseconds, so it survives JSON. */
export interface StoredCard {
  due: number;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  /** ts-fsrs State: 0 new, 1 learning, 2 review, 3 relearning. */
  state: number;
  lastReview?: number;
}

export interface Batch {
  id?: number;
  name: string;
  source: 'pack' | 'paste' | 'csv';
  addedAt: number;
}

export type Rating = 'again' | 'good';

export interface Review {
  id?: number;
  wordId: number;
  at: number;
  rating: Rating;
  mode: 'study' | 'test';
  /** Extra practice after an "again" in the same session. Does not change the schedule. */
  retry?: boolean;
  /** Extra practice outside the schedule. Does not change the schedule. */
  practice?: boolean;
}

/** One row per local day with at least one finished review. */
export interface Session {
  /** Local day, YYYY-MM-DD. */
  day: string;
  cards: number;
}

/** A grammar topic the user marked as understood. */
export interface GrammarProgress {
  id: string;
  doneAt: number;
}

export interface Settings {
  /** How many pool words get introduced per day. */
  dailyNew: number;
  desiredRetention: number;
  /** A session counts toward the streak from this many cards. */
  streakMinCards: number;
  /** Most due reviews in one session. Anything beyond waits for the next session. */
  maxReviews: number;
  introDay: string;
  introducedToday: number;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyNew: 10,
  desiredRetention: 0.9,
  streakMinCards: 5,
  maxReviews: 50,
  introDay: '',
  introducedToday: 0,
};
