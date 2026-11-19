// "החוקים שלי": נשמרים קודם במכשיר, ומסתנכרנים לענן כשענת מחוברת.
// כך שמירה עובדת תמיד, גם בלי כניסה וגם בלי רשת.
import { useSyncExternalStore } from 'react';
import type { SavedLaw } from '../types';
import { fetchCloudLaws, upsertCloudLaw, deleteCloudLaw } from './supabase';

const KEY = 'chok-my-laws';
const listeners = new Set<() => void>();
let cache: SavedLaw[] = read();
let userId: string | null = null;

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

export function saveLaw(law: SavedLaw) {
  write([{ ...law, synced: false }, ...cache.filter((l) => l.id !== law.id)]);
  if (userId) {
    const uid = userId;
    upsertCloudLaw(uid, law)
      .then(() => write(cache.map((l) => (l.id === law.id ? { ...l, synced: true } : l))))
      .catch(() => undefined);
  }
}

export function removeLaw(id: string) {
  write(cache.filter((l) => l.id !== id));
  if (userId) deleteCloudLaw(userId, id).catch(() => undefined);
}

export function isMarked(lawId: string): SavedLaw | undefined {
  return cache.find((l) => l.kind === 'marked' && l.parent_law_ids[0] === lawId);
}

// בכניסה: מעלים את מה שנשמר במכשיר, ומושכים את מה שנשמר בענן.
export async function connectUser(id: string | null) {
  userId = id;
  if (!id) return;
  try {
    const pending = cache.filter((l) => !l.synced);
    await Promise.all(pending.map((l) => upsertCloudLaw(id, l)));
    const cloud = await fetchCloudLaws(id);
    const ids = new Set(cloud.map((l) => l.id));
    write([...cloud, ...cache.filter((l) => !ids.has(l.id)).map((l) => ({ ...l, synced: false }))]);
  } catch {
    /* הענן לא זמין: ממשיכים עם מה שבמכשיר */
  }
}
