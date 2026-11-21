/**
 * articles.ts — ניהול כתבות לחוקים
 * אחסון: localStorage ראשון, Supabase ב-background
 */

import { supabase } from './supabase';
import { SEED_ARTICLES } from '../data/articles';

const LS_KEY = 'chok-articles';
const PENDING_KEY = 'chok-articles-pending'; // חוקים שהכתבה שלהם עוד לא הגיעה לענן
type ArticleMap = Record<string, string>; // law_id → text

// ── cache in-memory ──────────────────────────────────────────
let cache: ArticleMap = {};
let listeners: Array<() => void> = [];

function notifyListeners() {
  for (const fn of listeners) fn();
}

// ── localStorage ─────────────────────────────────────────────
function readLS(): ArticleMap {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeLS(map: ArticleMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // quota exceeded — ignore
  }
}

function readPending(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setPending(lawId: string, on: boolean) {
  try {
    const next = readPending().filter((id) => id !== lawId);
    if (on) next.push(lawId);
    localStorage.setItem(PENDING_KEY, JSON.stringify(next));
  } catch {
    // אין אחסון במכשיר: מוותרים על הניסיון החוזר
  }
}

// ── Supabase ─────────────────────────────────────────────────
// הלקוח המשותף של האפליקציה. יש לו כתובת ומפתח ציבורי גם כשאין משתני סביבה ב-Vercel.
function getClient() {
  return supabase;
}

async function fetchCloud(): Promise<ArticleMap | null> {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('chok_articles')
    .select('law_id, text');
  if (error || !data) return null;
  return Object.fromEntries(data.map((r: { law_id: string; text: string }) => [r.law_id, r.text]));
}

// כתיבה רק דרך הפונקציה chok_article_save: היא בודקת חוק ואורך, ושומרת כל גרסה ביומן.
async function upsertCloud(lawId: string, text: string): Promise<void> {
  const sb = getClient();
  if (!sb) return;
  const { error } = await sb.rpc('chok_article_save', { p_law_id: lawId, p_text: text });
  if (error) throw new Error(error.message);
}

// ── public API ───────────────────────────────────────────────

// מושך מהענן, ושולח לענן כתבה שנשמרה רק במכשיר.
function syncWithCloud(): void {
  fetchCloud().then((cloud) => {
    if (!cloud) return; // הענן לא ענה: לא נוגעים, ולא דורסים אותו בעותק מהמכשיר
    const pending = readPending();
    // כתבה שמחכה לשליחה, וכתבה ישנה שנשמרה רק במכשיר לפני שהענן חובר
    const toSend = Object.entries(cache).filter(
      ([id, text]) => pending.includes(id) || (text.trim().length > 0 && !(id in cloud)),
    );
    cache = { ...cache, ...cloud, ...Object.fromEntries(toSend) };
    writeLS(cache);
    notifyListeners();
    for (const [id, text] of toSend) {
      upsertCloud(id, text)
        .then(() => setPending(id, false))
        .catch(() => {});
    }
  });
}

/** init: קרא מ-localStorage, אז עדכן מ-Supabase ב-background */
export function initArticles() {
  cache = readLS();
  syncWithCloud();
}

/** רענון מפורש מ-Supabase — לשימוש בעמוד הכתבות */
export function refreshFromCloud(): void {
  syncWithCloud();
}

/** לשימוש ב-useSyncExternalStore */
export function subscribeArticles(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// כתבה שנשמרה גוברת על כתבת המערכת. כתבה שרוקנו (טקסט ריק בענן) נשארת ריקה.
let merged: ArticleMap | null = null;
let mergedFrom: ArticleMap | null = null;

/** כל הכתבות: כתבות המערכת, ועליהן מה שנשמר במכשיר ובענן */
export function getArticlesMap(): Record<string, string> {
  if (mergedFrom !== cache || !merged) {
    merged = { ...SEED_ARTICLES, ...cache };
    mergedFrom = cache;
  }
  return merged;
}

export function getArticle(lawId: string): string {
  return getArticlesMap()[lawId] ?? '';
}

/** שמירה: במכשיר מיד, ובענן ברקע. אם הענן נכשל, הכתבה נשלחת שוב בפתיחה הבאה */
export async function saveArticle(lawId: string, text: string): Promise<'cloud' | 'local'> {
  cache = { ...cache, [lawId]: text };
  writeLS(cache);
  notifyListeners();
  setPending(lawId, true);
  try {
    await upsertCloud(lawId, text);
    setPending(lawId, false);
    return 'cloud';
  } catch {
    return 'local';
  }
}
