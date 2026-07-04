// sweep-curriculum-coverage.js — סקירת כיסוי שנתית מלאה של התוכנית (4.7.2026, אחרי B3).
// עובר על כל החודשים ב-demo/teacher-curriculum.html, סופר מצבים ומדפיס כל יום "חסר".
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PORT = 8768;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

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

  const tally = {};
  const missing = [];
  const byTag = {};

  while (!(await page.locator('#prevM').isDisabled())) { await page.locator('#prevM').click(); await page.waitForTimeout(30); }
  for (let m = 0; m < 12; m++) {
    const month = await page.locator('#mname').innerText();
    const rows = await page.$$eval('.daycard', cards => cards.map(c => {
      const topic = (c.querySelector('.ttext')?.textContent || '').trim();
      const prac = c.querySelector('.prac');
      return { topic, cls: prac?.className || '(none)', tag: (prac?.textContent || '').trim() };
    }));
    for (const r of rows) {
      const state =
        /miss/.test(r.cls) ? 'חסר' :
        /sum/.test(r.cls) ? 'תרגול-סיכום' :
        /oral/.test(r.cls) ? 'שיח בכיתה' :
        /write|nb/.test(r.cls) ? 'כתיבה במחברת' :
        /event/.test(r.cls) ? 'אירוע' :
        r.cls === '(none)' ? 'בלי-צ׳יפ' : 'תרגול דיגיטלי';
      tally[state] = (tally[state] || 0) + 1;
      if (state === 'חסר') missing.push(`${month} · ${r.topic}`);
      if (state === 'תרגול דיגיטלי') byTag[r.tag] = (byTag[r.tag] || 0) + 1;
      if (state === 'בלי-צ׳יפ') missing.push(`${month} · ${r.topic} (בלי-צ׳יפ! cls=none)`);
    }
    const next = page.locator('#nextM');
    if (await next.isDisabled()) break;
    await next.click(); await page.waitForTimeout(30);
  }

  console.log('=== סיכום מצבים (כל השנה) ===');
  Object.entries(tally).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log(`\n=== ימי "חסר" שנותרו: ${missing.length} ===`);
  missing.forEach(d => console.log('  ✗ ' + d));
  console.log('\n=== פילוח תגי תרגול דיגיטלי ===');
  Object.entries(byTag).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${v} × ${k}`));

  await browser.close();
  server.close();
})();
