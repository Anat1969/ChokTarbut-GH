// תיקים: כל הסבר של תופעה יכול להיצמד לחוק, כמו תקדים.
// נשמרים קודם במכשיר, ומסתנכרנים לענן כשענת מחוברת, כמו "החוקים שלי".
// חוזק הראיות מהשטח נגזר מהתיקים, ולא נכתב ביד.
import { useSyncExternalStore } from 'react';
import type { Case, Verdict } from '../types';
import { fetchCloudCases, upsertCloudCase, deleteCloudCase } from './supabase';

const KEY = 'chok-cases';
const listeners = new Set<() => void>();
let cache: Case[] = read();
let userId: string | null = null;

function read(): Case[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Case[];
  } catch {
    return [];
  }
}

function write(next: Case[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* אחסון מלא או חסום: נשאר בזיכרון */
  }
  listeners.forEach((l) => l());
}

export function useCases(): Case[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
  );
}

export const casesOf = (all: Case[], lawId: string) => all.filter((c) => c.law_id === lawId);

// סיכום לחוק אחד: כמה פעמים הופעל, וכמה פעמים הובחן
export function tally(all: Case[], lawId: string) {
  const mine = casesOf(all, lawId);
  const applied = mine.filter((c) => c.verdict === 'applied').length;
  return { total: mine.length, applied, distinguished: mine.length - applied };
}

// תיק אחד לכל חוק ותופעה: לחיצה חוזרת מעדכנת את ההכרעה ולא מכפילה
export function fileCase(input: { law_id: string; phenomenon: string; verdict: Verdict; decision?: string }): Case {
  const phenomenon = input.phenomenon.trim().slice(0, 600);
  const decision = input.decision?.trim().slice(0, 600) || undefined;
  const prev = cache.find((c) => c.law_id === input.law_id && c.phenomenon === phenomenon);
  const next: Case = {
    id: prev?.id ?? crypto.randomUUID(),
    law_id: input.law_id,
    phenomenon,
    verdict: input.verdict,
    decision: decision ?? prev?.decision,
    created_at: prev?.created_at ?? new Date().toISOString(),
    synced: false,
  };
  write([next, ...cache.filter((c) => c.id !== next.id)]);
  if (userId) {
    const uid = userId;
    upsertCloudCase(uid, next)
      .then(() => write(cache.map((c) => (c.id === next.id ? { ...c, synced: true } : c))))
      .catch(() => undefined);
  }
  return next;
}

export function findCase(lawId: string, phenomenon: string): Case | undefined {
  return cache.find((c) => c.law_id === lawId && c.phenomenon === phenomenon.trim());
}

export function removeCase(id: string) {
  write(cache.filter((c) => c.id !== id));
  if (userId) deleteCloudCase(userId, id).catch(() => undefined);
}

// בכניסה: מעלים את מה שנשמר במכשיר, ומושכים את מה שנשמר בענן
export async function connectCases(id: string | null) {
  userId = id;
  if (!id) return;
  try {
    const pending = cache.filter((c) => !c.synced);
    await Promise.all(pending.map((c) => upsertCloudCase(id, c)));
    const cloud = await fetchCloudCases(id);
    const ids = new Set(cloud.map((c) => c.id));
    write([...cloud, ...cache.filter((c) => !ids.has(c.id)).map((c) => ({ ...c, synced: false }))]);
  } catch {
    /* הענן לא זמין, או שהטבלה עוד לא קיימת: ממשיכים עם מה שבמכשיר */
  }
}
