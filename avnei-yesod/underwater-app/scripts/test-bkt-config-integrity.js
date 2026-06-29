// ============================================================
// test-bkt-config-integrity.js — שלמות קונפיגורציה של המנוע (29.6.2026)
//
// מאמת (משימת "פיצול/ניקוי bkt.js"):
//   1. אין כפילות מפתחות באובייקט PARAMS_PER_ISLAND (סריקת מקור) —
//      היה אי 5 מוגדר פעמיים; כפילות כזו דורסת בשקט ומבלבלת.
//   2. PARAMS_PER_ISLAND[5].pT = 0.15 (הערך האפקטיבי שנשמר אחרי הניקוי).
//   3. ISLAND_TO_STRAND זהה בין bkt.js ל-event-logger.js (מניעת drift —
//      המפה משוכפלת בשני קבצים ו*חייבת* להישאר מסונכרנת).
//   4. ISLAND_TO_STRAND מכסה בדיוק 22 איים, ממופים ל-5 סטרנדים.
//
// הרצה:
//   node avnei-yesod/underwater-app/scripts/test-bkt-config-integrity.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ===== stubs (browser globals) =====
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};
global.document = { addEventListener: () => {} };

const bktPath = path.join(__dirname, '../js/shared/bkt.js');
const loggerPath = path.join(__dirname, '../js/shared/event-logger.js');
const bktSrc = fs.readFileSync(bktPath, 'utf-8');

eval(bktSrc);
eval(fs.readFileSync(loggerPath, 'utf-8'));

const BKT = global.window.AvneiBKT;
const Logger = global.window.AvneiEventLogger;

// ===== runner =====
let pass = 0, fail = 0;
function assert(label, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else      { fail++; console.log('  ❌ ' + label + (extra ? '\n     ' + extra : '')); }
}
function divider(label) {
  console.log('\n' + '='.repeat(60) + '\n' + label + '\n' + '='.repeat(60));
}

// ============================================================
// 1. אין כפילות מפתחות ב-PARAMS_PER_ISLAND (סריקת מקור)
// ============================================================
divider('בדיקה 1 — אין כפילות מפתחות ב-PARAMS_PER_ISLAND');

const block = bktSrc.match(/const\s+PARAMS_PER_ISLAND\s*=\s*\{([\s\S]*?)\n\s*\};/);
assert('נמצא בלוק PARAMS_PER_ISLAND במקור', !!block);
if (block) {
  // מפתחות ברמה העליונה: מספר בתחילת שורה (אחרי whitespace) ואז ":".
  const keys = [];
  block[1].split('\n').forEach(line => {
    const m = line.match(/^\s*(\d+)\s*:/);
    if (m) keys.push(m[1]);
  });
  const dups = keys.filter((k, i) => keys.indexOf(k) !== i);
  assert('כל מפתחות האיים ייחודיים (אין הגדרה כפולה)', dups.length === 0,
         dups.length ? 'כפילויות: ' + [...new Set(dups)].join(', ') : '');
  // 10 איים עם פרמטרים מותאמים: 1,2,3,4,6,7,8,9,14,5 (אחרי הסרת הכפילות של 5).
  assert('נמצאו 10 איים מוגדרים (ללא כפילות)', keys.length === 10, 'נמצאו: ' + keys.length);
}

// ============================================================
// 2. הערך האפקטיבי של אי 5 נשמר (pT=0.15)
// ============================================================
divider('בדיקה 2 — PARAMS_PER_ISLAND[5] שמר את הערך האפקטיבי');
assert('אי 5 pT = 0.15', BKT.PARAMS_PER_ISLAND[5].pT === 0.15, 'התקבל: ' + BKT.PARAMS_PER_ISLAND[5].pT);
assert('אי 5 pL0 = 0.10', BKT.PARAMS_PER_ISLAND[5].pL0 === 0.10, 'התקבל: ' + BKT.PARAMS_PER_ISLAND[5].pL0);

// ============================================================
// 3. ISLAND_TO_STRAND זהה בין bkt.js ל-event-logger.js
// ============================================================
divider('בדיקה 3 — ISLAND_TO_STRAND מסונכרן בין שני הקבצים');
const a = BKT.ISLAND_TO_STRAND;
const b = Logger.ISLAND_TO_STRAND;
assert('שני הקבצים חושפים ISLAND_TO_STRAND', !!a && !!b);
assert('אותו מספר איים', Object.keys(a).length === Object.keys(b).length,
       `bkt=${Object.keys(a).length} logger=${Object.keys(b).length}`);
let identical = true, diffs = [];
Object.keys(a).forEach(k => { if (a[k] !== b[k]) { identical = false; diffs.push(`${k}: bkt=${a[k]} logger=${b[k]}`); } });
assert('כל המיפויים זהים (אין drift)', identical, diffs.join(' · '));

// ============================================================
// 4. כיסוי 22 איים → 5 סטרנדים
// ============================================================
divider('בדיקה 4 — כיסוי 22 איים → 5 סטרנדים');
assert('22 איים בדיוק', Object.keys(a).length === 22, 'התקבל: ' + Object.keys(a).length);
const strands = new Set(Object.values(a));
assert('5 סטרנדים מיוצגים', strands.size === 5, 'התקבל: ' + [...strands].sort().join(','));
[[3,1],[8,1],[10,2],[13,3],[16,4],[21,5]].forEach(([isl, st]) =>
  assert(`אי ${isl} → סטרנד ${st}`, a[isl] === st, 'התקבל: ' + a[isl]));

// ============================================================
// סיכום
// ============================================================
divider(`סיכום: ${pass} עברו · ${fail} נכשלו`);
process.exit(fail > 0 ? 1 : 0);
