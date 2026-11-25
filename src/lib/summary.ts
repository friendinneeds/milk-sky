import type { AppDB } from '../db';

export interface BatchSummary {
  total: number;
  nouns: { total: number; der: number; die: number; das: number };
  verbs: number;
  adjectives: number;
  other: number;
  topics: { name: string; count: number }[];
}

/** How a batch sorted: by part of speech, noun gender and topic. */
export async function summarizeBatch(db: AppDB, batchId: number): Promise<BatchSummary> {
  const words = await db.words.where('batchId').equals(batchId).toArray();
  const s: BatchSummary = {
    total: words.length,
    nouns: { total: 0, der: 0, die: 0, das: 0 },
    verbs: 0,
    adjectives: 0,
    other: 0,
    topics: [],
  };
  const topics = new Map<string, number>();
  for (const w of words) {
    if (w.pos === 'noun') {
      s.nouns.total += 1;
      if (w.article) s.nouns[w.article] += 1;
    } else if (w.pos === 'verb') s.verbs += 1;
    else if (w.pos === 'adjective') s.adjectives += 1;
    else s.other += 1;
    if (w.topic) topics.set(w.topic, (topics.get(w.topic) ?? 0) + 1);
  }
  s.topics = [...topics].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  return s;
}
