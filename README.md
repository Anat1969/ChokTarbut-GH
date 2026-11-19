# חוקי התנהגות

**[פתיחת האפליקציה: chok-tarbut.vercel.app](https://chok-tarbut.vercel.app)**

חוק אחד מסביר תופעות בעולמות רחוקים.
מנגנון ידע בין־תחומי: **30** חוקי התנהגות מביולוגיה, חברה, ספורט, עיר, תרבות וכלכלה, והקשרים ביניהם.

## שלושה מנועים

1. **גלה**: מפת הקשרים וספריית החוקים, עם סינון לפי תחום ומיון לפי תחום, חוזק ראיות או מספר קשרים.
2. **הסבר**: מתארים תופעה, ומקבלים את החוקים שמסבירים אותה. כשה-AI לא זמין, מוצגת התאמה מקומית לפי מילים.
3. **צור**: בוחרים שניים או שלושה חוקים, ומקבלים חוק חדש מהצומת ביניהם. החוק נשמר ב"החוקים שלי".

## מבנה

| מה | איפה |
|---|---|
| מאגר החוקים | `src/data/laws.ts` (המקור), והטבלה `chok_laws` ב-Supabase |
| מפת הקשרים | `src/lib/graph.ts`, `src/components/LawMap.tsx` |
| התאמה מקומית בלי AI | `src/lib/match.ts` |
| שמירה במכשיר וסנכרון לענן | `src/lib/store.ts` |
| מנועי ה-AI וההנחיות למודל | `supabase/functions/chok-ai/index.ts` |
| סכמת המסד | `supabase/migrations/001_chok_initial.sql` |

## חיבור לאפליקציות אחרות

```
POST https://chok-tarbut.vercel.app/api/query-laws
{ "context": "רחוב עם חנויות מרגיש בטוח יותר בלילה", "domain": "עיר" }
```

מחזיר `{ laws, explanation, insight }`. השדה `domain` אופציונלי.

## פיתוח

```bash
npm install
npm run dev
npm run build
npm run preview -- --port 4173
npm test
```

`npm test` מריץ בדיקת Playwright מול `vite preview`: כל המסכים, שלושת המנועים עם שרת AI מדומה, נייד בלי גלילה אופקית, וגיבוי כשה-AI נופל.

אחרי שינוי במאגר החוקים מעדכנים גם את `chok_laws` (הקובץ `supabase/seed_laws.sql` נוצר מהמאגר).
