// Prompt: create_new_law
// קלט: 2+ חוקים קיימים
// פלט: חוק חדש שנוצר מהצומת הבין-תחומי

import { Law } from '../../data/laws';

export function buildCreateLawPrompt(parentLaws: Law[]): string {
  const lawsText = parentLaws.map(law =>
    `שם: ${law.name}
הגדרה: ${law.definition}
מנגנון: ${law.mechanism}
תחומים: ${law.domain.join(', ')}`
  ).join('\n\n---\n\n');

  return `אתה חוקר בין-תחומי שמתמחה בזיהוי דפוסים עמוקים בחוקי הטבע והחברה.

להלן ${parentLaws.length} חוקי התנהגות קיימים:
${lawsText}

משימתך: גלה ונסח חוק חדש שנוצר מהצומת בין החוקים האלה.
החוק החדש צריך לחשוף משהו שאינו ניתן לראות מכל חוק בנפרד.

החזר JSON בלבד:
{
  "name": "שם החוק החדש בעברית",
  "name_en": "English name",
  "definition": "הגדרה מדויקת ותמציתית",
  "mechanism": "המנגנון שמאחד את שני ההורים",
  "examples": [
    {"domain": "ביולוגיה", "description": "דוגמה"},
    {"domain": "חברה", "description": "דוגמה"},
    {"domain": "עיר", "description": "דוגמה"}
  ],
  "why_novel": "מה החוק החדש מגלה שההורים לא גילו",
  "domain": ["תחום1", "תחום2"],
  "tags": ["תג1", "תג2", "תג3"]
}`;
}

export interface CreateLawResult {
  name: string;
  name_en: string;
  definition: string;
  mechanism: string;
  examples: Array<{ domain: string; description: string }>;
  why_novel: string;
  domain: string[];
  tags: string[];
}
