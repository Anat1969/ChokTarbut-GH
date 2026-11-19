// התאמה מקומית של תופעה לחוקים, בלי רשת.
// נותנת תשובה מיידית, ומשמשת גיבוי כשה-AI לא זמין.
import { INITIAL_LAWS } from '../data/laws';
import type { Law } from '../types';

const STOP = new Set(
  'של על את עם זה זו זאת הוא היא הם הן אני אנחנו כל גם או אבל כי אם לא כן יש אין מה מי איך למה מדוע כמו רק עוד יותר פחות מאוד אחד אחת בין אל אלה היה היו להיות כך כש אשר'.split(' '),
);

// מסיר אותיות שימוש בתחילת מילה, כדי ש"בעיר" ו"העיר" יתאימו ל"עיר"
function stem(word: string): string {
  let w = word.replace(/[^א-תa-z0-9]/gi, '').toLowerCase();
  while (w.length > 3 && 'והבלמשכ'.includes(w[0])) w = w.slice(1);
  if (w.length > 4 && (w.endsWith('ים') || w.endsWith('ות'))) w = w.slice(0, -2);
  return w;
}

function tokens(text: string): string[] {
  return text
    .split(/[\s,.;:!?"'()\-–—/]+/)
    .map(stem)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

interface Indexed {
  law: Law;
  strong: Set<string>; // שם, תגיות ותחומים
  weak: Set<string>; // הגדרה, מנגנון ודוגמאות
}

const INDEX: Indexed[] = INITIAL_LAWS.map((law) => ({
  law,
  strong: new Set(tokens([law.name, ...law.tags, ...law.domain].join(' '))),
  weak: new Set(
    tokens([law.definition, law.mechanism, ...law.examples.map((e) => e.description)].join(' ')),
  ),
}));

export interface LocalMatch {
  law: Law;
  score: number;
  words: string[];
}

export function matchLaws(phenomenon: string, limit = 3): LocalMatch[] {
  const query = [...new Set(tokens(phenomenon))];
  if (query.length === 0) return [];
  return INDEX.map(({ law, strong, weak }) => {
    const words: string[] = [];
    let score = 0;
    for (const q of query) {
      if (strong.has(q)) {
        score += 3;
        words.push(q);
      } else if (weak.has(q)) {
        score += 1;
        words.push(q);
      }
    }
    return { law, score, words };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.law.evidence_strength - a.law.evidence_strength)
    .slice(0, limit);
}
