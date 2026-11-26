// חוקים שענת ניסחה והכניסה למאגר: נקראים מ-chok_laws (created_by='anat') ונרשמים כחוקים לכל דבר.
// עותק במכשיר מוצג מיד, והענן מתעדכן בכל פתיחה. אחרי הרישום getLawById מוצא אותם, ול-FAMILY_OF יש את המשפחה שלהם.
import { useSyncExternalStore } from 'react';
import { registerPromoted } from '../data/laws';
import { FAMILY_OF, type FamilyId } from '../data/families';
import { fetchPromotedLaws, promoteCloudLaw } from './supabase';
import type { Law } from '../types';

const KEY = 'chok-promoted';
const listeners = new Set<() => void>();
let cache: Law[] = read();
apply(cache);

function read(): Law[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Law[];
  } catch {
    return [];
  }
}

function apply(laws: Law[]) {
  registerPromoted(laws);
  for (const l of laws) if (l.family && !FAMILY_OF[l.id]) FAMILY_OF[l.id] = l.family as FamilyId;
}

function write(next: Law[]) {
  cache = next;
  apply(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* אחסון חסום: נשאר בזיכרון */
  }
  listeners.forEach((l) => l());
}

export function subscribePromoted(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePromoted(): Law[] {
  return useSyncExternalStore(subscribePromoted, () => cache);
}

export async function syncPromoted() {
  try {
    write(await fetchPromotedLaws());
  } catch {
    /* הענן לא זמין: ממשיכים עם מה שבמכשיר */
  }
}

// הכנסה למאגר: פעולה אחת, לתמיד. אחריה החוק מקבל עמוד, כתבה, תמונה ותיקים.
export async function promoteLaw(id: string, family: string) {
  await promoteCloudLaw(id, family);
  await syncPromoted();
}
