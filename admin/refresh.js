#!/usr/bin/env node
/**
 * refresh.js — פקודת-רענון אחת לאדמין.
 *
 *   node admin/refresh.js                 → בדיקת-ריצה + בניית-דאטה (בלי git)
 *   node admin/refresh.js --publish       → + commit ל-admin/ + push ל-main (מפרסם ל-live)
 *   node admin/refresh.js --no-runtime    → מדלג על בדיקת-הריצה (מהיר)
 *
 * מיועד גם לחיווט מלוח-האיים / סוכן-התזמורת: אחרי בניית אי חדש, הרצה אחת
 * מרעננת את כל הדאטה (המשחקונים החדשים נתפסים אוטומטית) ומפרסמת.
 */
const { execSync } = require('child_process');
const path = require('path');

const ADMIN = __dirname;
const ROOT = path.resolve(ADMIN, '..');
const args = process.argv.slice(2);
const has = (f) => args.includes(f);

function run(cmd, opts = {}) {
  console.log('› ' + cmd);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

try {
  // 1) בדיקת-ריצה (Playwright) → qa-runtime.json  [אופציונלי]
  if (!has('--no-runtime')) {
    try { run('node admin/qa-runtime-check.js'); }
    catch (e) { console.warn('⚠ בדיקת-הריצה נכשלה (Playwright?) — ממשיך בלעדיה. השתמשי ב--no-runtime לדילוג.'); }
  }

  // 2) בניית admin-data.js (בולע את qa-runtime.json)
  run('node admin/build-admin-data.js');

  // 3) פרסום  [רק עם --publish]
  if (has('--publish')) {
    run('git add admin/');
    // commit רק אם יש שינוי ב-admin/
    let changed = true;
    try { execSync('git diff --cached --quiet -- admin/', { cwd: ROOT }); changed = false; } catch (e) { /* יש שינוי */ }
    if (changed) {
      run('git commit -q -m "admin: רענון דאטה (build + qa-runtime)"');
    } else {
      console.log('· אין שינוי ב-admin/ — מדלג על commit');
    }
    run('git fetch origin main');
    // FF בלבד
    try { execSync('git merge-base --is-ancestor origin/main HEAD', { cwd: ROOT }); }
    catch (e) { console.error('✗ main התפצל — לא דוחף אוטומטית. מזגי ידנית.'); process.exit(1); }
    run('git push origin HEAD:main');
    console.log('\n✓ פורסם. impact-os.app/admin/ (Pages מתעדכן תוך ~דקה)');
  } else {
    console.log('\n✓ הדאטה עודכנה. לפרסום: node admin/refresh.js --publish');
  }
} catch (e) {
  console.error('✗ refresh נכשל:', e.message);
  process.exit(1);
}
