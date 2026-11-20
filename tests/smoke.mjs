// בדיקת עשן מול `vite preview`: כל המסכים, שלושת המנועים (עם שרת AI מדומה), נייד בלי גלילה אופקית.
// הרצה: npm run build && npm run preview -- --port 4173 &  ואז  node tests/smoke.mjs [תיקיית צילומים]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

// require ולא import: כך Playwright נמצא גם כשהוא מותקן גלובלית (NODE_PATH)
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
// תמונת בדיקה: PNG של פיקסל אחד
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const SHOTS = process.argv[2];

const MOCK = {
  explain: {
    matched_law_ids: ['induced-demand', 'braess-paradox'],
    insight: 'ההרחבה מייצרת **ביקוש** חדש.',
    explanation: 'נתיב נוסף מוזיל את **מחיר הנסיעה**, ולכן מושך נסיעות חדשות.',
    per_law: [{ id: 'induced-demand', how: 'תוספת נתיבים מייצרת **נסיעות** חדשות.' }],
    additional_examples: [{ domain: 'כלכלה', description: 'דיסק גדול יותר מתמלא.' }],
    by: 'gemini',
  },
  create: {
    name: 'חוק בדיקה',
    name_en: 'Test Law',
    definition: 'הגדרה של **חוק בדיקה**.',
    mechanism: 'מנגנון.',
    examples: [{ domain: 'עיר', description: 'דוגמה עירונית.' }],
    why_novel: 'מגלה **צומת** חדש.',
    domain: ['עיר', 'חברה'],
    tags: ['בדיקה'],
    by: 'gemini',
  },
  correlations: {
    correlations: [{ law_name: 'אפקט רשת', domain: 'כלכלה', shared_mechanism: 'מנגנון **משותף**.', surprise: 'מפתיע.' }],
    meta_pattern: 'דפוס **על**.',
    by: 'gemini',
  },
};

// ענן מדומה לתמונות: היומן chok_images והדלי chok-images
const cloud = [];

const browser = await chromium.launch();
const requests = [];

async function open(viewport) {
  const ctx = await browser.newContext({ viewport, locale: 'he-IL' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('**/functions/v1/chok-ai*', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    requests.push(body.mode);
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK[body.mode] ?? { error: 'mode' }) });
  });
  await page.route('**/functions/v1/chok-plus*', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    requests.push(body.mode);
    const out =
      body.mode === 'apps'
        ? { insight: 'אימות **ברחוב** אמיתי.', picks: [{ id: 'a1', title: 'אפליקציית בדיקה', url: 'https://example.com', proves: 'מראה **דירוג** רחובות.', experiment: 'האם הרחוב המדורג ראשון פעיל גם בערב?' }] }
        : { definition: 'הגדרה אוטומטית.', mechanism: 'מנגנון אוטומטי.', example: 'דוגמה מהעיר.', domains: ['עיר'], family: 'contagion' };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(out) });
  });
  await page.route('**/functions/v1/chok-upload*', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    requests.push(`image-${body.mode}`);
    const path = body.mode === 'upload' ? `${body.law_id}/${cloud.length}.jpg` : body.mode === 'restore' ? body.path : null;
    cloud.unshift({ law_id: body.law_id, path });
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ law_id: body.law_id, path }) });
  });
  await page.route('**/rest/v1/chok_images*', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(cloud) }));
  await page.route('**/storage/v1/object/public/chok-images/**', (route) => route.fulfill({ contentType: 'image/png', body: TINY_PNG }));
  await page.route('**/auth/v1/settings', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ external: { google: false } }) }),
  );
  return { page, errors, ctx };
}

const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });
const noSideScroll = async (page, name) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(over <= 1, `גלילה אופקית במסך ${name}: ${over}px`);
};

