import type { AppDB } from './index';
import { dayKey } from '../lib/dates';
import type { Article, Batch, Pos, Word } from './schema';
import { getSettings, updateSettings } from './settings';

/** A word as it arrives from a pack, a pasted list or a CSV file. */
export interface NewWord {
  de: string;
  article?: Article;
  pos: Pos;
  en: string;
  plural?: string;
  example?: string;
  exampleEn?: string;
  note?: string;
  topic?: string;
}

export interface AddBatchResult {
  batchId: number | null;
  added: number;
  skipped: number;
  introduced: number;
}

export function dedupeKey(w: Pick<NewWord, 'pos' | 'de'>): string {
  return `${w.pos}|${w.de.trim().toLowerCase()}`;
}

function clean(w: NewWord): NewWord {
  const out: NewWord = { ...w, de: w.de.trim(), en: w.en.trim() };
  for (const k of ['plural', 'example', 'exampleEn', 'note', 'topic'] as const) {
    const v = out[k]?.trim();
    if (v) out[k] = v;
    else delete out[k];
  }
  return out;
}

/**
 * Adds words to the pool. Words you already have (same part of speech and
 * spelling, ignoring case) are skipped, and so are repeats inside the input.
 * Input order is kept: it becomes the order words get introduced in.
 */
export async function addBatch(
  db: AppDB,
  meta: { name: string; source: Batch['source'] },
  input: NewWord[],
  now = Date.now(),
): Promise<AddBatchResult> {
  const seen = new Set<string>();
  const unique: NewWord[] = [];
  for (const raw of input) {
    const w = clean(raw);
    if (!w.de || !w.en) continue;
    const key = dedupeKey(w);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(w);
  }

  const existing = new Set(
    (await db.words.where('dedupeKey').anyOf([...seen]).keys()) as string[],
  );
  const fresh = unique.filter((w) => !existing.has(dedupeKey(w)));
  const skipped = input.length - fresh.length;

  if (fresh.length === 0) return { batchId: null, added: 0, skipped, introduced: 0 };

  const batchId = await db.transaction('rw', db.batches, db.words, async () => {
    const id = (await db.batches.add({ ...meta, addedAt: now })) as number;
    await db.words.bulkAdd(
      fresh.map((w): Word => ({
        ...w,
        batchId: id,
        status: 'pool',
        dedupeKey: dedupeKey(w),
        addedAt: now,
      })),
    );
    return id;
  });

  const introduced = await introduceUpToQuota(db, now);
  return { batchId, added: fresh.length, skipped, introduced };
}

/**
 * Moves words from the pool into today's queue, up to the daily limit.
 * Safe to call repeatedly: the day's counter lives in settings.
 */
export async function introduceUpToQuota(db: AppDB, now = Date.now()): Promise<number> {
  const settings = await getSettings(db);
  const day = dayKey(now);
  const introducedToday = settings.introDay === day ? settings.introducedToday : 0;
  const room = Math.max(0, settings.dailyNew - introducedToday);
  if (room === 0) return 0;

  const ids = (await db.words.where('status').equals('pool').limit(room).primaryKeys()) as number[];
  if (ids.length === 0) return 0;

  await db.transaction('rw', db.words, db.settings, async () => {
    for (const id of ids) {
      await db.words.update(id, { status: 'new', introducedAt: now, due: now });
    }
    await updateSettings(db, { introDay: day, introducedToday: introducedToday + ids.length });
  });
  return ids.length;
}
