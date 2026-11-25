import type { AppDB } from './index';
import { DEFAULT_SETTINGS, type Settings } from './schema';

const KEY = 'app';

export async function getSettings(db: AppDB): Promise<Settings> {
  const row = await db.settings.get(KEY);
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function updateSettings(db: AppDB, patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings(db)), ...patch };
  await db.settings.put({ key: KEY, value: next });
  return next;
}
