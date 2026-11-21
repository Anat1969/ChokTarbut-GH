/**
 * articles.ts — ניהול כתבות לחוקים
 * אחסון: localStorage ראשון, Supabase ב-background
 */

import { createClient } from '@supabase/supabase-js';

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
function getClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchCloud(): Promise<ArticleMap> {
  const sb = getClient();
  if (!sb) return {};
  const { data, error } = await sb
    .from('chok_articles')
    .select('law_id, text');
  if (error || !data) return {};
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

/** init: קרא מ-localStorage, אז עדכן מ-Supabase ב-background */
export function initArticles() {
  cache = readLS();
  fetchCloud().then((cloud) => {
    if (Object.keys(cloud).length === 0) return;
    // מיזוג: Supabase גובר על localStorage
    cache = { ...cache, ...cloud };
    writeLS(cache);
    notifyListeners();
  });
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
