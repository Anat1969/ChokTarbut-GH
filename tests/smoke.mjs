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
    correlations: [
      { law_name: 'אפקט רשת', domain: 'כלכלה', shared_mechanism: 'מנגנון **משותף**.', surprise: 'מפתיע.' },
      { law_name: 'חוק זיפ', domain: 'תרבות', shared_mechanism: 'מנגנון **אחר**.', surprise: 'מפתיע.' },
    ],
    meta_pattern: 'דפוס **על**.',
    by: 'gemini',
  },
};

// ענן מדומה לתמונות: היומן chok_images והדלי chok-images
const cloud = [];
// ענן מדומה לתיקים ולחוקים שלי: הטבלאות chok_field_cases ו-chok_my_laws, והפונקציות במסד
const cloudCases = new Map();
const cloudLaws = new Map();
const promotedLaws = [];
const cloudArticles = new Map();
const cloudFindings = [];

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
        : body.mode === 'article'
          ? { text: 'כותרת מה-AI\n\n## התופעה\nשורה.\n\n**תובנה ראשונה.**\n\n## המנגנון\nשורה.\n\n**תובנה שנייה.**\n\n## בעיר\nשורה.\n\n**תובנה שלישית.**' }
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
  await page.route('**/rest/v1/chok_field_cases*', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([...cloudCases.values()].filter((c) => !c.deleted)) }),
  );
  await page.route('**/rest/v1/rpc/chok_case_*', async (route) => {
    const b = JSON.parse(route.request().postData() ?? '{}');
    if (route.request().url().includes('chok_case_save')) {
      requests.push('case-save');
      cloudCases.set(b.p_id, { id: b.p_id, law_id: b.p_law_id, phenomenon: b.p_phenomenon, verdict: b.p_verdict, decision: b.p_decision, created_at: b.p_created_at });
    } else {
      requests.push('case-remove');
      const c = cloudCases.get(b.p_id);
      if (c) c.deleted = true;
    }
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/rest/v1/chok_findings*', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(cloudFindings) }),
  );
  await page.route('**/rest/v1/rpc/chok_finding_save', async (route) => {
    const b = JSON.parse(route.request().postData() ?? '{}');
    requests.push('finding-save');
    cloudFindings.push({ law_id: b.p_law_id, kind: b.p_kind, data: b.p_data });
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/rest/v1/chok_articles*', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([...cloudArticles].map(([law_id, text]) => ({ law_id, text }))) }),
  );
  await page.route('**/rest/v1/rpc/chok_article_save', async (route) => {
    const b = JSON.parse(route.request().postData() ?? '{}');
    requests.push('article-save');
    cloudArticles.set(b.p_law_id, b.p_text);
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/rest/v1/chok_my_laws*', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify([...cloudLaws.values()].filter((l) => !l.deleted)) }),
  );
  // חוקים שהוכנסו למאגר: chok_laws עם created_by=anat, והפונקציה chok_law_promote
  await page.route('**/rest/v1/chok_laws*', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(promotedLaws) }));
  await page.route('**/rest/v1/rpc/chok_law_promote', async (route) => {
    const b = JSON.parse(route.request().postData() ?? '{}');
    requests.push('law-promote');
    const l = cloudLaws.get(b.p_id);
    if (l && !promotedLaws.some((x) => x.id === b.p_id)) {
      promotedLaws.push({ ...l, evidence_strength: 1, correlations: l.parent_law_ids, source: 'ניסחה ענת. לא אומת.', created_by: 'anat', family: b.p_family });
    }
    await route.fulfill({ status: 204, body: '' });
  });
  await page.route('**/rest/v1/rpc/chok_my_law_*', async (route) => {
    const b = JSON.parse(route.request().postData() ?? '{}');
    if (route.request().url().includes('chok_my_law_save')) {
      requests.push('law-save');
      cloudLaws.set(b.p.id, { ...b.p });
    } else {
      requests.push('law-remove');
      const l = cloudLaws.get(b.p_id);
      if (l) l.deleted = true;
    }
    await route.fulfill({ status: 204, body: '' });
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

  await page.goto(`${BASE}/open`);
  await page.waitForSelector('[aria-label="הטבלה המחזורית של ההתנהגות"]');
  assert.equal(await page.locator('button.tile').count(), 93, '93 אריחים: כל חוק בכל תחום שבו הוא נצפה');
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
  assert.equal(await page.locator('.map-node').count(), 47, '47 חוקים ברשת');
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
  await page.goto(`${BASE}/open`);
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
  // תיקים: הכרעה על כל חוק שנמצא הופכת את התופעה לתקדים
  await page.getByRole('group', { name: 'תיק לחוק הביקוש המושרה' }).getByRole('button', { name: 'חל כאן', exact: true }).click();
  await page.getByRole('group', { name: 'תיק לפרדוקס בראס' }).getByRole('button', { name: 'לא חל כאן' }).click();
  assert.equal(await page.locator('text=נשמר כתיק בחוק').count(), 2, 'שני תיקים נשמרו');
  await shot(page, 'explain-desktop');
  await page.goto(`${BASE}/law/induced-demand`);
  await page.waitForSelector('section[aria-label="תיקים מהשטח"] li:has-text("למה הרחבת כביש")');
  await page.getByRole('button', { name: 'פתחי תיק' }).click();
  await page.getByLabel('התופעה').fill('נתיב תחבורה ציבורית ברחוב הרצל');
  await page.getByRole('radio', { name: /הובחן/ }).click();
  await page.getByLabel('ההחלטה').fill('לא מרחיבים, מוסיפים נת"צ');
  await page.getByRole('button', { name: 'שמרי את התיק' }).click();
  await page.waitForSelector('text=לא מרחיבים, מוסיפים נת"צ');
  await page.waitForSelector('section[aria-label="תיקים מהשטח"] >> text=1 הופעל');
  await shot(page, 'law-cases');
  await page.reload();
  assert.equal(await page.locator('section[aria-label="תיקים מהשטח"] li').count(), 2, 'התיקים נשמרו אחרי רענון');
  assert.equal([...cloudCases.values()].length, 3, 'שלושת התיקים הגיעו לענן, בלי התחברות');
  // מכשיר אחר, בלי שום דבר שמור: התיקים נמשכים מהענן
  {
    const other = await open({ width: 1440, height: 900 });
    await other.page.goto(`${BASE}/law/induced-demand`);
    await other.page.waitForSelector('section[aria-label="תיקים מהשטח"] li:has-text("נתיב תחבורה ציבורית")');
    await other.ctx.close();
  }
  await page.goto(`${BASE}/open`);
  await page.waitForSelector('[aria-label="הטבלה המחזורית של ההתנהגות"]');
  assert.ok((await page.locator('button.tile.has-cases').count()) >= 2, 'אריחים עם תיקים מסומנים בטבלה');
  await page.goto(`${BASE}/explain`);
  await page.getByLabel('תיאור התופעה').fill('למה הרחבת כביש לא פותרת את הפקק?');
  await page.getByRole('button', { name: 'הסבירי לי' }).click();
  await page.waitForSelector('text=חוק הביקוש המושרה');
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
  assert.ok([...cloudLaws.values()].some((l) => l.name === 'חוק בדיקה'), 'החוק שנוצר הגיע לענן, בלי התחברות');
  // מכשיר אחר: החוקים שלי נמשכים מהענן
  {
    const other = await open({ width: 1440, height: 900 });
    await other.page.goto(`${BASE}/my-laws`);
    await other.page.waitForSelector('h3:has-text("חוק בדיקה")');
    await other.ctx.close();
  }
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
  // ממצאים: מה שה-AI גילה נשמר בענן, ומופיע שוב במכשיר אחר בלי ללחוץ, וגם בכתבה
  {
    assert.equal(cloudFindings.length, 2, 'קשרים ואפליקציות נשמרו בענן');
    const other = await open({ width: 1440, height: 900 });
    await other.page.goto(`${BASE}/law/zipf-law`);
    await other.page.waitForSelector('a:has-text("אפליקציית בדיקה")');
    await other.page.goto(`${BASE}/law/braess-paradox`);
    await other.page.waitForSelector('text=אפקט רשת');
    await other.page.waitForSelector('button:has-text("חפשי קשרים חדשים")');
    // חוק שלא קיים במאגר מסומן, עם המקור שלו. חוק שקיים מקושר
    assert.equal(await other.page.locator('.found-new').count(), 1, 'רק החוק שלא במאגר מסומן');
    await other.page.waitForSelector('text=ה-AI הציע אותו בחיפוש קשרים מפתיעים ל"פרדוקס בראס"');
    await other.page.waitForSelector('a[href="/law/zipf-law"]:has-text("חוק זיפ")');
    await other.page.goto(`${BASE}/articles?law=braess-paradox`);
    await other.page.waitForSelector('section[aria-label="מה התגלה בדרך"] >> text=אפקט רשת');
    // הדפסה: הכתבה נכנסת לדף A4 אחד, והגופן מותאם כך שהיא לא גולשת
    await other.page.evaluate(() => { window.print = () => { window.__printed = true; }; });
    await other.page.getByRole('button', { name: 'הדפסה על דף אחד' }).click();
    await other.page.waitForFunction(() => window.__printed === true);
    const sheet = await other.page.evaluate(() => {
      const el = document.querySelector('.a4-sheet');
      const body = el.querySelector('.a4-body');
      return { fits: el.scrollHeight <= el.clientHeight + 1 && body.scrollWidth <= body.clientWidth + 1, title: el.querySelector('h1').textContent };
    });
    assert.ok(sheet.fits, 'הכתבה נכנסת כולה לדף אחד');
    assert.equal(sheet.title, 'עוד כביש, יותר פקק');
    const pdf = await other.page.pdf({ preferCSSPageSize: true, printBackground: true });
    assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length, 1, 'ה-PDF הוא דף אחד');
    // חוק שלא קיים במאגר: "הפכי לחוק" פותח את הניסוח הידני עם השם ועם חוק המקור
    await other.page.goto(`${BASE}/law/braess-paradox`);
    await other.page.getByRole('link', { name: 'הפכי לחוק' }).click();
    await other.page.waitForURL('**/create?with=braess-paradox&name=*');
    assert.equal(await other.page.locator('input[value="אפקט רשת"]').count(), 1, 'השם של החוק מולא בטופס');
    await shot(other.page, 'article-findings-desktop');
    await other.ctx.close();
  }
  // כתבות: כתבה לכל תחום, שני טורים, ושמירה דרך הפונקציה בענן
  await page.goto(`${BASE}/articles`);
  assert.equal(await page.locator('button.row').count(), 7, 'כתבה אחת לכל אחד משבעת התחומים');
  await page.locator('button.row', { hasText: 'עוד כביש, יותר פקק' }).click();
  await page.waitForURL('**/articles?law=braess-paradox');
  await page.waitForSelector('h2:has-text("עוד כביש, יותר פקק")');
  assert.equal(await page.locator('[data-col="main"] .article-insight').count(), 3, 'תובנה בסוף כל פרק');
  await shot(page, 'articles-desktop');
  await page.getByRole('link', { name: 'עריכת הכתבה' }).click();
  await page.getByRole('button', { name: 'עריכת הכתבה' }).click();
  await page.locator('textarea').fill('כותרת בדיקה\n\n## פרק\nשורה.\n\n**תובנה.**');
  await page.getByRole('button', { name: 'שמירה' }).click();
  await page.waitForSelector('text=נשמר בענן.');
  await page.goto(`${BASE}/articles?law=braess-paradox`);
  await page.waitForSelector('h2:has-text("כותרת בדיקה")');

  // טיוטת כתבה מה-AI: נפתחת לעריכה, ונשמרת רק בלחיצה
  await page.goto(`${BASE}/law/zipf-law?tab=article`);
  await page.getByRole('button', { name: 'נסחי טיוטה' }).click();
  await page.waitForSelector('text=טיוטה, נוסח בידי AI.');
  assert.ok((await page.locator('textarea').inputValue()).startsWith('כותרת מה-AI'), 'הטיוטה נכנסה לעורך');
  assert.equal(cloudArticles.has('zipf-law'), false, 'טיוטה לא נשמרת לבד');
  await page.getByRole('button', { name: 'שמירה' }).click();
  await page.waitForSelector('text=נשמר בענן.');
  assert.equal(await page.locator('.article-insight').count(), 3);

  await page.goto(`${BASE}/law/not-a-law`);
  await page.waitForSelector('text=החוק הזה לא נמצא במאגר');

  await page.getByRole('button', { name: 'תפריט' }).click();
  await page.waitForSelector('text=הכול נשמר בענן');
  assert.equal(await page.locator('input[type="password"]').count(), 0, 'אין שום בקשת כניסה');
  await shot(page, 'menu-desktop');

  assert.deepEqual([...new Set(requests)].sort(), ['apps', 'article', 'article-save', 'case-save', 'correlations', 'create', 'draft', 'explain', 'finding-save', 'image-clear', 'image-restore', 'image-upload', 'law-remove', 'law-save']);
  assert.deepEqual(errors, [], 'אין שגיאות בדפדפן');
}

// ---------- הכריכה ----------
{
  const { page, errors, ctx } = await open({ width: 1440, height: 900 });
  await page.goto(BASE);
  await page.waitForSelector('canvas.cover-canvas');
  await page.waitForSelector('h1.cover-verse');
  await noSideScroll(page, 'cover');
  await shot(page, 'cover-desktop');
  await page.getByRole('link', { name: 'פתיחה' }).last().click();
  await page.waitForURL('**/open');
  await page.waitForSelector('[aria-label="הטבלה המחזורית של ההתנהגות"]');
  await page.getByRole('link', { name: 'חוקי התנהגות' }).click();
  await page.waitForSelector('canvas.cover-canvas');
  assert.deepEqual(errors, [], 'אין שגיאות בכריכה');
  await ctx.close();
}

// ---------- נייד ----------
{
  const { page, errors } = await open({ width: 390, height: 844 });
  for (const [path, name] of [['/', 'cover'], ['/open', 'home'], ['/library', 'library'], ['/explain', 'explain'], ['/create', 'create'], ['/my-laws', 'mylaws'], ['/articles', 'articles'], ['/law/dunbar-number', 'law']]) {
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

// ---------- חוק שענת ניסחה: בספרייה, ברשת הקשרים ובחוקים שלי ----------
{
  const { page } = await open({ width: 1440, height: 900 });
  const mine = {
    id: 'mine-test', kind: 'created', name: 'חוק המדרכה הרחבה', domain: ['עיר'], definition: 'מדרכה רחבה מייצרת **שהייה**.',
    mechanism: 'משוב חיובי.', examples: [], tags: [], parent_law_ids: ['induced-demand'], family: 'contagion',
    created_at: '2026-11-26T08:00:00Z', synced: false,
  };
  await page.addInitScript((l) => localStorage.setItem('chok-my-laws', JSON.stringify([l])), mine);
  await page.goto(`${BASE}/library?law=mine-test`);
  await page.waitForSelector('[data-mine-card="mine-test"]');
  await page.waitForSelector('button.row:has-text("חוק המדרכה הרחבה")');
  await page.goto(`${BASE}/law/induced-demand`);
  await page.locator('[data-mine]').first().click();
  await page.waitForURL(/my-laws\?law=mine-test/);
  await page.waitForSelector('#mine-mine-test');
  await shot(page, 'mine-law');

  // הכנסה למאגר: אישור בשני שלבים, ואז החוק מקבל עמוד מלא
  await page.locator('#mine-mine-test').getByRole('button', { name: 'הכנסה למאגר' }).click();
  await page.getByRole('button', { name: 'כן, להכניס למאגר' }).click();
  await page.locator('#mine-mine-test').getByRole('link', { name: 'במאגר: לעמוד החוק' }).click();
  await page.waitForURL(/\/law\/mine-test/);
  await page.waitForSelector('h1:has-text("חוק המדרכה הרחבה"), h2:has-text("חוק המדרכה הרחבה")');
  await shot(page, 'promoted-law');
}

await browser.close();
console.log('הבדיקה עברה: כל המסכים, שלושת המנועים, נייד, וגיבוי בלי AI');
