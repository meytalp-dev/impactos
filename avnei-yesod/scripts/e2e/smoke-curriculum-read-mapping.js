// Smoke ad-hoc — מיפוי הבנת-הנקרא ב-teacher-curriculum (M2, 4.7.2026)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // impactos/
const PORT = 8767;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/demo/teacher-curriculum.html`);
  await page.waitForSelector('.daycard');

  // חילוץ מיפוי (topic → tag+href) לכל חודש דרך ה-DOM
  async function monthMap() {
    return page.$$eval('.daycard', cards => cards.map(c => {
      const topic = c.querySelector('.ttext')?.textContent || '';
      const prac = c.querySelector('.prac');
      const href = prac?.getAttribute('href') || '';
      const cls = prac?.className || '';
      const tag = prac?.textContent?.trim() || '';
      return { topic, href, cls, tag };
    }));
  }
  async function gotoMonth(name) {
    // חזרה לחודש הראשון, ואז קדימה עד שמוצאים
    while (!(await page.locator('#prevM').isDisabled())) { await page.locator('#prevM').click(); await page.waitForTimeout(30); }
    for (let i = 0; i < 12; i++) {
      if ((await page.locator('#mname').innerText()) === name) return;
      await page.locator('#nextM').click();
      await page.waitForTimeout(30);
    }
    throw new Error('month not found: ' + name);
  }

  const failures = [];
  function expect(rows, topicPart, test, desc) {
    const row = rows.find(r => r.topic.includes(topicPart));
    if (!row) { failures.push('topic not found: ' + topicPart); return; }
    if (!test(row)) failures.push(`${desc} — got cls="${row.cls}" href="${row.href}" (${row.topic})`);
    else console.log('OK:', desc);
  }

  await gotoMonth('מאי');
  let rows = await monthMap();
  expect(rows, 'קריאת סיפור', r => r.cls.includes('c-read') && r.href.includes('read-and-answer') && r.href.includes('text=shuk'), 'מאי: יום שוק → read?text=shuk');
  expect(rows, 'לווייתנים', r => r.cls.includes('c-read') && r.href.includes('text=whales'), 'מאי: לווייתנים → read?text=whales');
  expect(rows, 'טקסט מידע על דבורים', r => r.cls.includes('c-read') && r.href.includes('text=bees'), 'מאי: דבורים → read?text=bees');
  expect(rows, 'איתור מידע בטקסט', r => r.cls.includes('c-read'), 'מאי: איתור מידע → read');
  expect(rows, 'מבנה טקסט מידע', r => r.cls.includes('c-read'), 'מאי: מבנה טקסט → read');
  expect(rows, 'רצף אירועים', r => r.cls.includes('c-listen') && r.href.includes('story-sequence'), 'מאי: רצף אירועים נשאר האזנה');
  expect(rows, 'קריאה חוזרת', r => r.cls.includes('c-fluency'), 'מאי: קריאה חוזרת נשארת שטף');

  await gotoMonth('מרץ');
  rows = await monthMap();
  expect(rows, 'קריאת תיאור + התאמה', r => r.cls.includes('c-read'), 'מרץ: קריאת תיאור → read');
  expect(rows, 'קריאת תיאור ארוך', r => r.cls.includes('c-read'), 'מרץ: תיאור ארוך → read');
  expect(rows, 'טקסט מידע + ארבע', r => r.cls.includes('c-read') && !r.href.includes('text='), 'מרץ: טקסט מידע → read בלי deep-link');
  expect(rows, 'תיאור דמות', r => r.cls.includes('oral'), 'מרץ: תיאור דמות נשאר שיח');

  await gotoMonth('יוני');
  rows = await monthMap();
  expect(rows, 'קריאת פסקה עצמית', r => r.cls.includes('c-read'), 'יוני: פסקה עצמית → read');
  expect(rows, 'הבנת הנשמע + אוצר', r => r.cls.includes('c-listen'), 'יוני: הבנת הנשמע נשארת האזנה');

  await gotoMonth('אפריל');
  rows = await monthMap();
  expect(rows, 'הבנת הנשמע — סיפור', r => r.cls.includes('c-listen'), 'אפריל: הבנת הנשמע נשארת האזנה');

  await gotoMonth('ספטמבר');
  rows = await monthMap();
  expect(rows, 'האזנה לסיפור', r => r.cls.includes('c-listen'), 'ספטמבר: האזנה לסיפור נשארת האזנה');

  await browser.close();
  server.close();
  if (failures.length) { console.error('FAILURES:\n' + failures.join('\n')); process.exit(1); }
  console.log('MAPPING SMOKE PASSED');
})();
