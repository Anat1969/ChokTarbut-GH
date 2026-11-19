// משפחות מנגנון: הציר השני של הטבלה המחזורית.
// תחום אומר איפה החוק נצפה. משפחה אומרת איך הוא פועל.
// השיוך למשפחה הוא פרשנות של האפליקציה, לא עובדה מהמקורות.
import type { Domain } from '../types';

export type FamilyId = 'contagion' | 'swarm' | 'scale' | 'limit' | 'skew' | 'dilemma';

export interface Family {
  id: FamilyId;
  name: string;
  short: string; // שורת מנגנון, עד 8 מילים
  rule: string; // הכלל: למה החוקים במשפחה קשורים
  insight: string; // התובנה: מה זה אומר
  apply: string; // היישום: מה עושים עם זה בעיר
  haiku: [string, string, string];
  haikuNote: string;
}

export const FAMILIES: Family[] = [
  {
    id: 'contagion',
    name: 'הדבקה וסף',
    short: 'התנהגות עוברת מאדם לאדם, עד סף.',
    rule: 'כל אחד מחקה את מי שלידו, ומעל סף מסוים השינוי מתפשט לבד.',
    insight: 'מעטים בזמן הנכון שווים יותר מרבים בזמן הלא נכון.',
    apply: 'מתחילים ברחוב אחד שעובד היטב, ונותנים לו להדביק את השכנים.',
    haiku: ['חלון אחד דולק', 'ואחריו כל הרחוב', 'לומד להאיר'],
    haikuNote: 'ההייקו מאיר את הסף: הראשון קשה, והשאר נגררים.',
  },
  {
    id: 'swarm',
    name: 'תיאום בלי מרכז',
    short: 'סדר נוצר מכללים מקומיים פשוטים.',
    rule: 'כל פרט מגיב רק לשכניו הקרובים, ובכל זאת נוצר סדר של כל הקבוצה.',
    insight: 'סדר לא חייב מתכנן. הוא חייב כלל פשוט שכולם רואים.',
    apply: 'מתכננים את הכלל המקומי, כמו חזית פעילה או קו בניין, ולא כל פרט.',
    haiku: ['אלף זרזירים', 'איש מהם אינו מוביל', 'והענן פונה'],
    haikuNote: 'ההייקו מאיר סדר שאין לו מנהל.',
  },
  {
    id: 'scale',
    name: 'גודל וסקייל',
    short: 'כשהגודל משתנה, הכללים משתנים איתו.',
    rule: 'תכונות של מערכת לא גדלות ביחס ישר לגודל שלה, אלא לפי חזקה.',
    insight: 'עיר גדולה אינה עיר קטנה מוגדלת. היא יצור אחר.',
    apply: 'בודקים כל פתרון בקנה המידה שלו: מה שעובד בשכונה לא בהכרח עובד ברובע.',
    haiku: ['לב הפיל איטי', 'לב העכבר רץ ורץ', 'שניהם אותו חוק'],
    haikuNote: 'ההייקו מאיר חוק אחד שמחזיק גדלים רחוקים.',
  },
  {
    id: 'limit',
    name: 'תקרה ותקציב',
    short: 'משאב קבוע קובע את הגבול.',
    rule: 'זמן, גוף וקשב הם תקציב קבוע. מה שמתווסף במקום אחד יורד ממקום אחר.',
    insight: 'שיפור לא מבטל את התקרה. הוא מזיז את מה שממלא אותה.',
    apply: 'מודדים את התקציב האמיתי, כמו שעה ביום לנסיעות, ולא את המהירות.',
    haiku: ['שעה אחת ביום', 'הרכבת מהירה יותר', 'והבית רחוק'],
    haikuNote: 'ההייקו מאיר תקציב זמן שלא משתנה.',
  },
  {
    id: 'skew',
    name: 'ריכוז ואי־שוויון',
    short: 'מעטים מחזיקים את רוב העוצמה.',
    rule: 'יתרון קטן מצטבר, ולכן ההתפלגות נוטה תמיד אל מעטים גדולים ורבים קטנים.',
    insight: 'הממוצע מטעה. מי שקובע הוא הראש של ההתפלגות.',
    apply: 'מאתרים את המעטים שקובעים, כמו כמה רחובות או כמה צמתים, ומשקיעים בהם.',
    haiku: ['עשרה רחובות', 'נושאים את כל העיר', 'השאר הולכים שקט'],
    haikuNote: 'ההייקו מאיר התפלגות שרובה זנב.',
  },
  {
    id: 'dilemma',
    name: 'פרט מול כלל',
    short: 'מה שטוב לכל אחד, רע לכולם.',
    rule: 'כל פרט בוחר נכון לעצמו, והסכום של הבחירות פוגע בכולם.',
    insight: 'הבעיה אינה באנשים. היא בכללי המשחק.',
    apply: 'משנים את התמריץ או את הכלל, ולא מוסיפים עוד קיבולת.',
    haiku: ['נתיב חדש נפתח', 'כל נהג ממהר אליו', 'והפקק חוזר'],
    haikuNote: 'ההייקו מאיר בחירה נבונה של יחיד, שמפסידה לכולם.',
  },
];

