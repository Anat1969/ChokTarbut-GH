// טיפוסים משותפים לכל האפליקציה

export type Domain = 'ביולוגיה' | 'חברה' | 'ספורט' | 'עיר' | 'תרבות' | 'כלכלה' | 'מדע';

export interface Example {
  domain: string;
  description: string;
}

export interface Law {
  id: string;
  name: string;
  name_en?: string;
  domain: Domain[];
  definition: string;
  mechanism: string;
  examples: Example[];
  evidence_strength: 1 | 2 | 3 | 4 | 5;
  correlations: string[]; // מזהים של חוקים קשורים
  source: string;
  created_by: 'system' | 'anat';
  tags: string[];
}

// חוק שענת יצרה, או חוק מהמאגר שהיא סימנה
export interface SavedLaw {
  id: string;
  kind: 'created' | 'marked';
  name: string;
  name_en?: string;
  domain: string[];
  definition: string;
  mechanism: string;
  examples: Example[];
  tags: string[];
  parent_law_ids: string[];
  why_novel?: string;
  family?: string; // משפחת המנגנון, למיקום בטבלה המחזורית
  created_at: string;
  synced?: boolean;
}

export interface ExplainResult {
  matched_law_ids: string[];
  insight: string;
  explanation: string;
  per_law: Array<{ id: string; how: string }>;
  additional_examples: Example[];
  by: 'gemini' | 'claude' | 'local';
}

export interface CreateLawResult {
  name: string;
  name_en: string;
  definition: string;
  mechanism: string;
  examples: Example[];
  why_novel: string;
  domain: string[];
  tags: string[];
  by?: string;
}

export interface CorrelationResult {
  correlations: Array<{
    law_name: string;
    domain: string;
    shared_mechanism: string;
    surprise: string;
  }>;
  meta_pattern: string;
  by?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
