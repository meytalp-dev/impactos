// drive-t12.js — QA for The Family Photo (scene-hide).
// PASS A: click "בואו נתחיל" MANUALLY (not autoplay) → the button path the brief insists on;
//         assert the stage is NOT empty (measure-scene height>0, 3 visible peekers w/ art).
// PASS B: ?autoplay=1 → confirm the full 7-round loop reaches the done overlay, clean console.
const { chromium } = require('playwright');
const path = require('path');

const APP = path.resolve(__dirname, '..', 'app', 'family-photo.html').replace(/\\/g, '/');
const EXE = 'C:/Users/meyta/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });

  // ---------- PASS A: manual Start ----------
  {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    await page.goto('file://' + APP + '?frame=1&peek=1', { waitUntil: 'networkidle' });
    await page.click('#startBtn');                         // the REAL button path
    await page.waitForTimeout(1400);                        // let the round mount + art load
    const r = await page.evaluate(() => {
      const scene = document.querySelector('.measure-scene');
      const peekers = Array.from(document.querySelectorAll('.peeker'));
      const vis = peekers.filter((p) => { const b = p.getBoundingClientRect(); return b.width > 40 && b.height > 40; });
      const art = peekers.filter((p) => p.classList.contains('has-art'));
      // no_read: any latin letters rendered as TEXT inside the stage?
      const txt = (document.getElementById('stage').innerText || '').match(/[A-Za-z]/g);
      return {
        sceneH: scene ? Math.round(scene.getBoundingClientRect().height) : 0,
        peekers: peekers.length, visible: vis.length, art: art.length,
        latinInStage: txt ? txt.length : 0,
      };
    });
    await page.screenshot({ path: path.join(__dirname, 't12-manual-start.png') });
    console.log('PASS A (manual start):', JSON.stringify(r), '| errors:', errors.length ? JSON.stringify(errors) : 'none');
    await page.close();
  }

  // ---------- PASS B: autoplay full loop ----------
  {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
    await page.goto('file://' + APP + '?frame=1&autoplay=1&peek=1', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.getElementById('doneOverlay').classList.contains('hidden'), { timeout: 45000 }).catch(() => {});
    const done = await page.evaluate(() => !document.getElementById('doneOverlay').classList.contains('hidden'));
    const litPips = await page.evaluate(() => document.querySelectorAll('.lg-pip.lit').length);
    await page.screenshot({ path: path.join(__dirname, 't12-done.png') });
    console.log('PASS B (autoplay): doneOverlay:', done, '| litPips:', litPips, '/7 | errors:', errors.length ? JSON.stringify(errors) : 'none');
    await page.close();
  }

  await browser.close();
})();
