// שלושת מנועי ה-AI. כל הקריאות עוברות דרך פונקציית Edge (chok-ai),
// כך שמפתח ה-AI לא מגיע לדפדפן. ההנחיות למודל נמצאות בפונקציה עצמה.
import { supabase } from './supabase';
import { INITIAL_LAWS } from '../data/laws';
import type { Law, ExplainResult, CreateLawResult, CorrelationResult } from '../types';

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('chok-ai', { body });
  if (error) throw new Error(error.message);
  if (!data || data.error) throw new Error(data?.error ?? 'תשובה ריקה');
  return data as T;
}

const brief = (law: Law) => ({
  id: law.id,
  name: law.name,
  domain: law.domain,
  definition: law.definition,
  mechanism: law.mechanism,
});

export async function explainPhenomenon(phenomenon: string): Promise<ExplainResult> {
  const res = await call<ExplainResult>({ mode: 'explain', phenomenon });
  const known = new Set(INITIAL_LAWS.map((l) => l.id));
  const ids = (res.matched_law_ids ?? []).filter((id) => known.has(id));
  if (ids.length === 0) throw new Error('לא נמצא חוק מתאים');
  return {
    ...res,
    matched_law_ids: ids,
    per_law: (res.per_law ?? []).filter((p) => known.has(p.id)),
    additional_examples: res.additional_examples ?? [],
  };
}

// target: משבצת ריקה בטבלה שהחוק החדש אמור למלא (תחום ומשפחת מנגנון)
export function createNewLaw(parents: Law[], target?: { domain: string; family: string; rule: string }): Promise<CreateLawResult> {
  return call<CreateLawResult>({ mode: 'create', laws: parents.map(brief), target });
}

export function findCorrelations(law: Law): Promise<CorrelationResult> {
  return call<CorrelationResult>({
    mode: 'correlations',
    law: brief(law),
    known: law.correlations
      .map((id) => INITIAL_LAWS.find((l) => l.id === id)?.name)
      .filter(Boolean),
  });
}

// ---------- chok-plus: אימות באפליקציות אחרות, וניסוח אוטומטי ----------
async function plus<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('chok-plus', { body });
  if (error) throw new Error(error.message);
  if (!data || data.error) throw new Error(data?.error ?? 'תשובה ריקה');
  return data as T;
}

export interface AppEvidence {
  insight: string;
  picks: Array<{ id: string; title: string; url: string; proves: string; experiment: string }>;
}

// אילו אפליקציות מתיק האפליקציות של ענת יכולות לבדוק את החוק, ואיך
export function findApps(law: Law): Promise<AppEvidence> {
  return plus<AppEvidence>({ mode: 'apps', law: brief(law) });
}

export interface LawDraft {
  definition: string;
  mechanism: string;
  example: string;
  domains: string[];
  family: string;
}

// ניסוח אוטומטי של חוק משם בלבד
export function draftLaw(name: string, parents: string[]): Promise<LawDraft> {
  return plus<LawDraft>({ mode: 'draft', name, parents });
}
