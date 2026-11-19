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

export function createNewLaw(parents: Law[]): Promise<CreateLawResult> {
  return call<CreateLawResult>({ mode: 'create', laws: parents.map(brief) });
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
