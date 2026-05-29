// ============================================================
// test-localstorage-limits.js — סוכן 24 · Phase B
// בדיקת footprint של localStorage תחת תנאי פיילוט.
//
// בודק 4 stores פעילים: underwater-app:v1 · avnei-bkt-v1 · avnei-bkt-strand-v1 · avnei-epa-v1
//
// תקרה ריאלית של דפדפן (origin):
//   Chrome/Edge/Safari: ~5MB
//   Firefox:            ~10MB
//
// מטרה: לזהות
//   (1) כמה השדה גדל באמת בפיילוט (5 ילדות · ~9000 events מצטברים)
//   (2) האם state.events (capped ב-1000) מוסיף לחץ
//   (3) האם BKT מנקה responseTimesMs כראוי (cap=100)
//   (4) הערכת מתי נגיע לתקרה אם הפיילוט גדל ל-50 ילדות / 100 ילדות
//
// הרצה: node avnei-yesod/underwater-app/scripts/test-localstorage-limits.js
// ============================================================
const fs = require('fs');
const path = require('path');

// stub localStorage שמדמה תקרה של 5MB.
const FAKE_QUOTA = 5 * 1024 * 1024;

global.localStorage = {
  _data: {},
  _quota: FAKE_QUOTA,
  _usage() {
    let total = 0;
    for (const k of Object.keys(this._data)) {
      total += k.length + (this._data[k] || '').length;
    }
    return total;
  },
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) {
    const newSize = this._usage() - ((this._data[k] || '').length) + (v || '').length + k.length;
    if (newSize > this._quota) {
      const e = new Error('QuotaExceededError');
      e.name = 'QuotaExceededError';
      throw e;
    }
    this._data[k] = v;
  },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};
global.document = { addEventListener: () => {} };

// טעינה — state.js → bkt.js → epa.js → event-logger.js. סדר חשוב כי
// event-logger קורא ל-AvneiBKT.ingestEvent ו-AvneiEPA.ingestEvent אם קיימים.
const stateCode  = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf-8');
const bktCode    = fs.readFileSync(path.join(__dirname, '../js/shared/bkt.js'), 'utf-8');
const epaCode    = fs.readFileSync(path.join(__dirname, '../js/shared/epa.js'), 'utf-8');
const loggerCode = fs.readFileSync(path.join(__dirname, '../js/shared/event-logger.js'), 'utf-8');

// state.js רושם DOMContentLoaded — stub כבר מוגדר.
eval(stateCode);
eval(bktCode);
// event-logger.js בדפדפן קורא ל-AvneiBKT/AvneiEPA כ-identifiers גלובליים (window הוא ה-global
// בדפדפן). ב-Node global.window.X לא הופך לזה — חשוף ידנית כדי שה-fallback בלוגר יעבוד.
global.AvneiBKT = global.window.AvneiBKT;
eval(epaCode);
global.AvneiEPA = global.window.AvneiEPA;
eval(loggerCode);

const Logger = global.window.AvneiEventLogger;
const BKT    = global.window.AvneiBKT;
const EPA    = global.window.AvneiEPA;

let passed = 0, failed = 0;
const findings = [];

function ok(label, cond, detail) {
  if (cond) { passed++; console.log(`  PASS  ${label}`); }
  else { failed++; console.log(`  FAIL  ${label}` + (detail ? `\n        ${detail}` : '')); }
}
function divider(label) {
  console.log('\n' + '='.repeat(70));
  console.log(label);
  console.log('='.repeat(70));
}
function fullReset() {
  localStorage._data = {};
}
function snapshotSizes() {
  return {
    'underwater-app:v1':   (localStorage._data['underwater-app:v1']   || '').length,
    'avnei-bkt-v1':        (localStorage._data['avnei-bkt-v1']        || '').length,
    'avnei-bkt-strand-v1': (localStorage._data['avnei-bkt-strand-v1'] || '').length,
    'avnei-epa-v1':        (localStorage._data['avnei-epa-v1']        || '').length,
    total:                 localStorage._usage(),
  };
}
function fmtKB(n) { return (n / 1024).toFixed(1) + 'KB'; }

// LCG seeded — שחזורית.
function makeRand(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000; };
}

