// מאגר חוקי התנהגות — גרעין ראשוני
// מקורות: Epoch 409 (ספטמבר 2026) + חוקים קלאסיים
// הטיפוסים מוגדרים במקום אחד: src/types

import type { Domain, Law } from '../types';
export type { Domain, Law, Example } from '../types';

export const DOMAIN_COLORS: Record<Domain, string> = {
  'ביולוגיה': '#2D6A4F',
  'חברה': '#1D3557',
  'ספורט': '#E63946',
  'עיר': '#457B9D',
  'תרבות': '#6A0572',
  'כלכלה': '#F4A261',
};

export const INITIAL_LAWS: Law[] = [
  // === מ-Epoch 409 ===

  {
    id: 'peto-paradox',
    name: 'פרדוקס פטו',
    name_en: "Peto's Paradox",
    domain: ['ביולוגיה'],
    definition: 'גופים גדולים אינם לוקים בסרטן יותר מגופים קטנים, למרות שיש להם פי מיליון תאים יותר ולכן הרבה יותר הזדמנויות למוטציה סרטנית.',
    mechanism: 'ברירה טבעית יצרה מנגנוני הגנה מדורגים בגופים גדולים. פילים למשל מחזיקים 20 עותקים של גן TP53 (לאדם יש 2). ככל שהגוף גדול יותר, כך פתח ה"התפתחות ונגד סרטן" גדול יותר.',
    examples: [
      { domain: 'ביולוגיה', description: 'לוויתן ענק (150 טון) חולה פחות בסרטן מאדם (70 ק"ג) לאורך חייו' },
      { domain: 'חברה', description: 'ארגונים גדולים מפתחים מנגנוני בקרה מורכבים יותר מסטארטאפים קטנים' },
      { domain: 'עיר', description: 'ערים גדולות מפתחות מערכות ניקוז, בטיחות ובריאות חזקות יותר מכפרים' },
    ],
    evidence_strength: 5,
    correlations: ['naked-mole-rat-law', 'dunbar-number', 'zipf-law'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['סרטן', 'אבולוציה', 'גודל', 'הגנה'],
  },

  {
    id: 'naked-mole-rat-law',
    name: 'חוק חולד העיוור',
    name_en: 'Naked Mole Rat Cancer Immunity',
    domain: ['ביולוגיה'],
    definition: 'חולד העיוור חסין לסרטן לכל אורך חייו (30 שנה — פי 10 מחולד רגיל), ממשיך לתפקד עד לרגע מותו ללא ירידה תפקודית.',
    mechanism: 'תאי חולד העיוור מחוסנים על ידי חומר בשם היאלורונן בצפיפות גבוהה מאוד המונע את התפשטותם. כשתאים מתחילים להתנהג "בצורה סרטנית" — שכניהם מחנקים אותם. זהו מנגנון חנק חברתי בין-תאי.',
    examples: [
      { domain: 'ביולוגיה', description: 'תאי חולד עיוור מפסיקים להתחלק כשמרגישים צפיפות — אנטי-תפשטות מובנה' },
      { domain: 'חברה', description: 'קהילות קטנות ואינטימיות מאתרות ומגיבות לסטייה חברתית מהר יותר מחברה אנונימית' },
      { domain: 'תרבות', description: 'מסורות תרבותיות חזקות פועלות כמנגנון חנק על רעיונות הרסניים' },
    ],
    evidence_strength: 5,
    correlations: ['peto-paradox', 'dunbar-number', 'social-contagion'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['אריכות ימים', 'סרטן', 'חסינות', 'קהילה'],
  },

  {
    id: 'human-performance-ceiling',
    name: 'חוק תקרת הביצועים האנושיים',
    name_en: 'Human Performance Ceiling',
    domain: ['ספורט', 'ביולוגיה'],
    definition: 'שיאים עולמיים בביצועים גופניים מתכנסים לתקרה ביולוגית. קצב השיפור קטן בהדרגה ומתכנס לגבול פיזיולוגי.',
    mechanism: 'הגוף האנושי מוגבל על ידי מהירות הולכה עצבית, יעילות צריכת חמצן ומתח שרירי מרבי. שיפור אימוני יכול להתקרב לגבול אך לא לעבור אותו.',
    examples: [
      { domain: 'ספורט', description: 'ריצת 100 מ\' — השיא התכנס מ-10.6 שניות (1912) ל-9.58 (2009). מודלים מחשבים מינימום ~9.44' },
      { domain: 'כלכלה', description: 'פריון עבודה: חוק התשואה השולית הפוחתת — כל יחידת השקעה נוספת מוסיפה פחות מהקודמת' },
      { domain: 'תרבות', description: 'לימוד שפה: 80% שליטה עולה 20% מהמאמץ; 20% האחרונים עולים 80%' },
    ],
    evidence_strength: 4,
    correlations: ['diminishing-returns', 'pareto-principle', 'skill-transfer'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['ביצועים', 'גבולות', 'שיאים', 'ביולוגיה'],
  },

  {
    id: 'skill-transfer',
    name: 'חוק העברת מיומנות',
    name_en: 'Skill Transfer Law',
    domain: ['ספורט', 'חברה'],
    definition: 'מיומנות גבוהה בתחום אחד מעבירה יתרון מובנה לתחומים קרובים, בגלל מנגנוני תיאום ועיבוד מרכזיים משותפים.',
    mechanism: 'אימון ברמה גבוהה מפתח מנגנוני שליטה עצביים כלליים (ריכוז, זמן תגובה, זיהוי דפוסים) שמועברים מתחום לתחום.',
    examples: [
      { domain: 'ספורט', description: 'מייקל ג\'ורדן — ביסבול לאחר NBA; ספורטאים עם כישורי קואורדינציה מצטיינים בספורטים מרובים' },
      { domain: 'חברה', description: 'מנהיג טוב בתחום אחד לרוב מתאים לתפקידי מנהיגות בתחומים שונים' },
      { domain: 'תרבות', description: 'מוזיקאים לרוב מצטיינים גם במתמטיקה — מנגנון זיהוי דפוסים משותף' },
    ],
    evidence_strength: 3,
    correlations: ['human-performance-ceiling', 'dunbar-number'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['מיומנות', 'למידה', 'העברה', 'ספורט'],
  },

  {
    id: 'information-cascade',
    name: 'חוק קסקדת המידע',
    name_en: 'Information Cascade',
    domain: ['חברה'],
    definition: 'בקסקדה חברתית, אנשים מאוחרים מקבלים החלטות בהתבסס על ה"אות הציבורי" של מה שאחרים עשו — ומתעלמים ממידע פרטי שלהם. התוצאה: ההחלטה של המוקדמים שולטת בכולם.',
    mechanism: 'כשאינפורמציה של קודמים עולה על אינפורמציה פרטית, ההחלטה הרציונלית היא להתעלם מהמידע שלך ולחקות. זה יוצר קסקדה שיכולה להתרסק כשנחשף שהמידע הציבורי היה שגוי.',
    examples: [
      { domain: 'חברה', description: 'בחירת מסעדה: אנשים נכנסים לצפופה כי "כולם שם" — למרות שהמסעדה הריקה טובה יותר' },
      { domain: 'כלכלה', description: 'בועות פיננסיות: משקיעים קונים כי "כולם קונים" — גם כשהמספרים לא מצדיקים' },
      { domain: 'תרבות', description: 'ספר רב-מכר: כשמספיק אנשים קוראים אותו, שאר הרוכשים קונים בגלל הפופולריות' },
    ],
    evidence_strength: 5,
    correlations: ['schelling-point', 'social-contagion', 'minority-rule'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['החלטות', 'קבוצה', 'אות', 'מידע'],
  },

  {
    id: 'schelling-point',
    name: 'נקודת השלינג',
    name_en: 'Schelling Point',
    domain: ['חברה', 'כלכלה'],
    definition: 'ללא תקשורת, קבוצות עצמאיות מתכנסות לנקודות מוקד טבעיות — מקום, שעה, ברירת מחדל — שמרגישות "ברורות מאליהן" ומהוות פתרון קואורדינציה.',
    mechanism: 'כשקואורדינציה נדרשת ותקשורת לא אפשרית, אנשים בוחרים את המובן מאליו — הסמטרי, הפשוט, הצפוי. זה יוצר שיווי משקל ללא הסכמה מפורשת.',
    examples: [
      { domain: 'חברה', description: '"נפגש בכיכר המרכזית בחצות" — ללא שיחה, שתי קבוצות יתכנסו לשם' },
      { domain: 'כלכלה', description: 'עגול: אנשים מציעים מחיר עגול ($100 לא $97) גם בלי תיאום' },
      { domain: 'עיר', description: 'כיכרות ומוקדים עירוניים פועלים כנקודות שלינג — מקום טבעי למפגש ללא תיאום' },
    ],
    evidence_strength: 5,
    correlations: ['information-cascade', 'murmuration-law', 'dunbar-number'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['קואורדינציה', 'מוקד', 'ציפיות', 'שיווי משקל'],
  },

  {
    id: 'social-contagion',
    name: 'חוק ההדבקה החברתית',
    name_en: 'Social Contagion Law',
    domain: ['חברה'],
    definition: 'התנהגויות, רגשות ורעיונות מתפשטים בחברה כמחלות: יש ל"נשא", סף הדבקה, מרחק חברתי ומעל סף קריטי — התפשטות אקספוננציאלית.',
    mechanism: 'כשמספיק אנשים קרובים מאמצים התנהגות, העלות החברתית של אי-אימוץ עולה. מתחת לסף — ההתנהגות דועכת. מעליו — פוצצת.',
    examples: [
      { domain: 'חברה', description: 'אופנת לבוש: כשמספר קריטי בקבוצה אימצה סגנון — שאר הקבוצה מאמצת' },
      { domain: 'תרבות', description: 'מחאה: תנועה חברתית מתפוצצת רק לאחר שמספיק אנשים מוכנים "להיות ראשון"' },
      { domain: 'כלכלה', description: 'אימוץ טכנולוגיה: טלפון, SMS, WhatsApp — כל אחד פוצץ לאחר אחוז קריטי של משתמשים' },
    ],
    evidence_strength: 5,
    correlations: ['minority-rule', 'information-cascade', 'wave-law'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['התפשטות', 'נורמות', 'רשת', 'סף'],
  },

  {
    id: 'minority-rule',
    name: 'חוק המיעוט הנחוש',
    name_en: 'Minority Rule',
    domain: ['חברה'],
    definition: 'מיעוט של ~25% עם דעה עקבית, בלתי-פשרנית ומוצגת בביטחון — יכול להפוך לדעת הרוב. לא הרוב קובע, אלא הנחישות.',
    mechanism: 'רוב רך (60%) שאינו מחויב להתנגד, ייסוג מול מיעוט נחוש (25%) שמסרב להתפשר. במשא ומתן ובקבלת החלטות — הנחישות גוברת על המספרים.',
    examples: [
      { domain: 'חברה', description: 'אנשים עם אלרגיות קבעו את תקני המזון של כל הציבור — מיעוט נחוש ביסס נורמות חדשות' },
      { domain: 'תרבות', description: 'מהפכות תרבותיות — פמיניזם, זכויות אזרח — לא התחילו ברוב, אלא במיעוט נחוש' },
      { domain: 'כלכלה', description: 'רגולציות פיננסיות: מיעוט פעיל של לובייסטים עיצב חוקים שחלים על כולם' },
    ],
    evidence_strength: 4,
    correlations: ['social-contagion', 'information-cascade', 'schelling-point'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['מיעוט', 'נחישות', 'שינוי', 'כוח'],
  },

  {
    id: 'murmuration-law',
    name: 'חוק הלהקה (מורמורציה)',
    name_en: 'Murmuration Law',
    domain: ['ביולוגיה', 'חברה'],
    definition: 'כל פרט עוקב אחר 7 שכנים קרובים בלבד. תנועה קולקטיבית מורכבת, יפה ויעילה נוצרת מכלל מקומי פשוט — ללא מנהיג מרכזי.',
    mechanism: 'ביצוע חוקים מקומיים פשוטים (מרחק, מהירות, כיוון) יוצר דפוסים גלובליים מורכבים. הגדלה עצמית של המערכת בלי תכנון מרכזי.',
    examples: [
      { domain: 'ביולוגיה', description: 'עדרי ציפורים זרזיר — מאות אלפי ציפורים נעות כגוף אחד ללא מוביל' },
      { domain: 'חברה', description: 'שוק חופשי: מחירים נקבעים מהחלטות מקומיות של מיליוני קונים ומוכרים' },
      { domain: 'עיר', description: 'תנועה עירונית: כשכל נהג מגיב רק לשכניו הקרובים — נוצרים גלי פקקים שנעים כגל' },
    ],
    evidence_strength: 5,
    correlations: ['wave-law', 'schelling-point', 'social-contagion'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['עדר', 'אינטליגנציה קולקטיבית', 'ביזור', 'כלל פשוט'],
  },

  {
    id: 'wave-law',
    name: 'חוק הגל האנושי',
    name_en: 'Stadium Wave Law',
    domain: ['חברה', 'ספורט'],
    definition: 'גל אצטדיון נוצר רק כשקבוצה של ~25-30 אנשים קמים בו-זמנית. פחות מזה — הגל מת. יותר מזה — הגל מתפשט בלתי-ניתן לעצירה.',
    mechanism: 'קיים סף קריטי להצתת גל. מתחת לסף — ללא מסה קריטית, הפעולה לא מתפשטת. מעל הסף — גל עצמאי נוצר ממשיך ללא צורך בקיום הקבוצה המקורית.',
    examples: [
      { domain: 'ספורט', description: 'אצטדיון כדורגל — ניתן לצפות ולחשב בדיוק כמה אנשים נדרשים להתחיל גל' },
      { domain: 'חברה', description: 'מחיאות כפיים של קהל — הופך לריתמי ומסונכרן ספונטנית לאחר מסה קריטית' },
      { domain: 'כלכלה', description: 'עסק חדש: קריסה מתחת ל-X לקוחות; התפשטות אקספוננציאלית מעליו' },
    ],
    evidence_strength: 4,
    correlations: ['murmuration-law', 'social-contagion', 'minority-rule'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['סף', 'גל', 'המון', 'התפשטות'],
  },

  {
    id: 'adaptive-sleep-law',
    name: 'חוק השינה הקבוצתית',
    name_en: 'Group Sleep Coordination',
    domain: ['ביולוגיה', 'חברה'],
    definition: 'ביצורים חברתיים, שינה מתואמת בצורה שתמיד נותרת לפחות אחד ערני. לא מוסכמת — נוצרת ספונטנית מחוקים מקומיים של כל פרט.',
    mechanism: 'כל פרט נרדם כשמספיק שכנים ערים. ספוג שינה מצטבר דוחף לשינה. מנגנון זה יוצר שמירה מחזורית ללא תיאום.',
    examples: [
      { domain: 'ביולוגיה', description: 'דולפינים — מחצית המוח ישנה בכל פעם; להקות ציפורים — לסירוגין' },
      { domain: 'חברה', description: 'כוננות רפואית: רופאי חדר מיון עובדים ברוטציה כך שתמיד יש כיסוי' },
      { domain: 'עיר', description: 'עיר שלא ישנה: שכונות מסחריות ופנאי מחולקות בזמן כך שהעיר תמיד פעילה' },
    ],
    evidence_strength: 4,
    correlations: ['murmuration-law', 'dunbar-number'],
    source: 'Epoch 409, ספטמבר 2026',
    created_by: 'system',
    tags: ['שינה', 'שמירה', 'קהילה', 'ביזור'],
  },

  {
    id: 'diminishing-returns',
    name: 'חוק התשואה השולית הפוחתת',
    name_en: 'Law of Diminishing Marginal Returns',
    domain: ['כלכלה', 'ספורט', 'ביולוגיה'],
    definition: 'כשמוסיפים עוד ועוד מגורם אחד (עבודה, אימון, השקעה) תוך שמירה על שאר הגורמים קבועים — כל יחידה נוספת מוסיפה פחות מהקודמת.',
    mechanism: 'משאבים משלימים הופכים לצוואר בקבוק. יעילות מרגינלית יורדת כשאתה מגיע לגבול הגורם המגביל.',
    examples: [
      { domain: 'ספורט', description: 'אימון: שעה ראשונה מוסיפה הרבה; שעה 10 ביום — כמעט כלום ואף פוגעת' },
      { domain: 'כלכלה', description: 'פרסום: כל הוצאת שקל נוספת על אותה פרסומת מכניסה פחות לקוחות' },
      { domain: 'ביולוגיה', description: 'מינון תרופה: הגדלת מינון מביאה פחות ופחות תועלת — ואז רעילות' },
    ],
    evidence_strength: 5,
    correlations: ['human-performance-ceiling', 'pareto-principle'],
    source: 'קלאסי — David Ricardo (1817)',
    created_by: 'system',
    tags: ['כלכלה', 'ייצור', 'אופטימיזציה', 'גבולות'],
  },

  // === חוקים קלאסיים ===

  {
    id: 'dunbar-number',
    name: 'מספר דנבר',
    name_en: "Dunbar's Number",
    domain: ['חברה', 'ביולוגיה'],
    definition: 'המוח האנושי מסוגל לנהל מערכות יחסים אמיתיות ויציבות עם לא יותר מ-150 אנשים בו-זמנית. זהו הגבול הקוגניטיבי לקהילה אנושית יציבה.',
    mechanism: 'נאו-קורטקס אנושי מוגבל בעיבוד מורכבות חברתית. מנגנון ריצה עצבית של "מה אחרים חושבים" מוגבל ל-150.',
    examples: [
      { domain: 'חברה', description: 'כפרים מסורתיים ברחבי העולם: ממוצע ~150 נפש — גודל "טבעי" של קהילה מתפקדת' },
      { domain: 'כלכלה', description: 'Gore-Tex: גייס לא יותר מ-150 עובדים לכל מפעל — גדול יותר = ביורוקרטיה' },
      { domain: 'עיר', description: 'שכונות אורגניות: השכנות האמיתית (לדעת שמות) מוגבלת ל-100-150 משפחות' },
    ],
    evidence_strength: 4,
    correlations: ['naked-mole-rat-law', 'murmuration-law', 'schelling-point'],
    source: "Robin Dunbar (1992), 'Neocortex size as a constraint on group size'",
    created_by: 'system',
    tags: ['קהילה', 'קוגניציה', 'גודל', 'חברה'],
  },

  {
    id: 'pareto-principle',
    name: 'עקרון פארטו',
    name_en: 'Pareto Principle (80/20)',
    domain: ['כלכלה', 'חברה'],
    definition: 'ב-80% מהמקרים, 20% מהסיבות מייצרות 80% מהתוצאות. התפלגות שאינה אחידה — מיעוט של גורמים מייצר רוב ההשפעה.',
    mechanism: 'חוק חזקה (Power Law): בחלוקה לא-אחידה, ההתפלגות מצייתת לחוק חזקה ולא לנורמל. מה שמוביל מוביל הרבה יותר.',
    examples: [
      { domain: 'כלכלה', description: '20% מהלקוחות מייצרים 80% מהרווח; 20% מהמוצרים = 80% מהמכירות' },
      { domain: 'חברה', description: '20% מהכבישים סופגים 80% מהתנועה; 20% מהאנשים מייצרים 80% מהתוכן ברשת' },
      { domain: 'ביולוגיה', description: '20% מהמינים מייצרים 80% מהביומסה באקוסיסטם' },
    ],
    evidence_strength: 5,
    correlations: ['diminishing-returns', 'zipf-law', 'minority-rule'],
    source: 'Vilfredo Pareto (1896)',
    created_by: 'system',
    tags: ['80/20', 'התפלגות', 'יעילות', 'כוח'],
  },

  {
    id: 'zipf-law',
    name: 'חוק זיפ',
    name_en: "Zipf's Law",
    domain: ['תרבות', 'עיר', 'ביולוגיה'],
    definition: 'המילה השנייה הנפוצה ביותר בשפה מופיעה בחצי מתדירות הראשונה. השלישית — בשליש. ברשימות רבות בטבע ובתרבות — הדירוג n מופיע 1/n פעמים.',
    mechanism: 'מינימיזציה סימולטנית של מאמץ הדובר ומאמץ השומע. הוצג גם בגדלי ערים, עושר, חברות, מין — בטבע ובחברה.',
    examples: [
      { domain: 'תרבות', description: 'בעברית: "של" מופיעה פי 2 יותר מהמילה השנייה, פי 3 יותר מהשלישית' },
      { domain: 'עיר', description: 'ערי ישראל: תל אביב > חיפה > ירושלים ביחס קרוב ל-1:0.5:0.33 לפי היסטוריה' },
      { domain: 'כלכלה', description: 'חברות: ענקיות כמו Apple שוות פי 2 מהשנייה, פי 3 מהשלישית' },
    ],
    evidence_strength: 5,
    correlations: ['pareto-principle', 'peto-paradox'],
    source: "George Kingsley Zipf (1949), 'Human Behavior and the Principle of Least Effort'",
    created_by: 'system',
    tags: ['שפה', 'התפלגות', 'ערים', 'חזקה'],
  },

  {
    id: 'conways-law',
    name: 'חוק קונווי',
    name_en: "Conway's Law",
    domain: ['תרבות', 'כלכלה'],
    definition: 'ארגונים תמיד מייצרים מערכות שמשקפות את מבנה התקשורת הפנים-ארגוני שלהם. עיצוב מוצר = מפת הארגון.',
    mechanism: 'מה שנמצא בגבולות הארגון (טיפול קל) יצוף לממשקים; מה שחוצה גבולות (טיפול קשה) יישאר רופף.',
    examples: [
      { domain: 'תרבות', description: 'מערכות תוכנה עם 3 צוותים — לרוב מייצרות אדריכלות עם 3 שכבות' },
      { domain: 'עיר', description: 'עיר שמוניציפליות שלה מחולקת למחלקות — יוצרת אזורי עיר המשקפים את המחלקות' },
      { domain: 'כלכלה', description: 'בנק עם מחלקת פרסום נפרדת — יוצר מוצרים שמרגישים "שווק" ולא "תוכנן"' },
    ],
    evidence_strength: 4,
    correlations: ['dunbar-number', 'murmuration-law'],
    source: 'Melvin Conway (1968)',
    created_by: 'system',
    tags: ['ארגון', 'עיצוב', 'מבנה', 'מוצר'],
  },

  {
    id: 'metcalfe-law',
    name: 'חוק מטקאלף',
    name_en: "Metcalfe's Law",
    domain: ['כלכלה', 'חברה'],
    definition: 'ערך רשת גדל בריבוע מספר המשתמשים. 10 משתמשים = 100 ערך; 100 משתמשים = 10,000 ערך. ההצטרפות של כל משתמש נוסף מועילה לכל הקיימים.',
    mechanism: 'כל זוג חדש של משתמשים = קשר תקשורת חדש. מספר הקשרים = n*(n-1)/2 ≈ n².',
    examples: [
      { domain: 'כלכלה', description: 'WhatsApp: ערך אפסי ל-1 משתמש; ערך אדיר ל-2 מיליארד' },
      { domain: 'חברה', description: 'שפה: ערך שפה גדל עם מספר הדוברים — ולכן אנגלית שווה יותר משוודית' },
      { domain: 'עיר', description: 'תחבורה ציבורית: כל תחנה חדשה מוסיפה ערך לכל התחנות הקיימות' },
    ],
    evidence_strength: 4,
    correlations: ['social-contagion', 'wave-law', 'pareto-principle'],
    source: "Robert Metcalfe (1980), 'Ethernet'",
    created_by: 'system',
    tags: ['רשת', 'ערך', 'אפקט רשת', 'צמיחה'],
  },

  {
    id: 'brooks-law',
    name: 'חוק ברוקס',
    name_en: "Brooks' Law",
    domain: ['תרבות', 'כלכלה'],
    definition: 'הוספת כוח אדם לפרויקט מאחר — מאחרת אותו עוד יותר. תקשורת גדלה כריבוע; הכנסת אנשים חדשים עולה זמן הדרכה ותיאום.',
    mechanism: 'כל עובד חדש = n קשרי תקשורת חדשים עם כל הקיימים. מתחת לסף קריטי — עלות גבוהה מהתועלת.',
    examples: [
      { domain: 'תרבות', description: 'פרויקטי תוכנה: IBM OS/360 — הוספת מתכנתים כשל בפרויקט רק הכפילה את העיכוב' },
      { domain: 'כלכלה', description: 'בניית בניין: 2x פועלים לא = 2x מהירות — יש תיאום שמוגבל פיזית' },
      { domain: 'חברה', description: 'ועדות גדולות: יותר חברים = פחות החלטות. לאחר מספר מסוים — פרלמנט' },
    ],
    evidence_strength: 4,
    correlations: ['dunbar-number', 'conways-law', 'diminishing-returns'],
    source: "Fred Brooks (1975), 'The Mythical Man-Month'",
    created_by: 'system',
    tags: ['פרויקט', 'ניהול', 'תיאום', 'עיכוב'],
  },

  {
    id: 'goodhart-law',
    name: 'חוק גודהארט',
    name_en: "Goodhart's Law",
    domain: ['כלכלה', 'חברה'],
    definition: 'כשמדד הופך למטרה — הוא מפסיק להיות מדד טוב. ניסיון למקסם מדד גורם לעיוות שלו ולאיבוד הקשר עם מה שנועד למדוד.',
    mechanism: 'כשיש תמריצים על מדד ספציפי, אנשים מאופטמים למדד ולא למה שהוא מייצג. עיוות פוגע בתוקף המדד.',
    examples: [
      { domain: 'כלכלה', description: 'מדד ביצועים: כשמשלמים לרופאים לפי מספר ביקורים — מספר הביקורים עולה, לא הבריאות' },
      { domain: 'חברה', description: 'ציון בגרות: כשהוא מטרה עצמאית — תלמידים ממקסמים ציון, לא ידע' },
      { domain: 'עיר', description: 'מדדי "שיעור פשע" — ערים מדווחות פחות פשעים כדי להיראות טוב' },
    ],
    evidence_strength: 5,
    correlations: ['information-cascade', 'conways-law'],
    source: 'Charles Goodhart (1975)',
    created_by: 'system',
    tags: ['מדדים', 'תמריצים', 'עיוות', 'ניהול'],
  },

  {
    id: 'hebbs-law',
    name: 'חוק הב',
    name_en: "Hebb's Law",
    domain: ['ביולוגיה', 'תרבות'],
    definition: 'נוירונים שיורים יחד — מתחברים יחד. כל חזרה מחזקת את הקשר העצבי. למידה = הידוק קשרים; שכחה = הרפיתם.',
    mechanism: 'פלסטיות סינפטית: חיזוק LTP של סינפסות שהופעלו בו-זמנית. ביולוגיה של הרגל, מיומנות וטראומה.',
    examples: [
      { domain: 'ביולוגיה', description: 'לימוד נגינה: כל חזרה מחזקת נתיב עצבי; הקשר בין אצבע לצליל מתהדק' },
      { domain: 'תרבות', description: 'הרגלים תרבותיים: חזרה על פולחן, שיר, סיפור — מחזקת את "הנתיב" הקבוצתי' },
      { domain: 'חברה', description: 'אמונות: ככל שחוזרים עליהן יותר (תקשורת, חינוך) — כך חוזקן גדל בלי קשר לאמיתות' },
    ],
    evidence_strength: 5,
    correlations: ['skill-transfer', 'social-contagion'],
    source: 'Donald Hebb (1949)',
    created_by: 'system',
    tags: ['למידה', 'מוח', 'הרגל', 'פלסטיות'],
  },

  // === חוקי עיר ותרבות (קלאסיים) ===

  {
    id: 'braess-paradox',
    name: 'פרדוקס בראס',
    name_en: "Braess's Paradox",
    domain: ['עיר', 'כלכלה'],
    definition: 'הוספת כביש לרשת עמוסה יכולה להאריך את זמן הנסיעה של כולם, וסגירת כביש יכולה לקצר אותו.',
    mechanism: 'כל נהג בוחר את המסלול הטוב לעצמו. קיצור דרך חדש מושך את כולם לאותו מקטע, ושיווי המשקל החדש גרוע מהקודם. טובת הפרט וטובת הרשת נפרדות.',
    examples: [
      { domain: 'עיר', description: 'סיאול פירקה את הכביש המהיר שמעל נחל צ\'ונגייצ\'ון ושיקמה את הנחל, והתנועה במרכז העיר לא קרסה' },
      { domain: 'ספורט', description: 'קבוצת כדורסל שמעבירה כל התקפה דרך הכוכב שלה נעשית צפויה, ולעתים קולעת פחות' },
      { domain: 'כלכלה', description: 'ערוץ מסחר מהיר חדש מושך את כל הסוחרים לאותו נתיב, והעומס מוחק את היתרון' },
    ],
    evidence_strength: 4,
    correlations: ['induced-demand', 'tragedy-of-commons', 'schelling-point'],
    source: 'Dietrich Braess (1968)',
    created_by: 'system',
    tags: ['תנועה', 'רשת', 'שיווי משקל', 'כבישים'],
  },

  {
    id: 'induced-demand',
    name: 'חוק הביקוש המושרה',
    name_en: 'Induced Demand',
    domain: ['עיר', 'כלכלה'],
    definition: 'הרחבת כביש עמוס מייצרת נסיעות חדשות, עד שהעומס חוזר לרמתו הקודמת.',
    mechanism: 'נתיב נוסף מוזיל את מחיר הנסיעה בזמן. אנשים שנמנעו מלנסוע, נסעו בשעה אחרת או באמצעי אחר, חוזרים לכביש. ההיצע יוצר את הביקוש שלו.',
    examples: [
      { domain: 'עיר', description: 'מחקר על ערי ארצות הברית מצא שהנסועה גדלה כמעט ביחס של אחד לאחד עם תוספת הנתיבים' },
      { domain: 'כלכלה', description: 'דיסק גדול יותר מתמלא, ותיבת דואר מהירה יותר מתמלאת בעוד הודעות' },
      { domain: 'חברה', description: 'הוספת שעות קבלה מזמינה פניות שלא היו מגיעות קודם' },
    ],
    evidence_strength: 4,
    correlations: ['braess-paradox', 'parkinson-law', 'marchetti-constant'],
    source: 'Anthony Downs (1962); Duranton & Turner (2011)',
    created_by: 'system',
    tags: ['תנועה', 'כבישים', 'ביקוש', 'תכנון'],
  },

  {
    id: 'eyes-on-the-street',
    name: 'חוק העיניים על הרחוב',
    name_en: 'Eyes on the Street',
    domain: ['עיר', 'חברה'],
    definition: 'רחוב בטוח הוא רחוב שיש בו אנשים שמביטים בו: חזיתות פעילות, חלונות ותנועה רגלית לאורך היום.',
    mechanism: 'נוכחות רציפה של עוברים ושבים ושל בעלי עסקים יוצרת השגחה טבעית, בלי שוטר ובלי מצלמה. עירוב שימושים מאריך את שעות הפעילות, ולכן את שעות ההשגחה.',
    examples: [
      { domain: 'עיר', description: 'רחוב מסחרי עם דירות מעל החנויות חי גם בערב, לעומת רחוב משרדים שמתרוקן בחמש' },
      { domain: 'חברה', description: 'חצר משותפת שהחלונות פונים אליה מאפשרת לילדים לשחק לבד' },
      { domain: 'ביולוגיה', description: 'בלהקה, ריבוי עיניים מקצר את זמן הגילוי של טורף' },
    ],
    evidence_strength: 3,
    correlations: ['broken-windows', 'murmuration-law', 'adaptive-sleep-law'],
    source: "Jane Jacobs (1961), 'The Death and Life of Great American Cities'",
    created_by: 'system',
    tags: ['רחוב', 'ביטחון', 'עירוב שימושים', 'הליכה'],
  },

  {
    id: 'marchetti-constant',
    name: 'קבוע מרקטי',
    name_en: "Marchetti's Constant",
    domain: ['עיר', 'חברה'],
    definition: 'בני אדם מקדישים לנסיעות יומיות כשעה ביום, בכל תקופה ובכל אמצעי תחבורה.',
    mechanism: 'תקציב הזמן קבוע, והמהירות משתנה. לכן אמצעי תחבורה מהיר יותר לא מקצר את היומיום, אלא מגדיל את העיר: רדיוס העיר שווה למרחק של כחצי שעה.',
    examples: [
      { domain: 'עיר', description: 'עיר של הולכי רגל הייתה ברדיוס של כשניים וחצי קילומטרים; הרכבת והמכונית הרחיבו אותה פי כמה' },
      { domain: 'חברה', description: 'רכבת מהירה לא מקצרת את זמן היוממות, אלא מרחיקה את מקום המגורים' },
      { domain: 'כלכלה', description: 'מחיר הדירה יורד עם זמן ההגעה למרכז, ולא עם המרחק בקילומטרים' },
    ],
    evidence_strength: 3,
    correlations: ['induced-demand', 'urban-scaling', 'dunbar-number'],
    source: 'Cesare Marchetti (1994), על בסיס Yacov Zahavi',
    created_by: 'system',
    tags: ['יוממות', 'זמן', 'גודל עיר', 'תחבורה'],
  },

  {
    id: 'urban-scaling',
    name: 'חוק הסקיילינג העירוני',
    name_en: 'Urban Scaling Law',
    domain: ['עיר', 'כלכלה', 'ביולוגיה'],
    definition: 'כשעיר מכפילה את אוכלוסייתה, התוצר, החדשנות וגם הפשיעה גדלים בכ-15% יותר מפי שניים, והתשתית הנדרשת קטנה בכ-15%.',
    mechanism: 'עיר היא רשת של מפגשים. צפיפות מגדילה את מספר המפגשים לאדם, ולכן את קצב ההמצאה, ההכנסה וגם המחלות. התשתית, כמו כלי דם, מתייעלת עם הגודל.',
    examples: [
      { domain: 'עיר', description: 'מספר הפטנטים והשכר הממוצע עולים עם גודל העיר, וכך גם קצב ההליכה' },
      { domain: 'ביולוגיה', description: 'בעלי חיים גדולים חסכוניים יותר באנרגיה לכל קילוגרם, כפי שעיר גדולה חסכונית בכבישים לנפש' },
      { domain: 'כלכלה', description: 'חברות, בשונה מערים, גדלות בקצב שהולך ומאט, ולכן רובן מתות' },
    ],
    evidence_strength: 4,
    correlations: ['kleiber-law', 'zipf-law', 'metcalfe-law', 'marchetti-constant'],
    source: 'Bettencourt, Lobo, Helbing, Kühnert & West (2007), PNAS',
    created_by: 'system',
    tags: ['גודל עיר', 'חדשנות', 'צפיפות', 'רשת'],
  },

  {
    id: 'kleiber-law',
    name: 'חוק קלייבר',
    name_en: "Kleiber's Law",
    domain: ['ביולוגיה'],
    definition: 'קצב חילוף החומרים של בעל חיים גדל עם מסת הגוף בחזקת שלושה רבעים: גוף גדול פי 16 צורך אנרגיה רק פי 8.',
    mechanism: 'רשתות הובלה מסועפות, כמו כלי דם, מתייעלות עם הגודל. לכן בעלי חיים גדולים חיים לאט יותר: דופק איטי, גדילה איטית וחיים ארוכים.',
    examples: [
      { domain: 'ביולוגיה', description: 'לב של עכבר פועם כ-600 פעמים בדקה, ולב של פיל כ-30' },
      { domain: 'עיר', description: 'עיר גדולה צריכה פחות תחנות דלק וקילומטרים של צנרת לכל תושב' },
      { domain: 'כלכלה', description: 'יתרון לגודל: עלות ליחידה יורדת כשהרשת גדלה' },
    ],
    evidence_strength: 5,
    correlations: ['urban-scaling', 'peto-paradox', 'diminishing-returns'],
    source: 'Max Kleiber (1932)',
    created_by: 'system',
    tags: ['אנרגיה', 'גודל', 'רשת', 'חילוף חומרים'],
  },

  {
    id: 'tragedy-of-commons',
    name: 'הטרגדיה של נחלת הכלל',
    name_en: 'Tragedy of the Commons',
    domain: ['כלכלה', 'חברה', 'עיר'],
    definition: 'משאב משותף שכל אחד מנצל לטובתו נשחק עד שהוא אובד לכולם.',
    mechanism: 'הרווח מניצול נוסף שייך ליחיד, והמחיר מתחלק בין כולם. בלי כללים, בעלות או נורמה קהילתית, ההיגיון של כל פרט מוביל להרס משותף.',
    examples: [
      { domain: 'עיר', description: 'חניה חינם ברחוב מתמלאת, והחיפוש אחריה מוסיף תנועה לכל הרחוב' },
      { domain: 'ביולוגיה', description: 'דיג יתר: כל ספינה מרוויחה מעוד רשת, עד שהלהקה קורסת' },
      { domain: 'חברה', description: 'קהילות שמנהלות יחד מים או מרעה לאורך דורות מראות שכללים מקומיים מונעים את הטרגדיה' },
    ],
    evidence_strength: 4,
    correlations: ['braess-paradox', 'goodhart-law', 'minority-rule'],
    source: 'Garrett Hardin (1968); Elinor Ostrom (1990)',
    created_by: 'system',
    tags: ['משאב משותף', 'מרחב ציבורי', 'כללים', 'קהילה'],
  },

  {
    id: 'broken-windows',
    name: 'תאוריית החלונות השבורים',
    name_en: 'Broken Windows Theory',
    domain: ['עיר', 'חברה'],
    definition: 'סימן גלוי של הזנחה, כמו חלון שבור שלא תוקן, משדר שאין משגיח ומזמין הזנחה נוספת.',
    mechanism: 'הסביבה היא מסר על הנורמה. אנשים מתאימים את ההתנהגות למה שהם רואים סביבם. התאוריה שנויה במחלוקת: הראיות להשפעה על פשיעה חמורה חלשות.',
    examples: [
      { domain: 'עיר', description: 'פינה שמצטברת בה פסולת מושכת עוד פסולת, ופינה נקייה נשארת נקייה זמן רב יותר' },
      { domain: 'חברה', description: 'בניסוי בהולנד, אנשים השליכו יותר עלונים לרצפה כשהקיר לידם היה מכוסה גרפיטי' },
      { domain: 'תרבות', description: 'בקוד תוכנה, קובץ מוזנח אחד מוריד את הרף של כל מי שנוגע בו אחר כך' },
    ],
    evidence_strength: 2,
    correlations: ['eyes-on-the-street', 'social-contagion', 'information-cascade'],
    source: 'Wilson & Kelling (1982); Keizer, Lindenberg & Steg (2008)',
    created_by: 'system',
    tags: ['הזנחה', 'נורמה', 'מרחב ציבורי', 'תחזוקה'],
  },

  {
    id: 'matthew-effect',
    name: 'אפקט מתיו',
    name_en: 'Matthew Effect',
    domain: ['תרבות', 'חברה', 'כלכלה'],
    definition: 'מי שיש לו יקבל עוד: יתרון ראשוני קטן מושך אליו משאבים והכרה, והפער גדל מעצמו.',
    mechanism: 'יתרון מצטבר. תשומת לב, כסף וקשרים זורמים אל מי שכבר בולט, כי בולטות היא האות הזול ביותר לאיכות.',
    examples: [
      { domain: 'תרבות', description: 'מדען מפורסם מקבל את רוב הקרדיט על תגלית משותפת, ושיר שנכנס למצעד מושמע עוד' },
      { domain: 'עיר', description: 'רחוב שכבר מצליח מושך אליו עוד עסקים, והרחוב הסמוך מתרוקן' },
      { domain: 'כלכלה', description: 'הון מניב תשואה, והתשואה מגדילה את ההון' },
    ],
    evidence_strength: 4,
    correlations: ['pareto-principle', 'zipf-law', 'information-cascade', 'metcalfe-law'],
    source: 'Robert K. Merton (1968)',
    created_by: 'system',
    tags: ['יתרון מצטבר', 'אי שוויון', 'הכרה', 'מוניטין'],
  },

  {
    id: 'parkinson-law',
    name: 'חוק פרקינסון',
    name_en: "Parkinson's Law",
    domain: ['תרבות', 'כלכלה'],
    definition: 'העבודה מתרחבת עד שהיא ממלאת את כל הזמן שהוקצה לה.',
    mechanism: 'בלי אילוץ, המשימה מתנפחת: עוד בדיקות, עוד ישיבות ועוד שכבות. מנגנון שמייצר עבודה לעצמו גדל בלי קשר לכמות התפוקה.',
    examples: [
      { domain: 'תרבות', description: 'ישיבה שנקבעה לשעה נמשכת שעה, גם כשהנושא נסגר בעשר דקות' },
      { domain: 'עיר', description: 'הליך רישוי שהוקצבו לו חודשים מתמלא בסבבי הערות עד המועד האחרון' },
      { domain: 'כלכלה', description: 'ההוצאות עולות עד גובה ההכנסה' },
    ],
    evidence_strength: 3,
    correlations: ['induced-demand', 'brooks-law', 'goodhart-law'],
    source: 'C. Northcote Parkinson (1955), The Economist',
    created_by: 'system',
    tags: ['זמן', 'ארגון', 'בירוקרטיה', 'אילוץ'],
  },
];

export function getLawsByDomain(domain: Domain): Law[] {
  return INITIAL_LAWS.filter(law => law.domain.includes(domain));
}

export function getLawById(id: string): Law | undefined {
  return INITIAL_LAWS.find(law => law.id === id);
}

export function getCorrelatedLaws(lawId: string): Law[] {
  const law = getLawById(lawId);
  if (!law) return [];
  return law.correlations
    .map(id => getLawById(id))
    .filter((l): l is Law => l !== undefined);
}

export const ALL_DOMAINS: Domain[] = ['ביולוגיה', 'חברה', 'ספורט', 'עיר', 'תרבות', 'כלכלה'];
