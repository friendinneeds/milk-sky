import type { AppDB, SettingsRow } from './index';
import type { Batch, Review, Session, Word } from './schema';

export interface Backup {
  app: 'deutsch';
  version: 1;
  exportedAt: number;
  words: Word[];
  batches: Batch[];
  reviews: Review[];
  sessions: Session[];
  settings: SettingsRow[];
}

export async function exportBackup(db: AppDB, now = Date.now()): Promise<Backup> {
  const [words, batches, reviews, sessions, settings] = await Promise.all([
    db.words.toArray(),
    db.batches.toArray(),
    db.reviews.toArray(),
    db.sessions.toArray(),
    db.settings.toArray(),
  ]);
  return { app: 'deutsch', version: 1, exportedAt: now, words, batches, reviews, sessions, settings };
}

/** Parses and checks a backup file. Throws an Error with a readable message. */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const b = data as Partial<Backup> | null;
  if (!b || b.app !== 'deutsch') throw new Error('This is not a backup from this app.');
  if (b.version !== 1) throw new Error(`Backup version ${String(b.version)} is not supported.`);
  for (const key of ['words', 'batches', 'reviews', 'sessions', 'settings'] as const) {
    if (!Array.isArray(b[key])) throw new Error(`Backup is missing "${key}".`);
  }
  for (const w of b.words as Word[]) {
    if (typeof w.de !== 'string' || typeof w.en !== 'string' || typeof w.dedupeKey !== 'string') {
      throw new Error('Backup contains a damaged word entry.');
    }
  }
  return b as Backup;
}

/** Replaces everything on this device with the backup. All or nothing. */
export async function importBackup(db: AppDB, backup: Backup): Promise<void> {
  await db.transaction(
    'rw',
    [db.words, db.batches, db.reviews, db.sessions, db.settings],
    async () => {
      await Promise.all([
        db.words.clear(),
        db.batches.clear(),
        db.reviews.clear(),
        db.sessions.clear(),
        db.settings.clear(),
      ]);
      await db.batches.bulkAdd(backup.batches);
      await db.words.bulkAdd(backup.words);
      await db.reviews.bulkAdd(backup.reviews);
      await db.sessions.bulkAdd(backup.sessions);
      await db.settings.bulkAdd(backup.settings);
    },
  );
}
