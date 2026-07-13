// shot-t10.js — drive T10 through the MANUAL "start" path and screenshot the scene.
// Verifies: stage not empty after start, hotspots placed, console clean, no_read.
// Run: npx playwright ... (see shot-t10 runner). Uses playwright from npx cache.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'app', 't10-face.html').replace(/\\/g, '/') + '?frame=1';
  const outDir = __dirname;
  const errors = [];
  const exe = 'C:/Users/meyta/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe';
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto(file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 't10-intro.png') });

  // MANUAL start (not autoplay) — exercise the real button path
  await page.click('#startBtn');
  await page.waitForTimeout(900);

  const diag = await page.evaluate(() => {
    const scene = document.querySelector('.measure-scene');
    const hotspots = document.querySelectorAll('.beam-animal');
    const rects = Array.prototype.map.call(hotspots, (b) => {
      const r = b.getBoundingClientRect();
      const span = b.querySelector('.ba-emoji');
      return { glyph: span && span.textContent, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), w: Math.round(r.width) };
    });
    // any visible latin text in the child stage? (no_read check)
    const stageText = (document.getElementById('stage').innerText || '').trim();
    const latin = /[A-Za-z]/.test(stageText);
    return {
      sceneH: scene ? Math.round(scene.getBoundingClientRect().height) : 0,
      count: hotspots.length, rects, stageText, latin,
    };
  });
  // force-reveal every present hotspot so the layout is legible in the shot
  await page.evaluate(() => document.querySelectorAll('.beam-animal').forEach((b) => b.classList.add('found')));
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(outDir, 't10-scene.png') });

  // sweep the beam across, then tap the correct hotspot to check the found/chunk path
  await page.mouse.move(220, 500); await page.waitForTimeout(200);
  await page.mouse.move(220, 640); await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, 't10-beam.png') });

  console.log(JSON.stringify(diag, null, 2));
  console.log('ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
  await browser.close();
})();
