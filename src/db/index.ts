import Dexie, { type EntityTable } from 'dexie';
import type { Batch, Review, Session, Word } from './schema';

export interface SettingsRow {
  key: string;
  value: unknown;
}

export type AppDB = Dexie & {
  words: EntityTable<Word, 'id'>;
  batches: EntityTable<Batch, 'id'>;
  reviews: EntityTable<Review, 'id'>;
  sessions: EntityTable<Session, 'day'>;
  settings: EntityTable<SettingsRow, 'key'>;
};

/**
 * Schema changes must be additive: add a new `version(n)` block, never edit
 * an old one, and never drop a table. Users may be offline on an old copy.
 */
export function createDb(name = 'deutsch'): AppDB {
  const db = new Dexie(name) as AppDB;
  db.version(1).stores({
    words: '++id, &dedupeKey, batchId, status, due, pos, topic',
    batches: '++id, addedAt',
    reviews: '++id, wordId, at',
    sessions: 'day',
    settings: 'key',
  });
  return db;
}

export const db = createDb();
