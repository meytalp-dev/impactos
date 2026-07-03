// Smoke-test every minigame: load over http, capture console errors, page errors,
// failed network requests, and whether the primary UI actually rendered.
// Usage: node smoke-minigames.js   (requires static server on :8765 rooted at underwater-app)
const { chromium } = require('playwright');

const PAGES = [
  // island hubs
  'stage-1-island.html','stage-2-island.html','stage-3-island.html','stage-4-island.html','stage-5-island.html','stage-14-island.html',
  // stage 1
  'stage-1-bubble-rise.html','stage-1-choir.html','stage-1-count-bubbles.html','stage-1-merge-bubble.html',
  // stage 2
  'stage-2-fish-schools.html','stage-2-twin-seaweeds.html','stage-2-whispers.html',
  // stage 3 letters
  'stage-3-alef.html','stage-3-gimel.html','stage-3-dalet.html','stage-3-hey.html','stage-3-vav.html',
  'stage-3-zayin.html','stage-3-het.html','stage-3-tet.html','stage-3-yud.html','stage-3-kaf.html',
  'stage-3-lamed.html','stage-3-nun.html','stage-3-samekh.html','stage-3-ayin.html','stage-3-pey.html',
  'stage-3-tzadi.html','stage-3-trail-resh.html','stage-3-shell.html','stage-3-house.html','stage-3-rescue.html','stage-3-storm.html',
  'stage-3-write-tav.html','stage-3-write-tav-accurate.html',
  // stage 4/5
  'stage-4-cv-tap.html','stage-4-cv-build.html','stage-5-word-merge.html','stage-5-word-build.html',
  // stage 14 comprehension
  'stage-14-listen-and-answer.html','stage-14-story-sequence.html',
  // read aloud
  'stage-read-aloud.html',
];

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const p of PAGES) {
    const ctx = await browser.newContext({ locale: 'he-IL' });
    const page = await ctx.newPage();
    const errs = [], warns = [], failedReq = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
    page.on('requestfailed', r => failedReq.push(r.url().split('/').pop() + ' (' + (r.failure()?.errorText||'') + ')'));
    page.on('response', r => { if (r.status() >= 400) failedReq.push(r.url().split('/').pop() + ' HTTP ' + r.status()); });
    let ok = true, note = '';
    try {
      await page.goto('http://localhost:8765/avnei-yesod/underwater-app/' + p, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1200);
      const bodyText = (await page.evaluate(() => document.body ? document.body.innerText.trim().length : 0));
      const visibleEls = await page.evaluate(() => document.querySelectorAll('button,[role=button],.btn,canvas,svg,img').length);
      if (bodyText < 5 && visibleEls < 2) { ok = false; note = 'blank page (no text/elements)'; }
    } catch (e) { ok = false; note = 'goto failed: ' + e.message.split('\n')[0]; }
    // filter noise: font/analytics failures are non-fatal
    const realFailed = failedReq.filter(u => !/fonts\.g|gstatic|googleapis|analytics|favicon/.test(u));
    const status = (!ok || errs.length) ? 'FAIL' : (realFailed.length ? 'WARN' : 'OK');
    results.push({ p, status, note, errs: errs.slice(0,4), failed: realFailed.slice(0,6) });
    console.log(`${status.padEnd(4)} ${p}${note?'  — '+note:''}`);
    if (errs.length) errs.slice(0,4).forEach(e => console.log('       err: ' + e.slice(0,160)));
    if (realFailed.length) console.log('       missing: ' + realFailed.slice(0,6).join(', '));
    await ctx.close();
  }
  await browser.close();
  const fail = results.filter(r => r.status==='FAIL'), warn = results.filter(r => r.status==='WARN');
  console.log(`\n===== SUMMARY: ${results.length} pages | ${fail.length} FAIL | ${warn.length} WARN | ${results.length-fail.length-warn.length} OK =====`);
  require('fs').writeFileSync('smoke-results.json', JSON.stringify(results,null,2));
})();
