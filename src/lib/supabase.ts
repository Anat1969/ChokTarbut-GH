import { createClient } from '@supabase/supabase-js';
import type { Case, SavedLaw } from '../types';

// פרויקט Supabase המשותף של ענת. המפתח כאן הוא המפתח הציבורי (anon), שמותר לו להופיע בדפדפן.
// כל הטבלאות של האפליקציה נושאות את הקידומת chok_, ומוגנות ב-RLS.
const DEFAULT_URL = 'https://ktqmwpbzcnzkhjskqisy.supabase.co';
const DEFAULT_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0cW13cGJ6Y256a2hqc2txaXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODM4OTgsImV4cCI6MjEwNTc1OTg5OH0.uPKn4hrLk16jhDoajMjPl4OmV5j1b3bMIECVmOdhWGI';

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const anonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON;

export const supabase = createClient(SUPABASE_URL, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'chok-auth' },
});

// ---------- כניסה ----------

// בודק מול השרת אם כניסה עם Google מופעלת בפרויקט. אם לא, מוצגת כניסה באימייל וסיסמה.
export async function isGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: anonKey } });
    const data = await res.json();
    return Boolean(data?.external?.google);
  } catch {
    return false;
  }
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });
}

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

// ---------- ענן: החוקים שלי ----------
// בלי התחברות (כלל ענת, 21.11.2026): קריאה פתוחה, וכתיבה רק דרך שתי פונקציות במסד.

const T_MY_LAWS = 'chok_my_laws';
const T_EXPLANATIONS = 'chok_explanations';

export async function fetchCloudLaws(): Promise<SavedLaw[]> {
  const { data, error } = await supabase
    .from(T_MY_LAWS)
    .select('id, kind, name, name_en, domain, definition, mechanism, examples, tags, parent_law_ids, why_novel, family, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as SavedLaw),
    name_en: row.name_en ?? undefined,
    why_novel: row.why_novel ?? undefined,
    family: row.family ?? undefined,
    synced: true,
  }));
}

export async function upsertCloudLaw(law: SavedLaw): Promise<void> {
  const { synced: _synced, ...row } = law;
  const { error } = await supabase.rpc('chok_my_law_save', { p: row });
  if (error) throw error;
}

export async function deleteCloudLaw(id: string): Promise<void> {
  const { error } = await supabase.rpc('chok_my_law_remove', { p_id: id });
  if (error) throw error;
}

export async function saveCloudExplanation(
  userId: string,
  row: { phenomenon: string; matched_law_ids: string[]; explanation: string; insight: string },
): Promise<void> {
  await supabase.from(T_EXPLANATIONS).insert({ ...row, user_id: userId });
}

// ---------- ענן: תיקים ----------
// קריאה פתוחה, וכתיבה דרך שתי פונקציות במסד. בלי התחברות (כלל ענת, 21.11.2026).

export async function fetchCloudCases(): Promise<Case[]> {
  const { data, error } = await supabase
    .from('chok_field_cases')
    .select('id, law_id, phenomenon, verdict, decision, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...(row as Case), decision: row.decision ?? undefined, synced: true }));
}

export async function saveCloudCase(c: Case): Promise<void> {
  const { error } = await supabase.rpc('chok_case_save', {
    p_id: c.id,
    p_law_id: c.law_id,
    p_phenomenon: c.phenomenon,
    p_verdict: c.verdict,
    p_decision: c.decision ?? null,
    p_created_at: c.created_at,
  });
  if (error) throw error;
}

export async function removeCloudCase(id: string): Promise<void> {
  const { error } = await supabase.rpc('chok_case_remove', { p_id: id });
  if (error) throw error;
}
