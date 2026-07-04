// verify-rhyme-standalone.js — אימות מלא של stage-rhyme בפורט מבודד (8768),
// מחוץ ל-runner המשותף (סוכנים מקבילים חולקים את :8765 ומוחקים localStorage).
// מריץ: node verify-rhyme-standalone.js   (דורש שרת: python -m http.server 8768 מ-avnei-yesod/)
'use strict';
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const BASE = 'http://localhost:8768';
  await page.goto(BASE + '/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('avnei-yesod-current-student', 'stu-verify');
  });

  await page.goto(BASE + '/underwater-app/stage-rhyme.html?skipintro=1&cid=apr-w1-d4-c1');
  await page.locator('#startBtn').click();

  const readEvents = () => page.evaluate(() => {
    try { return (JSON.parse(localStorage.getItem('underwater-app:v1') || '{}').events) || []; } catch (e) { return []; }
  });

  // --- two-tap על הסבב הראשון ---
  await page.locator('.mcq-option--audio[data-correct="0"]').first().waitFor({ timeout: 10000 });
  const wrong = page.locator('.mcq-option--audio[data-correct="0"]').first();
  await wrong.click();
  const listening1 = await wrong.evaluate((el) => el.classList.contains('mcq-option--listening'));
  const count0 = (await readEvents()).length;
  await wrong.click();
  await page.waitForTimeout(300);
  const evts1 = await readEvents();
  const wrongEvt = evts1[evts1.length - 1];
  const listeningCleared = (await page.locator('.mcq-option--listening').count()) === 0;

  console.log('two-tap: first tap listening only  →', listening1 && count0 === 0 ? '✅' : '❌', '(listening=' + listening1 + ', events=' + count0 + ')');
  console.log('two-tap: second tap logged wrong   →', (wrongEvt && wrongEvt.is_correct === false && wrongEvt.failure_type === 'Sound') ? '✅' : '❌', JSON.stringify(wrongEvt && { is_correct: wrongEvt.is_correct, failure_type: wrongEvt.failure_type, characteristic_id: wrongEvt.characteristic_id, primary_island_id: wrongEvt.primary_island_id, strand_id: wrongEvt.strand_id, activity_variant: wrongEvt.activity_variant }));
  console.log('two-tap: preview cleared after err →', listeningCleared ? '✅' : '❌');

  // --- מעבר מלא: 8 סבבים ---
  for (let r = 0; r < 8; r++) {
    // מחכים שהסבב הנכון באמת עלה (המונה מתעדכן ב-mountNext) — בלי זה
    // הלחיצות נוחתות על האריח הנעול של הסבב הקודם בזמן ה-inter-item delay.
    await page.waitForFunction((label) =>
      document.getElementById('counter').textContent.trim() === label,
      (r + 1) + ' / 8', { timeout: 15000 });
    const correct = page.locator('.mcq-option--audio[data-correct="1"]').first();
    await correct.waitFor({ state: 'visible', timeout: 15000 });
    if (r === 0) await page.screenshot({ path: 'screenshots/rhyme-round.png', fullPage: true });
    await correct.click();
    await page.waitForTimeout(150);
    await correct.click();
    // מחכים שהחרוז ייכנס לשרשרת
    await page.waitForFunction((n) => document.querySelectorAll('.bead.filled').length === n, r + 1, { timeout: 12000 });
    console.log('round ' + (r + 1) + '/8: bead filled ✅');
  }

  await page.locator('.finish h2').waitFor({ timeout: 10000 });
  await page.screenshot({ path: 'screenshots/rhyme-finish.png', fullPage: true });
  const finishText = await page.locator('.finish h2').textContent();
  console.log('finish:', finishText.includes('הַשַּׁרְשֶׁרֶת שְׁלֵמָה') ? '✅' : '❌', finishText);

  const events = await readEvents();
  const rhyme = events.filter((e) => e.activity_variant === 'pick_rhyming_word');
  const correctEvts = rhyme.filter((e) => e.is_correct);
  const allApr = rhyme.every((e) => e.characteristic_id === 'apr-w1-d4-c1' && e.primary_island_id === 1 && e.strand_id === 1);
  console.log('events: ' + rhyme.length + ' rhyme events (' + correctEvts.length + ' correct, 1 wrong expected) →',
    (correctEvts.length === 8 && rhyme.length === 9 && allApr) ? '✅' : '❌');

  const jsErrors = errors.filter((e) => !/Failed to load resource|net::ERR_|404|the server responded/i.test(e));
  console.log('JS errors:', jsErrors.length === 0 ? '✅ none' : '❌ ' + JSON.stringify(jsErrors));

  await browser.close();
  process.exit((jsErrors.length === 0 && correctEvts.length === 8) ? 0 : 1);
})().catch((e) => { console.error('❌ verify failed:', e.message); process.exit(1); });
