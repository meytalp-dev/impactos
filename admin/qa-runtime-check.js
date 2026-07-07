#!/usr/bin/env node
/**
 * qa-runtime-check.js — בדיקת-ריצה אמיתית: טוען כל stage-*.html בדפדפן (Playwright/Chromium)
 * ומתעד שגיאות JS בקונסול + נכסים שנכשלו בטעינה (כולל MP3/PNG שבורים).
 *
 * הרצה:  node admin/qa-runtime-check.js
 * פלט:   admin/qa-runtime.json   (נבלע אוטומטית ע"י build-admin-data.js)
 *
 * דורש את Chromium של Playwright (מותקן תחת avnei-yesod/scripts/e2e/node_modules).
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'avnei-yesod', 'underwater-app');
const PW = path.join(ROOT, 'avnei-yesod', 'scripts', 'e2e', 'node_modules', 'playwright');

let chromium;
try { ({ chromium } = require(PW)); }
catch (e) {
  console.error('✗ Playwright לא נמצא ב-' + PW + '\n  הריצי מתוך avnei-yesod/scripts/e2e: npx playwright install chromium');
  process.exit(2);
}

// שרת-סטטי זעיר על שורש-הריפו — טוענים דרך HTTP (לא file://) כדי לשקף את האתר החי
// ולהימנע מ-false-positive של CORS ב-ES modules (cloud-client.js) תחת file://.
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      let fp = path.join(ROOT, p);
      try {
        if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end(); }
        const buf = fs.readFileSync(fp);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Content-Length': buf.length });
        res.end(buf);
      } catch (e) { res.writeHead(500); res.end(); }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
let PORT = 0;
const httpUrl = (f) => 'http://127.0.0.1:' + PORT + '/avnei-yesod/underwater-app/' + f;
const IGNORE = /favicon|DevTools|Autoplay|play\(\) request|NotAllowedError|user( |-)?gesture|AudioContext|The AudioContext/i;

async function checkPage(browser, f) {
  const errors = [];
  const failed = [];
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') { const t = m.text(); if (!IGNORE.test(t)) errors.push(t.split('\n')[0]); } });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!IGNORE.test(u)) failed.push(u.split('/').pop());
  });
  page.on('response', (r) => {
    // נכס שהוגש בגודל 0 → שבור (MP3/תמונה)
    const u = r.url();
    if (/\.(mp3|png|jpg|webp)$/i.test(u)) {
      const len = r.headers()['content-length'];
      if (len === '0') failed.push(u.split('/').pop() + ' (0B)');
    }
  });
  let loadErr = null;
  try {
    await page.goto(httpUrl(f), { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1800); // לתת ל-init/audio/adapter לרוץ
  } catch (e) { loadErr = String(e.message || e).split('\n')[0]; }
  await ctx.close();
  const uniq = (a) => [...new Set(a)];
  const errs = uniq(errors), fails = uniq(failed);
  return {
    file: f,
    ok: !loadErr && errs.length === 0 && fails.length === 0,
    loadError: loadErr,
    jsErrors: errs.slice(0, 6),
    failedAssets: fails.slice(0, 8),
  };
}

async function main() {
  const files = fs.readdirSync(APP).filter((f) => /^stage-.*\.html$/.test(f)).sort();
  const srv = await startServer();
  PORT = srv.address().port;
  console.log('בודק ' + files.length + ' דפים ב-Chromium (HTTP :' + PORT + ')…');
  const browser = await chromium.launch();
  const results = {};
  let done = 0;
  for (const f of files) {
    let r;
    try { r = await checkPage(browser, f); }
    catch (e) { r = { file: f, ok: false, loadError: 'check-crashed: ' + (e.message || e), jsErrors: [], failedAssets: [] }; }
    results[f] = r;
    done++;
    const mark = r.ok ? '✓' : '✗';
    process.stdout.write('  ' + mark + ' ' + f + (r.ok ? '' : '  — ' + [r.loadError, ...r.jsErrors, ...r.failedAssets].filter(Boolean).join(' · ')) + '\n');
  }
  await browser.close();
  srv.close();

  const payload = { generatedAt: new Date().toISOString(), checked: files.length, results };
  fs.writeFileSync(path.join(__dirname, 'qa-runtime.json'), JSON.stringify(payload, null, 1), 'utf8');
  const bad = Object.values(results).filter((r) => !r.ok);
  console.log('\n✓ qa-runtime.json נכתב · ' + (files.length - bad.length) + '/' + files.length + ' תקינים · ' + bad.length + ' עם בעיה');
  bad.forEach((r) => console.log('   ✗ ' + r.file + ': ' + [r.loadError, ...r.jsErrors, ...r.failedAssets].filter(Boolean).join(' · ')));
}

main().catch((e) => { console.error(e); process.exit(1); });
