import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type AppDB } from '../db';
import { addBatch, type NewWord } from '../db/words';
import { recordReview } from '../db/review';
import { updateSettings } from '../db/settings';
import { KNOWN_STABILITY_DAYS, schedule } from './scheduler';
import { buildPracticeQueue, buildQueue, practiceCounts, requeueAfter } from './queue';
import { todayPlan } from './plan';
import { streakInfo } from './streak';
import { dayKey, daysBetween } from './dates';

const DAY = 86_400_000;
const NOON = new Date(2026, 10, 24, 12, 0).getTime();
let db: AppDB;
let n = 0;
beforeEach(async () => {
  db = createDb(`study-test-${n++}`);
  await db.open();
});
const mk = (de: string): NewWord => ({ de, pos: 'noun', en: de.toLowerCase() });
const many = (count: number) => Array.from({ length: count }, (_, i) => mk(`W${i}`));

describe('scheduler', () => {
  it('schedules a first "good" at least a day out and marks the word learning', () => {
    const s = schedule(undefined, 'good', NOON, 0.9, false);
    expect(s.status).toBe('learning');
    expect(s.due).toBeGreaterThanOrEqual(NOON + DAY);
    expect(s.fsrs.reps).toBe(1);
  });

  it('brings a wrong answer back sooner than a right one', () => {
    const again = schedule(undefined, 'again', NOON, 0.9, false);
    const good = schedule(undefined, 'good', NOON, 0.9, false);
    expect(again.due).toBeLessThan(good.due);
    expect(again.status).toBe('learning');
    expect(again.due).toBeGreaterThan(NOON);
  });

  it('lets intervals grow with repeated success and eventually marks the word known', () => {
    let now = NOON;
    let s = schedule(undefined, 'good', now, 0.9, false);
    let gap = s.due - now;
    let becameKnown = false;
    for (let i = 0; i < 12 && !becameKnown; i += 1) {
      now = s.due;
      s = schedule(s.fsrs, 'good', now, 0.9, false);
      expect(s.due - now).toBeGreaterThanOrEqual(gap); // never shrinks while you keep getting it right
      gap = s.due - now;
      becameKnown = s.status === 'known';
    }
    expect(becameKnown).toBe(true);
    expect(s.fsrs.stability).toBeGreaterThanOrEqual(KNOWN_STABILITY_DAYS);
  });

  it('sends a known word back to learning after a miss', () => {
    let now = NOON;
    let s = schedule(undefined, 'good', now, 0.9, false);
    while (s.status !== 'known') {
      now = s.due;
      s = schedule(s.fsrs, 'good', now, 0.9, false);
    }
    const missed = schedule(s.fsrs, 'again', s.due, 0.9, false);
    expect(missed.status).toBe('learning');
    expect(missed.fsrs.lapses).toBe(1);
  });

  it('keeps stored state JSON-safe', () => {
    const s = schedule(undefined, 'good', NOON, 0.9, false);
    expect(JSON.parse(JSON.stringify(s.fsrs))).toEqual(s.fsrs);
  });
});

describe('recordReview', () => {
  it('updates the word, logs the review and counts the session card', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, many(3), NOON);
    const [first] = await db.words.toArray();
    const word = await recordReview(db, first.id!, 'good', { now: NOON, fuzz: false });
    expect(word?.status).toBe('learning');

    const stored = await db.words.get(first.id!);
    expect(stored?.fsrs?.reps).toBe(1);
    expect(stored?.due).toBeGreaterThanOrEqual(NOON + DAY);
    expect(await db.reviews.count()).toBe(1);
    expect(await db.sessions.get(dayKey(NOON))).toEqual({ day: dayKey(NOON), cards: 1 });
  });

  it('logs a retry without touching the schedule or the session count', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, many(1), NOON);
    const [w] = await db.words.toArray();
    await recordReview(db, w.id!, 'again', { now: NOON, fuzz: false });
    const before = await db.words.get(w.id!);
    await recordReview(db, w.id!, 'good', { now: NOON + 60_000, retry: true });

    const after = await db.words.get(w.id!);
    expect(after?.fsrs).toEqual(before?.fsrs);
    expect(after?.due).toBe(before?.due);
    expect((await db.sessions.get(dayKey(NOON)))?.cards).toBe(1);
    const reviews = await db.reviews.toArray();
    expect(reviews).toHaveLength(2);
    expect(reviews[1].retry).toBe(true);
  });

  it('returns undefined for a word that does not exist', async () => {
    expect(await recordReview(db, 999, 'good', { now: NOON })).toBeUndefined();
    expect(await db.reviews.count()).toBe(0);
  });
});

describe('buildQueue and plan', () => {
  it('puts due reviews first, oldest due first, then new words', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, many(10), NOON);
    const ids = (await db.words.orderBy('id').primaryKeys()) as number[];
    await db.words.update(ids[0], { status: 'learning', due: NOON - 1000 });
    await db.words.update(ids[1], { status: 'known', due: NOON - 5000 });
    await db.words.update(ids[2], { status: 'learning', due: NOON + DAY }); // not due

    const q = await buildQueue(db, NOON);
    expect(q.ids.slice(0, 2)).toEqual([ids[1], ids[0]]);
    expect(q.reviewCount).toBe(2);
    expect(q.newCount).toBe(7);
    expect(q.ids).toHaveLength(9);
    expect(q.ids).not.toContain(ids[2]);
  });

  it('caps reviews per session and says how many are over', async () => {
    await updateSettings(db, { maxReviews: 3, dailyNew: 0 });
    await addBatch(db, { name: 'A', source: 'pack' }, many(8), NOON);
    for (const id of (await db.words.toCollection().primaryKeys()) as number[]) {
      await db.words.update(id, { status: 'learning', due: NOON - id });
    }
    const q = await buildQueue(db, NOON);
    expect(q).toMatchObject({ reviewCount: 3, dueTotal: 8, newCount: 0 });
    const plan = await todayPlan(db, NOON);
    expect(plan).toMatchObject({ due: 3, dueTotal: 8, total: 3 });
  });

  it('re-inserts a missed word a few cards later, or last when the queue is short', () => {
    expect(requeueAfter([2, 3, 4, 5, 6], 1)).toEqual([2, 3, 4, 1, 5, 6]);
    expect(requeueAfter([2, 3], 1)).toEqual([2, 3, 1]);
    expect(requeueAfter([], 1)).toEqual([1]);
  });
});

