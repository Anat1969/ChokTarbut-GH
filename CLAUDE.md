# חוקי התנהגות — Behavioral Laws App

## מה האפליקציה הזאת
מנגנון ידע בין-תחומי שמאגד חוקי התנהגות מתחומים שונים (ביולוגיה, חברה, ספורט, עיר, תרבות),
מסביר תופעות דרך החוקים, ומייצר חוקים חדשים בקורלציות בין תחומים.

**בעלת האפליקציה:** ענת דוד שטיבלמן — אדריכלית העיר אשדוד
**מקור נתונים ראשוני:** מגזין Epoch גיליון 409, ספטמבר 2026 (חוקים ביולוגיים, חברתיים, ספורטיביים)

## 3 מנועים מרכזיים
1. **גלה** — ספריית חוקים לפי תחום + קורלציות
2. **הסבר** — הכנסת תופעה → AI מזהה חוקים רלוונטיים + דוגמאות
3. **צור** — חיבור 2+ חוקים → חוק חדש / בין-תחומי

## Stack
- React (Vite) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + Edge Functions)
- Claude API (anthropic SDK) — 3 prompt types
- Vercel (deployment)

## כללי עיצוב (ענת-standards)
- RTL, עברית בלבד
- לבן + שחור + צבע עם תפקיד בלבד
- סרגל עליון קבוע — שם האפליקציה = לינק לבית
- כפתורים מרובעים (border-radius: 0)
- Google Login ישיר (ללא שלב ביניים)
- אין אייקונים דקורטיביים
- 6 תחומים עם צבע קבוע:
  - ביולוגיה: #2D6A4F (ירוק כהה)
  - חברה: #1D3557 (כחול כהה)
  - ספורט: #E63946 (אדום)
  - עיר: #457B9D (כחול-אפור)
  - תרבות: #6A0572 (סגול)
  - כלכלה: #F4A261 (כתום)

## מבנה מסכים
1. `/` — בית: 3 כפתורי כניסה (גלה / הסבר / צור)
2. `/library` — ספריית כל החוקים, פילטור לפי תחום
3. `/law/:id` — מסך חוק בודד (הגדרה, דוגמאות, קורלציות)
4. `/explain` — מסביר תופעות: שדה טקסט → חוקים רלוונטיים
5. `/create` — מחולל חוקים חדשים
6. `/my-laws` — ארכיון חוקים שענת יצרה / סימנה

## מבנה DB (Supabase)
### טבלת laws
- id, name, domain[], definition, mechanism, examples (jsonb), evidence_strength (1-5), correlations (id[]), source, created_by, tags[]

### טבלת explanations
- id, user_id, phenomenon, matched_laws (id[]), explanation, created_at

### טבלת user_laws
- id, user_id, name, definition, parent_laws (id[]), creation_note, created_at

## Claude API — 3 Prompt Types
1. **explain_phenomenon** → `src/lib/prompts/explain.ts`
2. **find_correlations** → `src/lib/prompts/correlations.ts`
3. **create_new_law** → `src/lib/prompts/create.ts`

## סטטוס בנייה
- [x] אפיון מלא
- [x] מאגר חוקים ראשוני (13 חוקים מ-Epoch + 20 קלאסיים)
- [ ] UI — בית + ספרייה
- [ ] מסך חוק בודד
- [ ] חיבור Claude API
- [ ] Auth (Google)
- [ ] Deploy לVercel

## פקודות שימושיות
```bash
npm run dev          # הרצה מקומית
npm run build        # בנייה לייצור
npx supabase start   # Supabase מקומי
npx supabase db push # העלאת migrations
```

## חיבור לאפליקציות אחרות של ענת
API endpoint: `POST /api/query-laws`
Body: `{ context: string, domain?: string }`
Returns: `{ laws: Law[], explanation: string }`
