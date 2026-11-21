// "החוקים שלי": נשמרים בענן מיד, בלי שום התחברות (כלל ענת, 21.11.2026).
// העותק במכשיר מוצג מיד, ומה שלא הגיע לענן נשלח שוב בפתיחה הבאה.
import { useSyncExternalStore } from 'react';
import type { SavedLaw } from '../types';
import { fetchCloudLaws, upsertCloudLaw, deleteCloudLaw } from './supabase';

const KEY = 'chok-my-laws';
const listeners = new Set<() => void>();
let cache: SavedLaw[] = read();
const REMOVED_KEY = 'chok-my-laws-removed';

function read(): SavedLaw[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedLaw[];
  } catch {
    return [];
  }
}

function write(next: SavedLaw[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* אחסון מלא או חסום: נשאר בזיכרון */
  }
  listeners.forEach((l) => l());
}

export function newId(): string {
  return crypto.randomUUID();
}

export function useSavedLaws(): SavedLaw[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
  );
}

export function getSavedLaws(): SavedLaw[] {
  return cache;
}

function removedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REMOVED_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function setRemoved(ids: string[]) {
  try {
    localStorage.setItem(REMOVED_KEY, JSON.stringify(ids));
  } catch {
    /* אחסון חסום */
  }
}

function push(law: SavedLaw) {
  upsertCloudLaw(law)
    .then(() => write(cache.map((l) => (l.id === law.id ? { ...l, synced: true } : l))))
    .catch(() => undefined);
}

export function saveLaw(law: SavedLaw) {
  write([{ ...law, synced: false }, ...cache.filter((l) => l.id !== law.id)]);
  setRemoved(removedIds().filter((x) => x !== law.id));
  push(law);
}

export function removeLaw(id: string) {
  write(cache.filter((l) => l.id !== id));
  setRemoved([...new Set([...removedIds(), id])]);
  deleteCloudLaw(id)
    .then(() => setRemoved(removedIds().filter((x) => x !== id)))
    .catch(() => undefined);
}

export function isMarked(lawId: string): SavedLaw | undefined {
  return cache.find((l) => l.kind === 'marked' && l.parent_law_ids[0] === lawId);
}

// בכל פתיחה: שולחים שוב מחיקות ושמירות שלא הגיעו, ומושכים מהענן את כל החוקים.
export async function syncLaws() {
  try {
    const removed = removedIds();
    await Promise.all(removed.map((id) => deleteCloudLaw(id).then(() => id)))
      .then(() => setRemoved([]))
      .catch(() => undefined);
    await Promise.all(cache.filter((l) => !l.synced).map((l) => upsertCloudLaw(l).catch(() => undefined)));
    const cloud = await fetchCloudLaws();
    const gone = new Set(removedIds());
    const ids = new Set(cloud.map((l) => l.id));
    const local = cache.filter((l) => !ids.has(l.id) && !l.synced);
    write([...local, ...cloud.filter((l) => !gone.has(l.id))]);
  } catch {
    /* הענן לא זמין: ממשיכים עם מה שבמכשיר */
  }
}