describe('streak freezes', () => {
  const today = '2026-11-24';
  it('covers one missed day between two studied days', () => {
    const info = streakInfo(['2026-11-24', '2026-11-22', '2026-11-21'], today);
    expect(info).toEqual({ count: 3, frozenDays: ['2026-11-23'] });
  });

  it('covers yesterday when today is not done yet', () => {
    const info = streakInfo(['2026-11-23', '2026-11-21', '2026-11-20'], today);
    // today pending, 11-22 missed and frozen
    expect(info.count).toBe(3);
    expect(info.frozenDays).toEqual(['2026-11-22']);
  });

  it('allows only one freeze per 7 days', () => {
    // missed 11-23 and 11-21, studied everything else: second gap is within 7 days
    const info = streakInfo(['2026-11-24', '2026-11-22', '2026-11-20', '2026-11-19'], today);
    expect(info.frozenDays).toEqual(['2026-11-23']);
    expect(info.count).toBe(2);
  });

  it('allows a second freeze a week later', () => {
    const days = ['2026-11-24', '2026-11-22', '2026-11-21', '2026-11-20', '2026-11-19', '2026-11-18', '2026-11-17', '2026-11-16', '2026-11-14'];
    const info = streakInfo(days, today);
    expect(info.frozenDays).toEqual(['2026-11-23', '2026-11-15']);
    expect(info.count).toBe(days.length);
  });

  it('never bridges two missed days', () => {
    expect(streakInfo(['2026-11-24', '2026-11-21'], today).count).toBe(1);
    expect(streakInfo([], today)).toEqual({ count: 0, frozenDays: [] });
  });

  it('measures days across month ends', () => {
    expect(daysBetween('2026-11-28', '2026-12-02')).toBe(4);
    expect(daysBetween('2026-12-02', '2026-11-28')).toBe(-4);
  });
});

describe('practice', () => {
  async function setup() {
    await addBatch(db, { name: 'A', source: 'pack' }, many(30), NOON);
    const ids = (await db.words.orderBy('id').primaryKeys()) as number[];
    // ids[0] is started and not due for days
    await recordReview(db, ids[0], 'good', { now: NOON, fuzz: false });
    return ids;
  }

  it('leaves the schedule alone for a started word that is not due', async () => {
    const ids = await setup();
    const before = await db.words.get(ids[0]);
    await recordReview(db, ids[0], 'again', { practice: true, now: NOON + 3600_000, fuzz: false });
    const after = await db.words.get(ids[0]);
    expect(after?.fsrs).toEqual(before?.fsrs);
    expect(after?.status).toBe(before?.status);
    const last = (await db.reviews.toArray()).pop()!;
    expect(last.practice).toBe(true);
    expect((await db.sessions.get(dayKey(NOON)))?.cards).toBe(2); // practice still counts for the streak
  });

  it('schedules a word that is due, even in practice', async () => {
    const ids = await setup();
    const w = await db.words.get(ids[0]);
    await recordReview(db, ids[0], 'good', { practice: true, now: w!.due!, fuzz: false });
    expect((await db.words.get(ids[0]))?.fsrs?.reps).toBe(2);
  });

  it('starts a queued word for real ("learn new words now")', async () => {
    const ids = await setup();
    const queued = ids[20];
    expect((await db.words.get(queued))?.status).toBe('pool');
    await recordReview(db, queued, 'good', { practice: true, now: NOON, fuzz: false });
    const w = await db.words.get(queued);
    expect(w?.status).toBe('learning');
    expect(w?.introducedAt).toBe(NOON);
    expect(w?.due).toBeGreaterThan(NOON);
  });

  it('builds rounds from the right words', async () => {
    const ids = await setup();
    await recordReview(db, ids[1], 'again', { now: NOON, fuzz: false });
    const fixed = () => 0.5;

    const weak = await buildPracticeQueue(db, { kind: 'weak' }, 'all', fixed);
    expect(weak.sort()).toEqual([ids[0], ids[1]].sort());

    const all = await buildPracticeQueue(db, { kind: 'all' }, 'all', fixed);
    expect(all).toHaveLength(10); // 10 released today, queue excluded
    expect(await buildPracticeQueue(db, { kind: 'all' }, 10, fixed)).toHaveLength(10);

    const fresh = await buildPracticeQueue(db, { kind: 'new' }, 20, fixed);
    // today's 8 unstarted new words first, then the queue in pack order
    expect(fresh).toHaveLength(20);
    expect(fresh.slice(0, 8)).toEqual(ids.slice(2, 10));
    expect(fresh[8]).toBe(ids[10]);

    const batch = await buildPracticeQueue(db, { kind: 'batch', batchId: 1 }, 'all', fixed);
    expect(batch).toHaveLength(10);
  });

  it('counts what can be practised', async () => {
    await setup();
    const c = await practiceCounts(db);
    expect(c).toMatchObject({ weak: 1, practisable: 10, notStarted: 29 });
    expect(c.batches).toEqual([{ id: 1, name: 'A', count: 10 }]);
  });
});
