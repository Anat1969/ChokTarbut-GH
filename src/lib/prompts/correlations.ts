// Prompt: find_correlations
// קלט: חוק אחד
// פלט: הצעות לקורלציות עם חוקים שאינם ברשימה הקיימת

import { Law, INITIAL_LAWS } from '../../data/laws';

export function buildCorrelationsPrompt(law: Law): string {
  const existingCorrelations = law.correlations.join(', ');

  return `אתה חוקר בין-תחומי המחפש קורלציות עמוקות בין חוקי התנהגות.

החוק הנוכחי:
שם: ${law.name}
הגדרה: ${law.definition}
מנגנון: ${law.mechanism}
תחומים: ${law.domain.join(', ')}
קורלציות קיימות: ${existingCorrelations}

משימתך: מצא 3 קורלציות מפתיעות — חוקים מתחומים שונים שאולי לא נראים קשורים אבל חולקים אותו מנגנון עמוק.

כל קורלציה צריכה:
1. לבוא מתחום שונה
2. לחלוק מנגנון עמוק (לא סתם דמיון שטחי)
3. להפתיע — לחשוף משהו לא מובן מאליו

החזר JSON:
{
  "correlations": [
    {
      "law_name": "שם חוק",
      "domain": "תחום",
      "shared_mechanism": "המנגנון המשותף העמוק",
      "surprise": "למה זה מפתיע"
    }
  ],
  "meta_pattern": "הדפוס העל שמאחד את כולם"
}`;
}

export interface CorrelationResult {
  correlations: Array<{
    law_name: string;
    domain: string;
    shared_mechanism: string;
    surprise: string;
  }>;
  meta_pattern: string;
}
