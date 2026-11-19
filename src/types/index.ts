// טיפוסים משותפים לכל האפליקציה

export type Domain =
  | 'ביולוגיה'
  | 'חברה'
  | 'ספורט'
  | 'עיר'
  | 'תרבות'
  | 'כלכלה'
  | 'פסיכולוגיה'
  | 'טכנולוגיה'
  | 'פיזיקה'
  | 'אבולוציה';

export interface Example {
  domain: Domain;
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
  correlations: string[]; // IDs של חוקים קשורים
  source: string;
  created_by: 'system' | 'anat';
  tags: string[];
}

export interface UserLaw extends Law {
  user_id: string;
  parent_law_ids: string[];
  created_at: string;
  saved_at?: string;
}

export interface ExplainResult {
  matched_law_ids: string[];
  explanation: string;
  additional_examples: Array<{ domain: string; description: string }>;
  insight: string;
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

export interface CorrelationResult {
  correlations: Array<{
    law_name: string;
    domain: string;
    shared_mechanism: string;
    surprise: string;
  }>;
  meta_pattern: string;
}

export interface AppState {
  user: User | null;
  laws: Law[];
  userLaws: UserLaw[];
  loading: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}