export const FAMILY_OF: Record<string, FamilyId> = {
  // חוקי Epoch 409
  'incapacity-law': 'contagion',
  'teaching-law': 'contagion',
  'drift-law': 'contagion',
  'chestertons-fence': 'swarm',
  'longevity-paradox': 'scale',
  'growth-law': 'scale',
  'adaptation-law': 'limit',
  'jazz-law': 'limit',
  'talent-law': 'limit',
  'inequality-law': 'skew',
  'chance-law': 'skew',

  'information-cascade': 'contagion',
  'social-contagion': 'contagion',
  'minority-rule': 'contagion',
  'wave-law': 'contagion',
  'broken-windows': 'contagion',
  'hebbs-law': 'contagion',

  'murmuration-law': 'swarm',
  'schelling-point': 'swarm',
  'adaptive-sleep-law': 'swarm',
  'eyes-on-the-street': 'swarm',
  'conways-law': 'swarm',

  'peto-paradox': 'scale',
  'naked-mole-rat-law': 'scale',
  'kleiber-law': 'scale',
  'urban-scaling': 'scale',
  'dunbar-number': 'scale',
  'metcalfe-law': 'scale',
  'brooks-law': 'scale',

  'human-performance-ceiling': 'limit',
  'diminishing-returns': 'limit',
  'marchetti-constant': 'limit',
  'skill-transfer': 'limit',
  'parkinson-law': 'limit',

  'pareto-principle': 'skew',
  'zipf-law': 'skew',
  'matthew-effect': 'skew',

  'braess-paradox': 'dilemma',
  'induced-demand': 'dilemma',
  'tragedy-of-commons': 'dilemma',
  'goodhart-law': 'dilemma',
};

export const FAMILY_BY_ID: Record<FamilyId, Family> = Object.fromEntries(FAMILIES.map((f) => [f.id, f])) as Record<FamilyId, Family>;

export const familyOf = (lawId: string): Family | undefined => FAMILY_BY_ID[FAMILY_OF[lawId]];

export interface CellKey {
  family: FamilyId;
  domain: Domain;
}

// שם קצר לכל חוק, לאריח בטבלה המחזורית
export const SHORT_NAME: Record<string, string> = {
  'longevity-paradox': 'אריכות',
  'adaptation-law': 'הסתגלות',
  'chestertons-fence': 'גדר',
  'incapacity-law': 'ציות',
  'inequality-law': 'אי־שוויון',
  'teaching-law': 'הוראה',
  'growth-law': 'צמיחה',
  'jazz-law': "ג'אז",
  'chance-law': 'סיכוי',
  'talent-law': 'כישרון',
  'drift-law': 'סחף',
  'peto-paradox': 'פטו',
  'naked-mole-rat-law': 'חולד',
  'human-performance-ceiling': 'תקרה',
  'skill-transfer': 'העברה',
  'information-cascade': 'קסקדה',
  'schelling-point': 'שלינג',
  'social-contagion': 'הדבקה',
  'minority-rule': 'מיעוט',
  'murmuration-law': 'להקה',
  'wave-law': 'גל',
  'adaptive-sleep-law': 'שינה',
  'diminishing-returns': 'תשואה',
  'dunbar-number': 'דנבר',
  'pareto-principle': 'פארטו',
  'zipf-law': 'זיפ',
  'conways-law': 'קונווי',
  'metcalfe-law': 'מטקאלף',
  'brooks-law': 'ברוקס',
  'goodhart-law': 'גודהארט',
  'hebbs-law': 'הב',
  'braess-paradox': 'בראס',
  'induced-demand': 'ביקוש',
  'eyes-on-the-street': 'עיניים',
  'marchetti-constant': 'מרקטי',
  'urban-scaling': 'סקיילינג',
  'kleiber-law': 'קלייבר',
  'tragedy-of-commons': 'נחלה',
  'broken-windows': 'חלונות',
  'matthew-effect': 'מתיו',
  'parkinson-law': 'פרקינסון',
};

