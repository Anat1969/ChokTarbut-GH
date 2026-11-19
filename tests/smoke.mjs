// בדיקת עשן מול `vite preview`: כל המסכים, שלושת המנועים (עם שרת AI מדומה), נייד בלי גלילה אופקית.
// הרצה: npm run build && npm run preview -- --port 4173 &  ואז  node tests/smoke.mjs [תיקיית צילומים]
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

// require ולא import: כך Playwright נמצא גם כשהוא מותקן גלובלית (NODE_PATH)
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
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
  await page.waitForSelector('svg[aria-label="מפת הקשרים בין החוקים"]');
  assert.equal(await page.locator('.map-node').count(), 30, '30 חוקים במפה');
  const fits = await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1);
  assert.ok(fits, 'דף הבית בגודל המסך, בלי גלילה');
  await page.locator('.map-node', { hasText: 'מספר דנבר' }).click();
  await page.waitForSelector('article h2:has-text("מספר דנבר")');
  await shot(page, 'home-desktop');
  await page.getByRole('button', { name: /^עיר/ }).click();
  await shot(page, 'home-filter');

  await page.getByRole('link', { name: 'גלה', exact: true }).first().click();
  await page.waitForURL('**/library');
  await page.getByRole('button', { name: 'לפי חוזק ראיות' }).click();
  await page.locator('button.row', { hasText: 'פרדוקס בראס' }).click();
  await page.waitForSelector('article h2:has-text("פרדוקס בראס")');
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
  assert.equal(await page.locator('mark.marker').count() > 0, true, 'מרקר בתשובת ה-AI');
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
  await shot(page, 'mylaws-desktop');
  // מחיקה: אישור לפני, וביטול אחרי
  await page.locator('li', { hasText: 'חוק בדיקה' }).getByRole('button', { name: 'מחיקה' }).click();
  await page.getByRole('button', { name: 'כן, למחוק' }).click();
  assert.equal(await page.locator('h3:has-text("חוק בדיקה")').count(), 0);
  await page.getByRole('button', { name: 'ביטול המחיקה' }).click();
  await page.waitForSelector('h3:has-text("חוק בדיקה")');

  await page.goto(`${BASE}/law/zipf-law`);
  await page.waitForSelector('h2:has-text("חוק זיפ")');
  await shot(page, 'law-desktop');
  await page.goto(`${BASE}/law/not-a-law`);
  await page.waitForSelector('text=החוק הזה לא נמצא במאגר');

  await page.getByRole('button', { name: 'תפריט' }).click();
  await page.waitForSelector('input[type="email"]');
  await shot(page, 'menu-desktop');

  assert.deepEqual([...new Set(requests)].sort(), ['correlations', 'create', 'explain']);
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
