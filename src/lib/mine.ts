// חוקים שענת ניסחה, כחוקים לכל דבר: בספרייה, ברשת הקשרים ובטבלה.
// הם לא נכנסים למאגר עצמו. הם מסומנים בצהוב־תובנה, והקשרים שלהם הם החוקים שמהם נולדו.
import { useMemo } from 'react';
import { INITIAL_LAWS, ALL_DOMAINS } from '../data/laws';
import { buildGraph, BASE_GRAPH, type Graph } from './graph';
import { useSavedLaws } from './store';
import type { Domain, Law, SavedLaw } from '../types';

export const MINE_COLOR = '#fde047'; // צהוב־תובנה, כמו --insight

export interface MineLaw extends Law {
  family?: string;
  parents: string[];
  created_at: string;
}

export function toLaw(s: SavedLaw): MineLaw {
  const domain = s.domain.filter((d): d is Domain => (ALL_DOMAINS as string[]).includes(d));
  return {
    id: s.id,
    name: s.name,
    name_en: s.name_en,
    domain: domain.length ? domain : ['תרבות'],
    definition: s.definition,
    mechanism: s.mechanism,
    examples: s.examples ?? [],
    evidence_strength: 1,
    correlations: s.parent_law_ids,
    source: `ניסחה ענת, ${new Date(s.created_at).toLocaleDateString('he-IL')}`,
    created_by: 'anat',
    tags: s.tags ?? [],
    family: s.family,
    parents: s.parent_law_ids,
    created_at: s.created_at,
  };
}

export function useMineLaws(): MineLaw[] {
  const saved = useSavedLaws();
  return useMemo(() => saved.filter((l) => l.kind === 'created').map(toLaw), [saved]);
}

export const isMine = (law: Law): law is MineLaw => law.created_by === 'anat';

// הרשת המלאה: המאגר, ועוד החוקים שענת ניסחה. בלי חוקים משלה, זו הרשת הקבועה.
export function useGraph(): Graph {
  const mine = useMineLaws();
  return useMemo(() => (mine.length ? buildGraph([...INITIAL_LAWS, ...mine]) : BASE_GRAPH), [mine]);
}