// ---------- מחשב ----------
{
  const { page, errors } = await open({ width: 1440, height: 900 });

  await page.goto(BASE);
  await page.waitForSelector('[aria-label="הטבלה המחזורית של ההתנהגות"]');
  assert.equal(await page.locator('button.tile').count(), 80, '80 אריחים: כל חוק בכל תחום שבו הוא נצפה');
  assert.equal(await page.locator('.pt-empty').count(), 7, '7 משבצות ריקות');
  const fits = await page.evaluate(() => {
    const t = document.querySelector('.ptable').getBoundingClientRect();
    return t.bottom <= window.innerHeight && t.left >= 0;
  });
  assert.ok(fits, 'הטבלה כולה בתוך המסך הראשון');
  await page.locator('button.tile', { hasText: 'דנבר' }).first().click();
  await page.waitForSelector('article h2:has-text("מספר דנבר")');
  assert.ok((await page.locator('button.tile.is-dim').count()) > 20, 'חוקים לא קשורים מעומעמים');
  await shot(page, 'home-desktop');
  await page.locator('.pt-family', { hasText: 'גודל וסקייל' }).click();
  await page.waitForSelector('text=עיר גדולה אינה עיר קטנה מוגדלת');
  await page.getByRole('button', { name: 'רשת קשרים' }).click();
  assert.equal(await page.locator('.map-node').count(), 41, '41 חוקים ברשת');
  await page.getByRole('button', { name: 'טבלה', exact: true }).click();
  // משבצת ריקה מובילה למחולל, עם יעד
  await page.getByRole('button', { name: 'משבצת ריקה: פרט מול כלל בספורט' }).click();
  await shot(page, 'home-cell');
  await page.getByRole('link', { name: 'מלאי את המשבצת' }).click();
  await page.waitForURL('**/create?family=dilemma*');
  assert.equal(await page.locator('button.row[aria-pressed="true"]').count(), 2, 'שני חוקי מקור נבחרו מראש');
  // ניסוח ידני
  await page.getByRole('button', { name: 'אני מנסחת' }).click();
  await page.getByPlaceholder('עד חמש מילים').fill('חוק ידני');
  // ניסוח אוטומטי ממלא את השדות הריקים
  await page.getByRole('button', { name: 'נסחי בשבילי' }).click();
  await page.waitForFunction(() => document.querySelector('textarea')?.value === 'הגדרה אוטומטית.');
  await page.getByRole('button', { name: 'שמרי בחוקים שלי' }).click();
  await page.waitForSelector('text="חוק ידני" נשמר');
  await shot(page, 'create-manual');
  await page.goto(BASE);
  await page.waitForSelector('.tile.is-mine:has-text("חוק ידני")');
  assert.equal(await page.locator('.pt-empty').count(), 6, 'המשבצת התמלאה');

  await page.getByRole('link', { name: 'גלה', exact: true }).first().click();
  await page.waitForURL('**/library');
  await page.waitForSelector('h2:has-text("הדבקה וסף")'); // ברירת המחדל: לפי משפחת מנגנון
  await page.getByRole('button', { name: 'לפי חוזק ראיות' }).click();
  await page.locator('button.row', { hasText: 'פרדוקס בראס' }).click();
  await page.waitForSelector('.cover-title:has-text("פרדוקס בראס")');
  await page.getByRole('button', { name: 'גלי קשרים מפתיעים' }).click();
  await page.waitForSelector('text=אפקט רשת');
  await page.getByRole('button', { name: 'סמני לחוקים שלי' }).click();
  await shot(page, 'library-desktop');
  await page.getByLabel('חיפוש חוק').fill('אין-כזה-חוק');
  await page.waitForSelector('text=לא נמצא חוק שמתאים לחיפוש');

  await page.goto(`${BASE}/explain`);
  await page.getByLabel('תיאור התופעה').fill('למה הרחבת כביש לא פותרת את הפקק?');
  await page.getByRole('button', { name: 'הסבירי לי' }).click();
  await page.waitForSelector('text=חוק הביקוש המושרה');
  await page.waitForSelector('mark.marker'); // מרקר בתשובת ה-AI
  await shot(page, 'explain-desktop');
  await page.getByRole('link', { name: 'צרי חוק חדש מהחוקים האלה' }).click();

  await page.waitForURL('**/create?with=*');
  await page.getByRole('button', { name: 'צרי חוק חדש', exact: true }).click();
  await page.waitForSelector('h2:has-text("חוק בדיקה")');
  await page.getByRole('button', { name: 'שמרי בחוקים שלי' }).click();
  await shot(page, 'create-desktop');

  await page.goto(`${BASE}/my-laws`);
  await page.waitForSelector('h3:has-text("חוק בדיקה")');
  await page.waitForSelector('h3:has-text("פרדוקס בראס")');
  await page.reload();
  await page.waitForSelector('h3:has-text("חוק בדיקה")'); // נשמר אחרי רענון
  await page.waitForSelector('h3:has-text("חוק ידני")');
  await shot(page, 'mylaws-desktop');
  // מחיקה: אישור לפני, וביטול אחרי
  await page.locator('li', { hasText: 'חוק בדיקה' }).getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('button', { name: 'כן, למחוק' }).click();
  assert.equal(await page.locator('h3:has-text("חוק בדיקה")').count(), 0);
  await page.getByRole('button', { name: 'ביטול המחיקה' }).click();
  await page.waitForSelector('h3:has-text("חוק בדיקה")');

  await page.goto(`${BASE}/law/zipf-law`);
  await page.waitForSelector('.cover-title:has-text("חוק זיפ")');
  await page.waitForSelector('[data-slot="image"] .cover-body'); // טקסט המנגנון על לוח התמונה
  assert.equal(await page.locator('[data-slot="image"] .cover-text button').count(), 0, 'אין כפתורים על התמונה');
  // שום טקסט בשער לא נחתך
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll('.cover p, .cover h1')].filter((el) => {
      const r = el.getBoundingClientRect();
      const p = el.closest('.cover-panel').getBoundingClientRect();
      return r.bottom > p.bottom + 1 || r.top < p.top - 1;
    }).length,
  );
  assert.equal(clipped, 0, 'טקסט חתוך בשער');
  await page.waitForSelector('h3:has-text("אותו חוק, בתחומים שונים")'); // ההמשך, בגלילה
  // השער: לוח תמונה ולוח מנגנון. הגרפיקה נשארת תמיד, והתמונה נשמרת בענן ושורדת רענון
  await page.waitForSelector('[data-slot="graphic"] svg.glyph');
  await page.waitForSelector('[data-slot="image"].is-empty');
  await page.getByRole('button', { name: 'הצגת הפרומפט' }).click();
  await page.waitForSelector('text=Documentary realism');
  await page.locator('input[type=file]').setInputFiles({ name: 't.png', mimeType: 'image/png', buffer: TINY_PNG });
  await page.waitForSelector('text=התמונה נשמרה לתמיד בענן');
  await page.waitForSelector('[data-slot="image"] img');
  await page.waitForSelector('[data-slot="graphic"] svg.glyph'); // הגרפיקה לא נדרסה
  await page.reload();
  await page.waitForSelector('[data-slot="image"] img');
  await page.getByRole('button', { name: 'ריקון השער' }).click();
  await page.getByRole('button', { name: 'כן, לרוקן' }).click();
  await page.waitForSelector('[data-slot="image"].is-empty');
  await page.getByRole('button', { name: 'החזרת התמונה' }).click();
  await page.waitForSelector('[data-slot="image"] img');
  // אימות באפליקציות אחרות
  await page.getByRole('button', { name: 'מצאי אפליקציות שמאמתות' }).click();
  await page.waitForSelector('a:has-text("אפליקציית בדיקה")');
  await shot(page, 'law-desktop');
  await page.goto(`${BASE}/law/not-a-law`);
  await page.waitForSelector('text=החוק הזה לא נמצא במאגר');

  await page.getByRole('button', { name: 'תפריט' }).click();
  await page.waitForSelector('input[type="email"]');
  await shot(page, 'menu-desktop');

  assert.deepEqual([...new Set(requests)].sort(), ['apps', 'correlations', 'create', 'draft', 'explain', 'image-clear', 'image-restore', 'image-upload']);
  assert.deepEqual(errors, [], 'אין שגיאות בדפדפן');
}

