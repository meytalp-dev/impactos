// Smoke ad-hoc — stage-14-read-and-answer.html (M2, 4.7.2026)
// לא spec: סקריפט חד-פעמי. מרים שרת סטטי על 8766, עובר קטע שלם ומצלם.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..', '..'); // avnei-yesod/
const PORT = 8766;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };

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
  const page = await browser.newPage({ viewport: { width: 820, height: 1180 } }); // tablet portrait
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // 1. picker נטען עם 3 קטעים
  await page.goto(`http://localhost:${PORT}/underwater-app/stage-14-read-and-answer.html`);
  await page.waitForSelector('.text-card');
  const cards = await page.locator('.text-card').count();
  console.log('picker cards:', cards);

  // 2. deep-link ?text=whales → הקטע מוצג, כפתור הקראת-קטע מוסתר
  await page.goto(`http://localhost:${PORT}/underwater-app/stage-14-read-and-answer.html?text=whales`);
  await page.waitForSelector('.mlmcq-passage-text');
  const passage = await page.locator('.mlmcq-passage-text').innerText();
  console.log('passage starts:', passage.slice(0, 30));
  const passageBtnVisible = await page.locator('.mlmcq-passage-btn').isVisible().catch(() => false);
  console.log('passage audio btn visible (must be false):', passageBtnVisible);
  const qBtnVisible = await page.locator('.mlmcq-question-btn').isVisible();
  console.log('question audio btn visible (must be true):', qBtnVisible);

  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'smoke-read-and-answer-passage.png') });

  // 3. עונים על 3 שאלות (תמיד האפשרות הראשונה — לא משנה נכונות, בודקים זרימה)
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector('.mlmcq-option:not([disabled])');
    await page.locator('.mlmcq-option').first().click();
    await page.waitForTimeout(1500); // FEEDBACK_DELAY_MS + מרווח
  }
  await page.waitForSelector('#summarySection', { state: 'visible' });
  const scoreTxt = await page.locator('#summaryScore').innerText();
  console.log('summary score:', scoreTxt);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'smoke-read-and-answer-summary.png') });

  // 4. "קטע אחר" מחזיר ל-picker
  await page.locator('#anotherTextBtn').click();
  await page.waitForSelector('#introSection', { state: 'visible' });
  console.log('back to picker: OK');

  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
  if (errors.length || cards !== 3 || passageBtnVisible || !qBtnVisible) {
    console.error('SMOKE FAILED');
    process.exit(1);
  }
  console.log('SMOKE PASSED');
})();
