// תיקים: כל הסבר של תופעה יכול להיצמד לחוק, כמו תקדים.
// כל תיק נשמר בענן מיד, בלי התחברות (כלל ענת, 21.11.2026).
// העותק במכשיר מוצג מיד, ותיק שלא הגיע לענן נשלח שוב בכניסה הבאה.
// חוזק הראיות מהשטח נגזר מהתיקים, ולא נכתב ביד.
import { useSyncExternalStore } from 'react';
import type { Case, Verdict } from '../types';
import { fetchCloudCases, saveCloudCase, removeCloudCase } from './supabase';

const KEY = 'chok-cases';
const listeners = new Set<() => void>();
let cache: Case[] = read();
const REMOVED = 'chok-cases-removed'; // מחיקות שעוד לא הגיעו לענן

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
  push(next);
  return next;
}

export function findCase(lawId: string, phenomenon: string): Case | undefined {
  return cache.find((c) => c.law_id === lawId && c.phenomenon === phenomenon.trim());
}

function push(c: Case) {
  saveCloudCase(c)
    .then(() => write(cache.map((x) => (x.id === c.id ? { ...x, synced: true } : x))))
    .catch(() => undefined);
}

function removedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REMOVED) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function setRemoved(ids: string[]) {
  try {
    localStorage.setItem(REMOVED, JSON.stringify(ids));
  } catch {
    /* אחסון חסום */
  }
}

export function removeCase(id: string) {
  write(cache.filter((c) => c.id !== id));
  setRemoved([...removedIds(), id]);
  removeCloudCase(id)
    .then(() => setRemoved(removedIds().filter((x) => x !== id)))
    .catch(() => undefined);
}

// בפתיחת האפליקציה: שולחים מה שלא הגיע לענן, ומושכים את כל התיקים מהענן
export async function syncCases() {
  try {
    await Promise.all(removedIds().map((id) => removeCloudCase(id).then(() => setRemoved(removedIds().filter((x) => x !== id)))));
    await Promise.all(cache.filter((c) => !c.synced).map((c) => saveCloudCase(c)));
    const cloud = await fetchCloudCases();
    const ids = new Set(cloud.map((c) => c.id));
    const gone = new Set(removedIds());
    write([...cloud.filter((c) => !gone.has(c.id)), ...cache.filter((c) => !ids.has(c.id)).map((c) => ({ ...c, synced: false }))]);
  } catch {
    /* הענן לא זמין: ממשיכים עם מה שבמכשיר, וננסה שוב בפתיחה הבאה */
  }
}
