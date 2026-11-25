import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDb, type AppDB } from '../db';
import { addBatch, dedupeKey, unseen } from '../db/words';
import { exportBackup, importBackup, parseBackup } from '../db/backup';
import { summarizeBatch } from '../lib/summary';
import { MY_WORDS } from './myWords';
import { GRAMMAR } from './grammar';
import { PACKS } from './packs';

let db: AppDB;
let n = 0;
beforeEach(async () => {
  db = createDb(`data-test-${n++}`);
  await db.open();
});

const NOON = new Date(2026, 10, 24, 12, 0).getTime();

describe('my words pack', () => {
  it('has the 71 words from the PDF, with no duplicates', () => {
    expect(MY_WORDS).toHaveLength(71);
    const keys = MY_WORDS.map(dedupeKey);
    expect(new Set(keys).size).toBe(71);
  });

  it('gives every noun an article and no other word one', () => {
    for (const w of MY_WORDS) {
      if (w.pos === 'noun') expect(w.article, w.de).toBeDefined();
      else expect(w.article, w.de).toBeUndefined();
    }
  });

  it('keeps the corrections to the PDF', () => {
    const paar = MY_WORDS.find((w) => w.de === 'ein paar')!;
    expect(paar.en).toMatch(/a few/);
    expect(paar.en).not.toMatch(/pair/);
    expect(MY_WORDS.filter((w) => w.de === 'Muster')).toHaveLength(1);
    expect(MY_WORDS.find((w) => w.de === 'Muster')!.article).toBe('das');
    const schere = MY_WORDS.find((w) => w.de === 'Schere')!;
    expect(schere.plural).toBe('Scheren');
    expect(schere.note).not.toMatch(/always plural/i);
  });

  it('sorts as expected', async () => {
    const res = await addBatch(db, { name: 'My words', source: 'pack' }, MY_WORDS, NOON);
    expect(res).toMatchObject({ added: 71, skipped: 0, introduced: 10 });
    const s = await summarizeBatch(db, res.batchId!);
    expect(s.total).toBe(71);
    expect(s.nouns.der + s.nouns.die + s.nouns.das).toBe(s.nouns.total);
    expect(s.nouns.total + s.verbs + s.adjectives + s.other).toBe(71);
    expect(s.topics).toEqual([]);
  });
});

describe('unseen', () => {
  it('returns only words not yet in the library, in order', async () => {
    const first = MY_WORDS.slice(0, 20);
    await addBatch(db, { name: 'A', source: 'pack' }, first, NOON);
    const rest = await unseen(db, MY_WORDS);
    expect(rest).toHaveLength(51);
    expect(rest[0].de).toBe(MY_WORDS[20].de);
  });

  it('is empty once everything was added', async () => {
    await addBatch(db, { name: 'A', source: 'pack' }, MY_WORDS, NOON);
    expect(await unseen(db, MY_WORDS)).toEqual([]);
  });
});

describe('packs', () => {
  it('have unique ids and names', () => {
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length);
    expect(new Set(PACKS.map((p) => p.name)).size).toBe(PACKS.length);
  });
});

describe('grammar content', () => {
  it('has the 14 topics with unique ids', () => {
    expect(GRAMMAR).toHaveLength(14);
    expect(new Set(GRAMMAR.map((t) => t.id)).size).toBe(14);
  });

  it('has text and examples for every topic', () => {
    for (const t of GRAMMAR) {
      expect(t.paragraphs.length, t.id).toBeGreaterThan(0);
      expect(t.examples.length, t.id).toBeGreaterThan(0);
      for (const e of t.examples) {
        expect(e.de, t.id).toBeTruthy();
        expect(e.en, t.id).toBeTruthy();
      }
      if (t.table) for (const row of t.table.rows) expect(row, t.id).toHaveLength(t.table.head.length);
    }
  });

  it('teaches the corrected participle rule', () => {
    const p = GRAMMAR.find((t) => t.id === 'participle')!;
    const text = p.paragraphs.join(' ');
    expect(text).toMatch(/-ieren/);
    expect(text).toMatch(/No ge-/);
    expect(text).not.toMatch(/-en for -ieren/);
  });
});

describe('grammar progress and backup', () => {
  it('is saved in backups and restored', async () => {
    await db.grammar.put({ id: 'gender', doneAt: NOON });
    const backup = await exportBackup(db, NOON);
    expect(backup.grammar).toEqual([{ id: 'gender', doneAt: NOON }]);

    const other = createDb(`data-test-${n++}`);
    await other.open();
    await importBackup(other, parseBackup(JSON.stringify(backup)));
    expect(await other.grammar.get('gender')).toEqual({ id: 'gender', doneAt: NOON });
  });

  it('still reads backups made before grammar existed', async () => {
    await db.grammar.put({ id: 'gender', doneAt: NOON });
    const old = await exportBackup(db, NOON);
    delete old.grammar;
    await importBackup(db, parseBackup(JSON.stringify(old)));
    expect(await db.grammar.count()).toBe(0);
  });

  it('upgrades a version-1 database without losing words', async () => {
    const name = `data-test-${n++}`;
    const { default: Dexie } = await import('dexie');
    const v1 = new Dexie(name);
    v1.version(1).stores({
      words: '++id, &dedupeKey, batchId, status, due, pos, topic',
      batches: '++id, addedAt',
      reviews: '++id, wordId, at',
      sessions: 'day',
      settings: 'key',
    });
    await v1.open();
    await v1.table('words').add({ de: 'Apfel', pos: 'noun', en: 'apple', batchId: 1, status: 'pool', dedupeKey: 'noun|apfel', addedAt: 1 });
    v1.close();

    const upgraded = createDb(name);
    await upgraded.open();
    expect(await upgraded.words.count()).toBe(1);
    expect(await upgraded.grammar.count()).toBe(0);
  });
});

describe('B1 verbs pack', () => {
  it('has 68 verbs, no duplicates, each with forms and an example', async () => {
    const { B1_VERBS } = await import('./b1Verbs');
    expect(B1_VERBS).toHaveLength(68);
    expect(new Set(B1_VERBS.map(dedupeKey)).size).toBe(68);
    for (const v of B1_VERBS) {
      expect(v.pos, v.de).toBe('verb');
      expect(v.note, v.de).toMatch(/(hat|ist) /);
      expect(v.example, v.de).toMatch(/[.!?]$/);
      expect(v.exampleEn, v.de).toBeTruthy();
      expect(v.topic, v.de).toBeTruthy();
    }
  });

  it('sorts into the expected groups', async () => {
    const { B1_VERBS } = await import('./b1Verbs');
    const topic = (de: string) => B1_VERBS.find((v) => v.de === de)!.topic;
    expect(topic('aufpassen auf')).toBe('With a preposition');
    expect(topic('sich beeilen')).toBe('Reflexive');
    expect(topic('ablehnen')).toBe('Separable');
    expect(topic('empfehlen')).toBe('Other verbs');
    expect(topic('vertrauen')).toBe('Other verbs');
  });

  it('adds alongside your own words without clashing', async () => {
    const { B1_VERBS } = await import('./b1Verbs');
    await addBatch(db, { name: 'My words', source: 'pack' }, MY_WORDS, NOON);
    expect(await unseen(db, B1_VERBS)).toHaveLength(68);
  });
});
