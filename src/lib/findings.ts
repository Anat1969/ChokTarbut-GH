// ממצאים: מידע שה-AI ייצר על חוק (קשרים מפתיעים, אפליקציות שמאמתות).
// נשמר בענן מיד, בלי כניסה, כדי שיופיע שוב בכניסה הבאה לעמוד, בכל מכשיר.
// עותק במכשיר מוצג מיד, ומה שלא הגיע לענן נשלח שוב בפתיחה הבאה.
import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';

export type FindingKind = 'correlations' | 'apps' | 'prompt';
type Store = Record<string, unknown>; // "מזהה חוק:סוג" אל הממצא האחרון

const LS_KEY = 'chok-findings';
const PENDING_KEY = 'chok-findings-pending';
const key = (lawId: string, kind: FindingKind) => `${lawId}:${kind}`;

let cache: Store = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function read<T>(k: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(k) ?? '') as T;
  } catch {
    return fallback;
  }
}
function write(k: string, value: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch {
    // אין אחסון במכשיר: הענן נשאר המקור
  }
}
function setPending(k: string, on: boolean) {
  const next = read<string[]>(PENDING_KEY, []).filter((x) => x !== k);
  if (on) next.push(k);
  write(PENDING_KEY, next);
}

async function send(k: string, data: unknown): Promise<void> {
  const [lawId, kind] = k.split(':');
  const { error } = await supabase.rpc('chok_finding_save', { p_law_id: lawId, p_kind: kind, p_data: data });
  if (error) throw new Error(error.message);
}

export function initFindings() {
  cache = read<Store>(LS_KEY, {});
  supabase
    .from('chok_findings')
    .select('law_id, kind, data')
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (error || !data) return; // הענן לא ענה: נשארים עם העותק במכשיר
      const cloud: Store = {};
      for (const row of data) cloud[`${row.law_id}:${row.kind}`] = row.data; // השורה האחרונה קובעת
      const pending = read<string[]>(PENDING_KEY, []).filter((k) => k in cache);
      cache = { ...cache, ...cloud, ...Object.fromEntries(pending.map((k) => [k, cache[k]])) };
      write(LS_KEY, cache);
      notify();
      for (const k of pending) {
        send(k, cache[k])
          .then(() => setPending(k, false))
          .catch(() => {});
      }
    });
}

// לכל ממצא נשמר גם מתי הוא נולד, כדי שאפשר יהיה להציג את המקור שלו
export function saveFinding(lawId: string, kind: FindingKind, found: object) {
  const k = key(lawId, kind);
  const data = { ...found, saved_at: new Date().toISOString() };
  cache = { ...cache, [k]: data };
  write(LS_KEY, cache);
  setPending(k, true);
  notify();
  send(k, data)
    .then(() => setPending(k, false))
    .catch(() => {});
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// הממצא האחרון שנשמר לחוק, או undefined אם עוד לא נוצר
export function useFinding<T>(lawId: string, kind: FindingKind): T | undefined {
  return useSyncExternalStore(subscribe, () => cache[key(lawId, kind)] as T | undefined);
}
