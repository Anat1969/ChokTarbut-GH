/**
 * articles.ts — ניהול כתבות לחוקים
 * אחסון: localStorage ראשון, Supabase ב-background
 */

import { supabase } from './supabase';

const LS_KEY = 'chok-articles';
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

async function upsertCloud(lawId: string, text: string): Promise<void> {
  const sb = getClient();
  if (!sb) return;
  await sb.from('chok_articles').upsert(
    { law_id: lawId, text, updated_at: new Date().toISOString() },
    { onConflict: 'law_id' }
  );
}

// ── public API ───────────────────────────────────────────────

// מושך מהענן, ושולח לענן כתבה שנשמרה רק במכשיר.
function syncWithCloud(): void {
  fetchCloud().then((cloud) => {
    if (!cloud) return; // הענן לא ענה: לא נוגעים, ולא דורסים אותו בעותק מהמכשיר
    const localOnly = Object.entries(cache).filter(
      ([id, text]) => text.trim().length > 0 && !(id in cloud),
    );
    cache = { ...cache, ...cloud };
    writeLS(cache);
    notifyListeners();
    for (const [id, text] of localOnly) void upsertCloud(id, text);
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

export function getArticle(lawId: string): string {
  return cache[lawId] ?? '';
}

/** מחזיר את כל המפה — לשימוש בעמוד הכתבות */
export function getArticlesMap(): Record<string, string> {
  return cache;
}

/** שמירה: localStorage מיידי, Supabase ב-background */
export async function saveArticle(lawId: string, text: string): Promise<void> {
  cache = { ...cache, [lawId]: text };
  writeLS(cache);
  notifyListeners();
  await upsertCloud(lawId, text);
}

/** hook נוח */
export function useArticle(lawId: string): string {
  // שימוש ב-useSyncExternalStore — גרסה פשוטה (ללא React — להשתמש מה-component)
  return getArticle(lawId);
}