// ציטוטים מהמקור, מילה במילה. התרגום לעברית חופשי.
export interface Quote {
  lawId: string;
  text: string;
  he: string;
  by: string;
  byHe: string;
  work: string;
  year: number;
}

export const QUOTES: Quote[] = [
  {
    lawId: 'eyes-on-the-street',
    text: 'There must be eyes upon the street, eyes belonging to those we might call the natural proprietors of the street.',
    he: 'חייבות להיות עיניים על הרחוב, עיניים של מי שאפשר לקרוא להם בעליו הטבעיים של הרחוב.',
    by: 'Jane Jacobs',
    byHe: "ג'יין ג'ייקובס",
    work: 'The Death and Life of Great American Cities',
    year: 1961,
  },
  {
    lawId: 'brooks-law',
    text: 'Adding manpower to a late software project makes it later.',
    he: 'הוספת כוח אדם לפרויקט תוכנה שמאחר, מאחרת אותו עוד.',
    by: 'Fred Brooks',
    byHe: 'פרד ברוקס',
    work: 'The Mythical Man-Month',
    year: 1975,
  },
  {
    lawId: 'parkinson-law',
    text: 'Work expands so as to fill the time available for its completion.',
    he: 'העבודה מתרחבת כך שתמלא את הזמן שעומד לרשות השלמתה.',
    by: 'C. Northcote Parkinson',
    byHe: 'סיריל נורת׳קוט פרקינסון',
    work: 'The Economist',
    year: 1955,
  },
  {
    lawId: 'goodhart-law',
    text: 'When a measure becomes a target, it ceases to be a good measure.',
    he: 'כשמדד הופך למטרה, הוא מפסיק להיות מדד טוב.',
    by: 'Marilyn Strathern',
    byHe: 'מרילין סטראת׳רן, בניסוח חוק גודהארט',
    work: "'Improving ratings': audit in the British University system",
    year: 1997,
  },
];

export const quoteOf = (lawId: string): Quote | undefined => QUOTES.find((q) => q.lawId === lawId);

// קשרים בין חוקי Epoch 409 לחוקים הקלאסיים שעוסקים באותה תופעה.
// הם מתווספים לרשת הקשרים, בלי לשנות את רשימת הקורלציות שענת הזינה לכל חוק.
export const EXTRA_LINKS: Array<[string, string]> = [
  ['longevity-paradox', 'peto-paradox'],
  ['longevity-paradox', 'naked-mole-rat-law'],
  ['longevity-paradox', 'kleiber-law'],
  ['adaptation-law', 'human-performance-ceiling'],
  ['adaptation-law', 'diminishing-returns'],
  ['inequality-law', 'matthew-effect'],
  ['inequality-law', 'pareto-principle'],
  ['incapacity-law', 'information-cascade'],
  ['incapacity-law', 'social-contagion'],
  ['jazz-law', 'hebbs-law'],
  ['teaching-law', 'hebbs-law'],
  ['talent-law', 'skill-transfer'],
  ['chance-law', 'matthew-effect'],
  ['drift-law', 'social-contagion'],
  ['growth-law', 'urban-scaling'],
  ['chestertons-fence', 'tragedy-of-commons'],
];
