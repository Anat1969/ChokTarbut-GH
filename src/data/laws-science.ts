// חוקי מדע: איך המדע עצמו מתנהג, כמפעל אנושי.
// שישה חוקים, אחד לכל משפחת מנגנון. המקור של כל אחד הוא המחקר שבו נוסח.
// הדוגמאות שמחוץ למדע מנוסחות כהיגיון של המנגנון, ולא כממצא מחקרי.

import type { Law } from '../types';

export const SCIENCE_LAWS: Law[] = [
  {
    id: 'paradigm-shift',
    name: 'חוק שינוי הפרדיגמה',
    name_en: 'Paradigm Shift',
    domain: ['מדע', 'תרבות'],
    definition: 'המדע לא מתקדם בקו רציף. חריגות נערמות בשקט, עד שהתמונה כולה מתחלפת בבת אחת.',
    mechanism: 'קהילה מדעית עובדת בתוך מסגרת מוסכמת, ודוחה חריגות כטעויות מדידה. כשהחריגות עוברות סף, המסגרת נכנסת למשבר, ודור חדש מאמץ מסגרת אחרת.',
    examples: [
      { domain: 'מדע', description: 'אלפרד וגנר הציע את נדידת היבשות ב-1912, והרעיון נדחה. רק בשנות ה-60, עם טקטוניקת הלוחות, הוא התקבל' },
      { domain: 'תרבות', description: 'סגנון אמנותי נשאר שליט שנים אחרי שנשחק, ואז מתחלף בתוך עשור' },
      { domain: 'עיר', description: 'תפיסת תכנון נשארת בתוקף גם כשהכשלים שלה נערמים, עד שדור חדש של מתכננים מחליף אותה' },
    ],
    evidence_strength: 3,
    correlations: ['information-cascade', 'minority-rule', 'chestertons-fence', 'file-drawer'],
    source: 'Thomas S. Kuhn, The Structure of Scientific Revolutions (1962)',
    created_by: 'system',
    tags: ['פרדיגמה', 'מהפכה מדעית', 'חריגות', 'סף', 'דור'],
  },

  {
    id: 'multiple-discovery',
    name: 'חוק התגלית המרובה',
    name_en: 'Multiple Discovery',
    domain: ['מדע', 'תרבות'],
    definition: 'תגליות גדולות מתגלות לעתים קרובות פעמיים, בידי אנשים שלא ידעו זה על זה.',
    mechanism: 'כשהידע, הכלים והשאלות כבר מונחים על השולחן של תקופה, כמה חוקרים מגיעים לאותו צעד בנפרד. התיאום בא מהסביבה המשותפת, ולא ממרכז שמכוון.',
    examples: [
      { domain: 'מדע', description: 'ניוטון ולייבניץ פיתחו את החשבון האינפיניטסימלי בנפרד. דרווין ווולאס הציגו את הברירה הטבעית יחד ב-1858' },
      { domain: 'כלכלה', description: 'בל וגריי הגישו בקשות לפטנט על הטלפון באותו יום, 14 בפברואר 1876' },
      { domain: 'תרבות', description: 'אותו רעיון עיצובי צץ בכמה סטודיואים באותה שנה, כי כולם ניזונים מאותם חומרים וכלים' },
    ],
    evidence_strength: 4,
    correlations: ['murmuration-law', 'schelling-point', 'conways-law', 'lotka-law'],
    source: 'Robert K. Merton, Singletons and Multiples in Scientific Discovery (1961); Ogburn & Thomas (1922)',
    created_by: 'system',
    tags: ['תגלית', 'רוח הזמן', 'במקביל', 'המצאה', 'קרדיט'],
  },

  {
    id: 'team-size-law',
    name: 'חוק גודל הצוות',
    name_en: 'Small Teams Disrupt, Large Teams Develop',
    domain: ['מדע', 'חברה'],
    definition: 'צוותים קטנים פורצים כיוונים חדשים. צוותים גדולים מפתחים את מה שכבר ידוע.',
    mechanism: 'כשצוות גדל, עולה מחיר התיאום, והוא נשען על רעיונות מבוססים שקל להסכים עליהם. צוות קטן יכול להמר על רעיון ישן או שולי, ולכן הוא זה שמשנה כיוון.',
    examples: [
      { domain: 'מדע', description: 'ניתוח של יותר מ-65 מיליון מאמרים, פטנטים ומוצרי תוכנה מהשנים 1954 עד 2014 מצא את הדפוס בכל התחומים' },
      { domain: 'חברה', description: 'ועדה גדולה מגיעה לנוסח שכולם יכולים לחיות איתו, ולא לנוסח הנועז' },
      { domain: 'עיר', description: 'צוות תכנון קטן מעז להציע רחוב אחר לגמרי, וצוות גדול משפר את הרחוב הקיים' },
    ],
    evidence_strength: 4,
    correlations: ['brooks-law', 'dunbar-number', 'urban-scaling', 'eroom-law'],
    source: 'Wu, Wang & Evans, Nature (2019)',
    created_by: 'system',
    tags: ['צוות', 'גודל', 'חדשנות', 'שיבוש', 'תיאום'],
  },

  {
    id: 'eroom-law',
    name: 'חוק ארום',
    name_en: "Eroom's Law",
    domain: ['מדע', 'כלכלה'],
    definition: 'מספר התרופות החדשות לכל מיליארד דולר של מחקר ופיתוח ירד בחצי בערך כל 9 שנים, מאז 1950.',
    mechanism: 'התגליות הקלות נקטפו ראשונות. כל תרופה חדשה צריכה לנצח את כל הקודמות, והרף הרגולטורי עולה. ההשקעה גדלה, והתפוקה לכל שקל יורדת.',
    examples: [
      { domain: 'מדע', description: 'השם הוא "מור" בהיפוך אותיות: שבבים הוכפלו בכוחם כל שנתיים, ופיתוח תרופות התייקר באותו קצב' },
      { domain: 'ספורט', description: 'שבירת שיא עולם דורשת היום הרבה יותר משאבים מבעבר, והשיפור קטן יותר' },
      { domain: 'כלכלה', description: 'שדה נפט או מכרה מניבים פחות ככל שמעמיקים, כי העתודות הנגישות נוצלו קודם' },
    ],
    evidence_strength: 4,
    correlations: ['diminishing-returns', 'human-performance-ceiling', 'parkinson-law', 'team-size-law'],
    source: 'Scannell, Blanckley, Boldon & Warrington, Nature Reviews Drug Discovery (2012)',
    created_by: 'system',
    tags: ['מחקר ופיתוח', 'תרופות', 'תפוקה', 'תקרה', 'עלות'],
  },

  {
    id: 'lotka-law',
    name: 'חוק לוטקה',
    name_en: "Lotka's Law",
    domain: ['מדע', 'תרבות'],
    definition: 'מעט חוקרים כותבים את רוב המאמרים. מספר הכותבים של n מאמרים קטן בערך לפי n בריבוע.',
    mechanism: 'פרסום מוליד פרסום. מי שכבר פרסם מקבל מימון, שותפים וניסיון, ולכן מפרסם שוב. רוב הכותבים נעצרים אחרי מאמר אחד, ומיעוט קטן ממשיך בלי סוף.',
    examples: [
      { domain: 'מדע', description: 'בנתונים של לוטקה מ-1926, כ-60% מהכותבים פרסמו מאמר אחד בלבד' },
      { domain: 'תרבות', description: 'מעט יוצרים אחראים לרוב היצירות שנשארות בזיכרון של תחום' },
      { domain: 'חברה', description: 'בקהילה מקוונת, מעט משתתפים כותבים את רוב התוכן, והרוב קוראים בלבד' },
    ],
    evidence_strength: 4,
    correlations: ['zipf-law', 'pareto-principle', 'matthew-effect', 'multiple-discovery'],
    source: 'Alfred J. Lotka, Journal of the Washington Academy of Sciences (1926)',
    created_by: 'system',
    tags: ['פרסומים', 'פריון', 'חוק חזקה', 'ריכוז', 'מיעוט'],
  },

  {
    id: 'file-drawer',
    name: 'חוק המגירה',
    name_en: 'File Drawer Problem',
    domain: ['מדע', 'חברה'],
    definition: 'ניסויים שלא מצאו דבר נשארים במגירה. לכן הספרות המדעית נראית בטוחה יותר ממה שהיא באמת.',
    mechanism: 'לכל חוקר משתלם לפרסם רק תוצאה חיובית, כי רק היא מתקבלת לכתב עת. כל החלטה כזו הגיונית לבדה, אבל יחד הן מעוותות את הידע של כולם.',
    examples: [
      { domain: 'מדע', description: 'ב-74 ניסויים של נוגדי דיכאון, הספרות המפורסמת הציגה 94% הצלחה. לפי נתוני ה-FDA, רק 51% היו חיוביים' },
      { domain: 'חברה', description: 'ארגון מדווח על הפרויקטים שהצליחו, והכישלונות לא נכנסים לדוח השנתי' },
      { domain: 'עיר', description: 'עיר מציגה את הרחוב שהתחדש בהצלחה, והפיילוטים שנכשלו לא מתועדים, כך שהעיר הבאה חוזרת עליהם' },
    ],
    evidence_strength: 4,
    correlations: ['goodhart-law', 'tragedy-of-commons', 'paradigm-shift'],
    source: 'Robert Rosenthal, Psychological Bulletin (1979); Turner et al., NEJM (2008)',
    created_by: 'system',
    tags: ['הטיית פרסום', 'תוצאה שלילית', 'שחזור', 'תמריץ', 'ידע'],
  },
];