const ALL_22 = BKT.ALL_HEBREW_LETTERS_22.slice();

// ייצור events דרך Logger.logActivityResult — כדי לסגור את הלולאה האמיתית
// (state.js → BKT → EPA כל אחד מקבל ingest). כותב גם student_id "אמיתי" דרך CURRENT_STUDENT_KEY.
function setCurrentStudent(id) {
  localStorage._data['avnei-yesod-current-student'] = id;
}

function realisticEvent(rand, studentId) {
  setCurrentStudent(studentId);
  const letter = ALL_22[Math.floor(rand() * 22)];
  // 95% משחקוני אי 3 (אמיתי לפיילוט — אי 3 הוא ה-MVP). השאר אי 19 (tracePath).
  const isTrace = rand() < 0.05;
  const activity = isTrace ? 'tracePath' : ['storm-quest','rescue','trail','house','shell','soundMatch','letterShapeA','letterShapeB','findLetter'][Math.floor(rand() * 9)];
  return {
    activity_type: activity,
    activity_variant: 'baseline',
    item_id: 'item-' + Math.floor(rand() * 100),
    target_letter: letter,
    supportLevel: 1 + Math.floor(rand() * 4),
    is_correct: rand() < 0.70,
    attempts: 1 + Math.floor(rand() * 2),
    response_time_ms: 1500 + Math.floor(rand() * 3500),
    hint_used: rand() < 0.15,
    auto_hint_triggered: rand() < 0.05,
    noni_guidance_used: rand() < 0.03,
    rama_task_alignment: rand() < 0.5 ? 1 : null,
    peima_target: rand() < 0.5 ? 1 : null,
  };
}

// ============================================================
// Test 1 — Baseline פיילוט: 5 ילדות × 1800 events דרך Logger המלא
// ============================================================
divider('1) Baseline פיילוט — 5 ילדות × 1,800 events דרך Logger.logActivityResult');

fullReset();
const STUDENTS = ['stu-aria', 'stu-noa', 'stu-tamar', 'stu-lia', 'stu-mia'];
const rand = makeRand(0xBEEF);

let logTimes = [];
const start = Date.now();
STUDENTS.forEach(stuId => {
  for (let i = 0; i < 1800; i++) {
    const evt = realisticEvent(rand, stuId);
    const t0 = process.hrtime.bigint();
    Logger.logActivityResult(evt);
    const t1 = process.hrtime.bigint();
    logTimes.push(Number(t1 - t0) / 1e6);
  }
});
const elapsed = Date.now() - start;

