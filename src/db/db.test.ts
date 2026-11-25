import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type AppDB } from './index';
import { addBatch, introduceUpToQuota, type NewWord } from './words';
import { exportBackup, importBackup, parseBackup } from './backup';
import { getSettings, updateSettings } from './settings';
import { todayPlan } from '../lib/plan';
import { computeStreak } from '../lib/streak';
import { dayKey, prevDay } from '../lib/dates';
import { SAMPLE_PACK } from '../data/sample';

let db: AppDB;
let n = 0;

beforeEach(async () => {
  db = createDb(`test-${n++}`);
  await db.open();
});

const mk = (de: string, extra: Partial<NewWord> = {}): NewWord => ({
  de,
  pos: 'noun',
  en: de.toLowerCase(),
  ...extra,
});

const NOON = new Date(2026, 10, 24, 12, 0).getTime();

describe('addBatch', () => {
  it('adds words in order and introduces up to the daily limit', async () => {
    const words = Array.from({ length: 25 }, (_, i) => mk(`Wort${i}`));
    const res = await addBatch(db, { name: 'Test', source: 'pack' }, words, NOON);
    expect(res).toMatchObject({ added: 25, skipped: 0, introduced: 10 });

    const fresh = await db.words.where('status').equals('new').sortBy('id');
    expect(fresh.map((w) => w.de)).toEqual(words.slice(0, 10).map((w) => w.de));
    expect(await db.words.where('status').equals('pool').count()).toBe(15);
  });

  it('skips duplicates in the input and against existing words, ignoring case', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, [mk('Apfel'), mk('Brot')], NOON);
    const res = await addBatch(
      db,
      { name: 'B', source: 'paste' },
      [mk('apfel'), mk('Käse'), mk('Käse'), mk('Brot', { pos: 'verb' })],
      NOON,
    );
    expect(res.added).toBe(2); // Käse, and Brot as a verb is a different word
    expect(res.skipped).toBe(2);
    expect(await db.words.count()).toBe(4);
  });

  it('creates no batch when everything is a duplicate', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, [mk('Apfel')], NOON);
    const res = await addBatch(db, { name: 'B', source: 'pack' }, [mk('Apfel')], NOON);
    expect(res).toMatchObject({ batchId: null, added: 0, skipped: 1 });
    expect(await db.batches.count()).toBe(1);
  });

  it('ignores blank entries and trims whitespace', async () => {
    const res = await addBatch(
      db,
      { name: 'A', source: 'paste' },
      [mk('  Apfel  ', { note: '   ' }), { de: '', pos: 'noun', en: 'x' }, { de: 'Brot', pos: 'noun', en: '' }],
      NOON,
    );
    expect(res.added).toBe(1);
    const w = await db.words.toCollection().first();
    expect(w?.de).toBe('Apfel');
    expect(w?.note).toBeUndefined();
  });

  it('loads the sample pack without duplicate keys', async () => {
    const res = await addBatch(db, { name: 'Food & drink', source: 'pack' }, SAMPLE_PACK, NOON);
    expect(res.skipped).toBe(0);
    expect(res.added).toBe(SAMPLE_PACK.length);
    const nouns = SAMPLE_PACK.filter((w) => w.pos === 'noun');
    expect(nouns.every((w) => w.article)).toBe(true);
  });
});

describe('introduceUpToQuota', () => {
  it('stops at the daily limit and resumes the next day', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, Array.from({ length: 30 }, (_, i) => mk(`W${i}`)), NOON);
    expect(await introduceUpToQuota(db, NOON)).toBe(0); // quota already used by addBatch

    const tomorrow = NOON + 24 * 3600 * 1000;
    expect(await introduceUpToQuota(db, tomorrow)).toBe(10);
    expect(await introduceUpToQuota(db, tomorrow)).toBe(0);
    expect(await db.words.where('status').equals('pool').count()).toBe(10);
  });

  it('respects a changed daily limit', async () => {
    await updateSettings(db, { dailyNew: 3 });
    const res = await addBatch(db, { name: 'A', source: 'pack' }, Array.from({ length: 8 }, (_, i) => mk(`W${i}`)), NOON);
    expect(res.introduced).toBe(3);
    expect((await getSettings(db)).introducedToday).toBe(3);
  });
});

describe('todayPlan', () => {
  it('counts due reviews, new words and minutes', async () => {
    await addBatch(db, { name: 'Food', source: 'pack' }, Array.from({ length: 12 }, (_, i) => mk(`W${i}`)), NOON);
    const reviewed = await db.words.where('status').equals('new').limit(4).primaryKeys();
    for (const id of reviewed) await db.words.update(id, { status: 'learning', due: NOON - 1000 });
    await db.words.update(reviewed[0], { due: NOON + 60_000 }); // not due yet

    const plan = await todayPlan(db, NOON);
    expect(plan).toMatchObject({ due: 3, newCount: 6, waiting: 2, total: 9, totalWords: 12, newFromBatch: 'Food' });
    expect(plan.minutes).toBe(2); // 9 cards * 15s = 135s
  });

  it('is empty on a fresh database', async () => {
    const plan = await todayPlan(db, NOON);
    expect(plan).toMatchObject({ due: 0, newCount: 0, total: 0, minutes: 0, totalWords: 0 });
  });
});

describe('streak', () => {
  const today = '2026-11-24';
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-11-24', '2026-11-23', '2026-11-22'], today)).toBe(3);
  });
  it('stays alive when today is not done yet', () => {
    expect(computeStreak(['2026-11-23', '2026-11-22'], today)).toBe(2);
  });
  it('breaks after a missed day', () => {
    expect(computeStreak(['2026-11-22', '2026-11-21'], today)).toBe(0);
    expect(computeStreak(['2026-11-24', '2026-11-22'], today)).toBe(1);
  });
  it('handles month and year boundaries', () => {
    expect(prevDay('2026-03-01')).toBe('2026-02-28');
    expect(prevDay('2027-01-01')).toBe('2026-12-31');
    expect(dayKey(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
  });
});

describe('backup', () => {
  it('round-trips everything', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, SAMPLE_PACK.slice(0, 15), NOON);
    await db.sessions.put({ day: '2026-11-24', cards: 7 });
    await db.reviews.add({ wordId: 1, at: NOON, rating: 'good', mode: 'study' });
    const backup = await exportBackup(db, NOON);

    const other = createDb(`test-${n++}`);
    await other.open();
    await addBatch(other, { name: 'Old', source: 'paste' }, [mk('Weg')], NOON);
    await importBackup(other, parseBackup(JSON.stringify(backup)));

    expect(await other.words.count()).toBe(15);
    expect(await other.batches.count()).toBe(1);
    expect(await other.sessions.get('2026-11-24')).toEqual({ day: '2026-11-24', cards: 7 });
    expect((await getSettings(other)).introducedToday).toBe(10);
    expect(await other.words.where('dedupeKey').equals('noun|weg').count()).toBe(0);
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('nope')).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"app":"other"}')).toThrow(/not a backup/);
    expect(() => parseBackup('{"app":"deutsch","version":2}')).toThrow(/not supported/);
    expect(() => parseBackup('{"app":"deutsch","version":1}')).toThrow(/missing "words"/);
  });

  it('keeps existing data when an import fails halfway', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, [mk('Apfel')], NOON);
    const backup = await exportBackup(db, NOON);
    backup.words.push({ ...backup.words[0] }); // same id and dedupeKey twice
    await expect(importBackup(db, backup)).rejects.toThrow();
    expect(await db.words.count()).toBe(1);
  });
});
