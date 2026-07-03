// ============================================================
// test-island-4-integration.js — אינטגרציה קצה-לקצה per_cv (3.7.2026)
//
// מאמת את הנתיב האמיתי של gameplay (לא קריאה ישירה ל-ingestEvent):
//   logActivityResult(payload)  →  event-logger מעביר target_phoneme_group
//   →  ingestEvent  →  ingestIsland4Event  →  per_cv מתעדכן  →  getCVState.
//
// תופס את הפער שבו event-logger מסנן שדות שאינם ברשימה הלבנה: אם
// target_phoneme_group לא מועבר — ה-BKT פר-צירוף נשאר ריק (הפיצ'ר inert).
//
// הרצה: node scripts/test-island-4-integration.js
// ============================================================

const fs = require('fs');
const path = require('path');

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};
global.document = { addEventListener: () => {} };

// state.js — appendEvent + helpers
eval(fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf-8'));
// bkt.js — מציב window.AvneiBKT (כולל ingestIsland4Event)
eval(fs.readFileSync(path.join(__dirname, '../js/shared/bkt.js'), 'utf-8'));
// event-logger קורא AvneiBKT כגלובל ערום (בדפדפן = window.AvneiBKT). ב-eval
// נחשוף אותו גם כגלובל כדי לשקף את התנהגות הדפדפן.
global.AvneiBKT = global.window.AvneiBKT;
// event-logger.js — מציב window.AvneiEventLogger, קורא ל-AvneiBKT.ingestEvent
eval(fs.readFileSync(path.join(__dirname, '../js/shared/event-logger.js'), 'utf-8'));

const Logger = global.window.AvneiEventLogger;
const BKT = global.window.AvneiBKT;

let pass = 0, fail = 0;
function ok(label, cond) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ ' + label); }
}

console.log('\n=== אי 4 · אינטגרציה קצה-לקצה (logActivityResult → per_cv) ===\n');

// שולחים סבב cv-summary דרך ה-logger (כמו gameplay אמיתי).
const evt1 = Logger.logActivityResult({
  activity_type: 'cv-summary',
  target_letter: 'ב',
  target_phoneme_group: 'a',
  target_cv: 'בַּ',
  item_id: 'summary-trial-1',
  is_correct: true,
  primary_island_id: 4,
  secondary_island_ids: [3],
});
const sid = (evt1 && evt1.student_id) ? evt1.student_id : 'local';
ok('target_phoneme_group נשמר באירוע (whitelist)', evt1 && evt1.target_phoneme_group === 'a');

// קוראים את מצב ה-CV דרך ה-API — צריך להתעדכן.
const cvState = BKT.getCVState(sid, 'ב_a');
ok('target_phoneme_group עבר דרך event-logger (per_cv נוצר)', cvState !== null);
ok('התא "ב_a" נספר (attempts=1)', cvState && cvState.attempts === 1);

// עוד סבב, אות אחרת — לוודא שהמפתח הנכון נבנה מ-phoneme_group.
Logger.logActivityResult({
  activity_type: 'cv-summary',
  target_letter: 'מ',
  target_phoneme_group: 'i',
  target_cv: 'מִ',
  item_id: 'summary-trial-2',
  is_correct: true,
  primary_island_id: 4,
});
ok('צירוף שני "מ_i" נוצר בנפרד', BKT.getCVState(sid, 'מ_i') !== null);

// checkMastery(4) רואה את שני התאים.
const cm = BKT.checkMastery(sid, 4);
ok('checkMastery(4) כולל את שני הצירופים', cm.per_cv['ב_a'] && cm.per_cv['מ_i']);

// אירוע ללא target_phoneme_group (משחקון legacy) — לא מפיל, פשוט לא מייצר תא CV.
Logger.logActivityResult({
  activity_type: 'storm-quest',
  target_letter: 'ת',
  is_correct: true,
  primary_island_id: 3,   // אי אחר — לא נוגע ב-per_cv
});
ok('אירוע אי-אחר לא יצר תא CV מזויף', BKT.getCVState(sid, 'ת_a') === null);

console.log('\n==================================================');
console.log(`סיכום: ${pass} עברו · ${fail} נכשלו`);
process.exit(fail === 0 ? 0 : 1);
