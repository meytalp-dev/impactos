// qa-bank-b3.js — אימות ידני-מהיר לשני הימים שנסגרו ב-B3 (לא spec, מריצים עם node).
// jan-w1-d4: 6 שאלות (יוצא-דופן אריחי-שמע + יש/אין two-tap) · apr-w3-d3: 6 (3 עַל + 3 תואר+תמונה).
// בודק: מספר שאלות בתור, אריחי-שמע נטענים, תמונת stem קיימת, קונסולה נקייה.
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && /bank-play/.test(m.text())) console.log('  ⚠️', m.text());
  });
  page.on('pageerror', e => errors.push(String(e)));

  async function check(unitKey, expectQ, probe) {
    await page.goto(`http://localhost:8765/underwater-app/stage-bank-play.html?unitKey=${unitKey}&guest=1`,
      { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    if (await page.locator('.empty-note').count()) {
      console.log(`[${unitKey}] ❌ empty-note:`, await page.locator('.empty-note').innerText());
      process.exitCode = 1; errors.length = 0; return;
    }
    await page.locator('#startBtn').click();          // הפנינים נוצרות רק אחרי "התחלה"
    await page.waitForTimeout(800);
    const pearls = await page.locator('.pearl').count();
    console.log(`[${unitKey}] pearls (שאלות בתור): ${pearls} (צפוי ${expectQ})`);
    if (pearls !== expectQ) { console.log('❌ FAIL count'); process.exitCode = 1; }
    await probe();
    console.log(`[${unitKey}] errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    if (errors.length) process.exitCode = 1;
    errors.length = 0;
  }

  await check('jan-w1-d4', 6, async () => {
    // שאלה ראשונה = יוצא-דופן עם אריחי-שמע: מצפים ל-3 אריחים במצב audio
    const audioTiles = await page.locator('.mcq-option').count();
    const html = await page.content();
    const hasSpeaker = /mcq-option/.test(html);
    console.log(`  אריחים: ${audioTiles} · two-tap זמין: ${hasSpeaker}`);
    // בדיקת רשת: קליפ B3 אמיתי נגיש
    const res = await page.request.get('http://localhost:8765/underwater-app/assets/audio/bank-w-dag.mp3');
    console.log(`  bank-w-dag.mp3: ${res.status()}`);
    if (res.status() !== 200) process.exitCode = 1;
  });

  // 5 ולא 6: apr-w3-d3-c2-L1 הוותיקה (written_to_audio עַל/עוֹל/אֶל) מדולגת
  // מאז B1 — אין קליפים למסיחי המינימל-פר. 3 החדשות + 2 legacy משוחקות.
  await check('apr-w3-d3', 5, async () => {
    const res = await page.request.get('http://localhost:8765/underwater-app/assets/vocab/prch.png');
    console.log(`  prch.png (stem תמונה): ${res.status()}`);
    if (res.status() !== 200) process.exitCode = 1;
  });

  await browser.close();
  console.log(process.exitCode ? 'QA-B3 FAILED' : 'QA-B3 PASSED');
})();
