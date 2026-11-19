// Prompt: explain_phenomenon
// קלט: תופעה חופשית בעברית
// פלט: חוקים רלוונטיים + הסבר

import { INITIAL_LAWS, Law } from '../../data/laws';

const LAWS_SUMMARY = INITIAL_LAWS.map(law =>
  `ID: ${law.id} | שם: ${law.name} | תחום: ${law.domain.join(', ')} | הגדרה: ${law.definition.substring(0, 100)}...`
).join('\n');

export function buildExplainPrompt(phenomenon: string): string {
  return `אתה מומחה לחוקי התנהגות בין-תחומיים.

להלן רשימת החוקים הקיימים במאגר:
${LAWS_SUMMARY}

התופעה שהמשתמש מתאר:
"${phenomenon}"

משימתך:
1. זהה 1-3 חוקים מהרשימה שמסבירים הכי טוב את התופעה
2. הסבר כיצד כל חוק מסביר את התופעה
3. הצע דוגמה נוספת מתחום שונה שמדגים את אותו חוק

החזר JSON בלבד בפורמט:
{
  "matched_law_ids": ["id1", "id2"],
  "explanation": "הסבר קצר וחד (2-3 משפטים) בעברית",
  "additional_examples": [
    {"domain": "שם תחום", "description": "דוגמה"}
  ],
  "insight": "תובנה מפתיעה אחת שהחוק חושף על התופעה"
}`;
}

export interface ExplainResult {
  matched_law_ids: string[];
  explanation: string;
  additional_examples: Array<{ domain: string; description: string }>;
  insight: string;
}