// ---------- נייד ----------
{
  const { page, errors } = await open({ width: 390, height: 844 });
  for (const [path, name] of [['/', 'home'], ['/library', 'library'], ['/explain', 'explain'], ['/create', 'create'], ['/my-laws', 'mylaws'], ['/law/dunbar-number', 'law']]) {
    await page.goto(BASE + path);
    await page.waitForSelector('main');
    await noSideScroll(page, name);
    await shot(page, `${name}-mobile`);
  }
  await page.goto(`${BASE}/library`);
  await page.locator('button.row', { hasText: 'חוק זיפ' }).click();
  await page.waitForURL('**/law/zipf-law');
  assert.deepEqual(errors, []);
}

// ---------- כשה-AI נופל: התאמה מקומית, לא דף ריק ----------
{
  const { page } = await open({ width: 1440, height: 900 });
  await page.unroute('**/functions/v1/chok-ai*');
  await page.route('**/functions/v1/chok-ai*', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"x"}' }));
  await page.goto(`${BASE}/explain`);
  await page.getByLabel('תיאור התופעה').fill('למה פקק בכביש לא נפתר אחרי הרחבה');
  await page.getByRole('button', { name: 'הסבירי לי' }).click();
  await page.waitForSelector('text=ה-AI לא זמין כרגע');
  await page.waitForSelector('text=התאמה מקומית, בלי AI.');
  await shot(page, 'explain-fallback');
}

await browser.close();
console.log('הבדיקה עברה: כל המסכים, שלושת המנועים, נייד, וגיבוי בלי AI');