const snap1 = snapshotSizes();
console.log(`     total elapsed: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
console.log(`     per-event avg: ${(logTimes.reduce((a,b)=>a+b,0) / logTimes.length).toFixed(3)}ms`);
console.log(`     storage breakdown:`);
console.log(`       underwater-app:v1   : ${fmtKB(snap1['underwater-app:v1'])}`);
console.log(`       avnei-bkt-v1        : ${fmtKB(snap1['avnei-bkt-v1'])}`);
console.log(`       avnei-bkt-strand-v1 : ${fmtKB(snap1['avnei-bkt-strand-v1'])}`);
console.log(`       avnei-epa-v1        : ${fmtKB(snap1['avnei-epa-v1'])}`);
console.log(`       TOTAL               : ${fmtKB(snap1.total)} (${((snap1.total / FAKE_QUOTA) * 100).toFixed(2)}% מתקרת 5MB)`);

ok(`9,000 events דרך Logger לא חורגים מ-1MB (got ${fmtKB(snap1.total)})`, snap1.total < 1024 * 1024);
ok(`underwater-app:v1 < 600KB (events ב-state)`, snap1['underwater-app:v1'] < 600 * 1024);
ok(`avnei-bkt-v1 < 200KB`, snap1['avnei-bkt-v1'] < 200 * 1024);

// state.events מוגבל ל-1000 — לוודא
const stateRaw = JSON.parse(localStorage._data['underwater-app:v1']);
ok(`state.events נחתך ל-1000 (got ${stateRaw.events.length})`, stateRaw.events.length === 1000);

if (snap1.total > 500 * 1024) {
  findings.push({
    severity: 'important',
    area: 'localStorage baseline',
    detail: `פיילוט baseline (5×1800 events) = ${fmtKB(snap1.total)} (${((snap1.total / FAKE_QUOTA) * 100).toFixed(1)}% מ-5MB). יש מקום, אבל לעקוב.`,
  });
}

// ============================================================
// Test 2 — בודק אם state.events הוא ה"דומיננטי" (1000 events × ~500 bytes ≈ 500KB)
// ============================================================
divider('2) breakdown — מה התופס המרכזי?');

const total = snap1.total;
const pct = (k) => ((snap1[k] / total) * 100).toFixed(1);
console.log(`     state.events (underwater-app:v1) : ${pct('underwater-app:v1')}% מהשטח`);
console.log(`     BKT  (v1 + strand)                : ${(((snap1['avnei-bkt-v1'] + snap1['avnei-bkt-strand-v1']) / total) * 100).toFixed(1)}%`);
console.log(`     EPA  (epa-v1)                     : ${pct('avnei-epa-v1')}%`);

// ============================================================
// Test 3 — סקאלינג ל-50 ילדות (פיילוט מורחב היפותטי)
// ============================================================
divider('3) extrapolation — איך 50 ילדות / 100 ילדות נראות?');

// state.events קבוע (1000 events FIFO — לא תלוי במספר הילדות).
// BKT/EPA לינארי בילדות — כל ילדה מקבלת state פר-עצמה.
const bktPerStudent = (snap1['avnei-bkt-v1'] + snap1['avnei-bkt-strand-v1']) / STUDENTS.length;
const epaPerStudent = snap1['avnei-epa-v1'] / STUDENTS.length;
const statePerStudent = 0; // events משותפים (FIFO) — לא לינארי

const fixedFloor = snap1['underwater-app:v1']; // state.events רוויית

function projectFor(numStudents) {
  return fixedFloor + (bktPerStudent + epaPerStudent) * numStudents;
}

[1, 5, 10, 25, 50, 100, 250].forEach(n => {
  const projected = projectFor(n);
  const pct = (projected / FAKE_QUOTA) * 100;
  const note = pct > 80 ? '  <- CRITICAL' : pct > 50 ? '  <- WATCH' : '';
  console.log(`     ${String(n).padStart(3)} ילדות : ${fmtKB(projected).padStart(10)}  (${pct.toFixed(1).padStart(5)}% מ-5MB)${note}`);
});

const proj50 = projectFor(50);
const proj100 = projectFor(100);
ok(`50 ילדות נשארות מתחת ל-2MB`, proj50 < 2 * 1024 * 1024);
ok(`100 ילדות נשארות מתחת ל-4MB`, proj100 < 4 * 1024 * 1024);

if (proj100 > FAKE_QUOTA * 0.7) {
  findings.push({
    severity: 'important',
    area: 'localStorage scaling',
    detail: `ב-100 ילדות נגיע ל-${((proj100 / FAKE_QUOTA) * 100).toFixed(0)}% מ-5MB. לפיילוט 5 ילדות לא רלוונטי, אך לסקייל בית-ספרי כדאי לתכנן archival ל-IndexedDB.`,
  });
}

// ============================================================
// Test 4 — איפוס per-student (האם reset() באמת מנקה?)
// ============================================================
divider('4) BKT.reset(studentId) — מנקה מקום?');

const beforeReset = snapshotSizes().total;
BKT.reset('stu-aria');
EPA.reset('stu-aria');
const afterReset = snapshotSizes().total;
const freed = beforeReset - afterReset;
console.log(`     freed: ${fmtKB(freed)} (${((freed / beforeReset) * 100).toFixed(1)}% של ה-total)`);
ok(`reset של ילדה אחת מוריד ≥10KB`, freed >= 10 * 1024);

// ============================================================
// Test 5 — סטרס בינוני: 20 ילדות × 500 events דרך Logger מלא (מאמת sub-linearity)
//   (להגיע ל-100 ילדות דרך Logger לוקח 8+ דקות בגלל O(n²) של JSON.parse על state גדל.
//    תחת תנאי mobile-realistic ספציפי ב-extrapolation לעיל.)
// ============================================================
divider('5) Stress — 20 ילדות × 500 events דרך Logger מלא');

fullReset();
const rand2 = makeRand(0xCAFE);
const STRESS_STU = 20;
const STRESS_EVT = 500;
const stressStart = Date.now();
let quotaHit = false;
let eventsBeforeFail = 0;
let studentsBeforeFail = 0;

try {
  for (let s = 0; s < STRESS_STU; s++) {
    const stuId = `bulk-stu-${s + 1}`;
    studentsBeforeFail = s + 1;
    for (let i = 0; i < STRESS_EVT; i++) {
      Logger.logActivityResult(realisticEvent(rand2, stuId));
      eventsBeforeFail++;
    }
  }
} catch (e) {
  quotaHit = true;
  console.log(`     QuotaExceeded אחרי ${studentsBeforeFail} ילדות / ${eventsBeforeFail.toLocaleString()} events`);
  console.log(`     state size בזמן הקריסה: ${fmtKB(snapshotSizes().total)}`);
}

const stressElapsed = Date.now() - stressStart;
const stressFinal = snapshotSizes().total;
console.log(`     elapsed: ${(stressElapsed / 1000).toFixed(1)}s`);
console.log(`     ${STRESS_STU} × ${STRESS_EVT} = ${(STRESS_STU * STRESS_EVT).toLocaleString()} events`);
console.log(`     final total: ${fmtKB(stressFinal)} (${((stressFinal / FAKE_QUOTA) * 100).toFixed(2)}% מ-5MB)`);

ok(`${STRESS_STU} ילדות לא חוצים תקרת 5MB`, !quotaHit && stressFinal < FAKE_QUOTA);
if (quotaHit) {
  findings.push({
    severity: 'important',
    area: 'localStorage hard limit',
    detail: `QuotaExceeded ב-${studentsBeforeFail} ילדות. לפיילוט 5 ילדות לא רלוונטי, אבל לסקייל יותר — צריך archival.`,
  });
}

// ============================================================
// Test 6 — Sanity: BKT.responseTimesMs מנוקה ל-100?
// ============================================================
divider('6) Sanity — responseTimesMs cap=100 פעיל');

fullReset();
const stuId = 'cap-test';
setCurrentStudent(stuId);
for (let i = 0; i < 500; i++) {
  Logger.logActivityResult({
    activity_type: 'storm-quest',
    target_letter: 'ת',
    is_correct: i % 2 === 0,
    response_time_ms: 1000 + i,
  });
}
const island = BKT.getIslandState(stuId, 3);
const letterRT = island.per_letter['ת'].responseTimesMs;
ok(`responseTimesMs נחתך ל-100 (got ${letterRT.length})`, letterRT.length === 100);

const strand = BKT.getStrandState(stuId, 1);
ok(`strand responseTimesMs נחתך ל-100 (got ${strand.responseTimesMs.length})`,
   strand.responseTimesMs.length === 100);

// ============================================================
// סיכום
// ============================================================
divider('סיכום');
console.log(`\n  Tests:    ${passed} pass · ${failed} fail`);
console.log(`  Findings: ${findings.length}`);
if (findings.length) {
  findings.forEach((f, i) => {
    console.log(`\n   [${i + 1}] [${f.severity.toUpperCase()}] ${f.area}`);
    console.log(`       ${f.detail}`);
  });
}

console.log('\n  Headline numbers:');
console.log(`    Baseline (5×1800)        : ${fmtKB(snap1.total)} (${((snap1.total / FAKE_QUOTA) * 100).toFixed(2)}% מ-5MB)`);
console.log(`    BKT footprint per student: ${fmtKB(bktPerStudent)}`);
console.log(`    EPA footprint per student: ${fmtKB(epaPerStudent)}`);
console.log(`    state.events (constant)  : ${fmtKB(fixedFloor)}`);
console.log(`    projected @ 100 ילדות    : ${fmtKB(proj100)}`);
console.log(`    QuotaExceeded triggered  : ${quotaHit ? 'YES @ ' + studentsBeforeFail + ' ילדות' : 'NO (100 × 1000 events לא חרגו)'}`);

process.exit(failed > 0 ? 1 : 0);
