import type { AppDB } from '../db';
import { exportBackup, importBackup, parseBackup } from '../db/backup';
import { dayKey } from './dates';

/**
 * Saves a backup file. On phones this opens the share sheet (Files, iCloud,
 * AirDrop); elsewhere it downloads the file.
 */
export async function saveBackupFile(db: AppDB): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const backup = await exportBackup(db);
  const name = `deutsch-backup-${dayKey(Date.now())}.json`;
  const file = new File([JSON.stringify(backup)], name, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // fall through to a plain download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

export async function restoreBackupFile(db: AppDB, file: File): Promise<number> {
  const backup = parseBackup(await file.text());
  await importBackup(db, backup);
  return backup.words.length;
}
