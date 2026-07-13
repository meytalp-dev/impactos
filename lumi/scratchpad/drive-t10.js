// drive-t10.js — autoplay drive: confirms the full measured round loop reaches "done".
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'app', 't10-face.html').replace(/\\/g, '/') + '?frame=1&autoplay=1&peek=1';
  const exe = 'C:/Users/meyta/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe';
  const errors = [];
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage({ viewport: { width: 440, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto(file, { waitUntil: 'networkidle' });
  // 4 rounds × ~2.4s each; wait generously for the done overlay
  await page.waitForFunction(() => !document.getElementById('doneOverlay').classList.contains('hidden'), { timeout: 20000 }).catch(() => {});
  const done = await page.evaluate(() => !document.getElementById('doneOverlay').classList.contains('hidden'));
  const litPips = await page.evaluate(() => document.querySelectorAll('.lg-pip.lit').length);
  await page.screenshot({ path: path.join(__dirname, 't10-done.png') });
  console.log('doneOverlayShown:', done, '| litPips:', litPips, '| errors:', errors.length ? JSON.stringify(errors) : 'none');
  await browser.close();
})();
