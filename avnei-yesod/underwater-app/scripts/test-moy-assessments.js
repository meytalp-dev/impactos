// ============================================================
// test-moy-assessments.js — בדיקות אוטומטיות ל-AvneiAssessments (MOY-Lite)
// סוכן 10 · 28.5.2026 · spec: _handoff/2026-05-28-MOY-diagnostic-spec.md
// ============================================================
// הרצה: node scripts/test-moy-assessments.js (מתיקיית underwater-app)
// יוצא ב-exit 0 אם הכל ירוק, אחרת 1.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Fake localStorage כדי להריץ את הקוד בסביבת Node
function makeLocalStorage() {
  const store = {};
  return {
    getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    _dump: () => ({ ...store }),
  };
}

function loadAssessmentsModule() {
  const localStorage = makeLocalStorage();
  const win = {};
  const sandbox = {
    window: win,
    localStorage,
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    Error,
    String,
    Number,
    module: { exports: {} },
  };
  win.localStorage = localStorage;
  vm.createContext(sandbox);
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'shared', 'assessments.js'),
    'utf8'
  );
  vm.runInContext(src, sandbox, { filename: 'assessments.js' });
  return { sandbox, win, localStorage };
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}

function header(title) { console.log('\n=== ' + title + ' ==='); }

// ============================================================
// תחילת בדיקות
// ============================================================

console.log('\n📋 MOY-Lite Assessments — Test Suite');
console.log('====================================');

// ────────────────────────────────────────────
// בלוק 1 — API surface
// ────────────────────────────────────────────
header('1. API surface');
{
  const { win } = loadAssessmentsModule();
  assert(typeof win.AvneiAssessments === 'object', 'window.AvneiAssessments מיוצא');
  assert(typeof win.AvneiAssessments.recordMOYAttempt === 'function', 'recordMOYAttempt() קיים');
  assert(typeof win.AvneiAssessments.getMOYStatus === 'function', 'getMOYStatus() קיים');
  assert(typeof win.AvneiAssessments.getDueAssessments === 'function', 'getDueAssessments() קיים');
  assert(win.AvneiAssessments.STORAGE_KEY === 'underwater-app:assessments', 'STORAGE_KEY נפרד מ-events רגילים (spec §3.3)');
  assert(win.AvneiAssessments.FIVE_WEEKS_MS === 5 * 7 * 24 * 60 * 60 * 1000, 'FIVE_WEEKS_MS = 5 שבועות בדיוק');
  assert(win.AvneiAssessments.TASK_THRESHOLDS.task_3.threshold === 7, 'task_3 threshold = 7 (ראמ"ה)');
  assert(win.AvneiAssessments.TASK_THRESHOLDS.task_4.threshold === 16, 'task_4 threshold = 16 (ראמ"ה)');
  assert(win.AvneiAssessments.TASK_THRESHOLDS.task_3.max === 10, 'task_3 max = 10');
  assert(win.AvneiAssessments.TASK_THRESHOLDS.task_4.max === 22, 'task_4 max = 22');
}

// ────────────────────────────────────────────
// בלוק 2 — statusFor + enrichResults
// ────────────────────────────────────────────
header('2. statusFor + enrichResults');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;

  assert(A.statusFor(7, 7) === 'pass', 'ציון = רף → pass');
  assert(A.statusFor(8, 7) === 'pass', 'ציון > רף → pass');
  assert(A.statusFor(6, 7) === 'near', 'רף-1 → near');
  assert(A.statusFor(5, 7) === 'near', 'רף-2 → near (גבול קיצוני)');
  assert(A.statusFor(4, 7) === 'fail', 'רף-3 → fail');

  const e1 = A.enrichResults({ task_3: { score: 8 }, task_4: { score: 17 } });
  assert(e1.overall === 'pass', 'שתי משימות pass → overall=pass');
  assert(e1.tasks.task_3.threshold === 7, 'enrich מצרף threshold');

  const e2 = A.enrichResults({ task_3: { score: 7 }, task_4: { score: 3 } });
  assert(e2.overall === 'fail', 'אחת fail → overall=fail');

  const e3 = A.enrichResults({ task_3: { score: 6 }, task_4: { score: 17 } });
  assert(e3.overall === 'near', 'אחת near + אחת pass → overall=near');
}

// ────────────────────────────────────────────
// בלוק 3 — recordMOYAttempt — pass case
// ────────────────────────────────────────────
header('3. recordMOYAttempt — pass case');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;

  const attempt = A.recordMOYAttempt('stu-1', {
    task_3: { score: 9 },
    task_4: { score: 18 },
  });

  assert(attempt.overall_status === 'pass', 'attempt.overall_status === pass');
  assert(attempt.task_3.status === 'pass', 'task_3 status מחושב');

  const status = A.getMOYStatus('stu-1');
  assert(status.measured === true, 'measured=true אחרי שמירה');
  assert(status.latest_status === 'pass', 'latest_status=pass');
  assert(status.attempts.length === 1, 'attempts has 1 record');
  assert(status.next_review_due === null, 'next_review_due=null כש-pass');
}

// ────────────────────────────────────────────
// בלוק 4 — recordMOYAttempt — fail case + next_review_due
// ────────────────────────────────────────────
header('4. recordMOYAttempt — fail case + repeat schedule');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  const T0 = 1738368000000; // 2026-02-01

  A.recordMOYAttempt('stu-fail', {
    task_3: { score: 3 },
    task_4: { score: 5 },
  }, { date: T0 });

  const status = A.getMOYStatus('stu-fail');
  assert(status.latest_status === 'fail', 'fail כש-2 משימות מתחת לרף');
  assert(status.next_review_due === T0 + A.FIVE_WEEKS_MS, 'next_review_due = T0 + 5 שבועות בדיוק (spec §6)');
}

// ────────────────────────────────────────────
// בלוק 5 — getMOYStatus עבור תלמידה שלא נמדדה
// ────────────────────────────────────────────
header('5. getMOYStatus — not measured');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  const status = A.getMOYStatus('stu-new');
  assert(status.measured === false, 'measured=false ללא רשומה');
  assert(status.latest_status === 'not-measured', 'latest_status=not-measured');
  assert(Array.isArray(status.attempts) && status.attempts.length === 0, 'attempts=[]');
}

// ────────────────────────────────────────────
// בלוק 6 — getDueAssessments
// ────────────────────────────────────────────
header('6. getDueAssessments');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  const T0 = 1738368000000;

  // Fail → due in 5 weeks
  A.recordMOYAttempt('stu-due-1', { task_3: { score: 2 }, task_4: { score: 4 } }, { date: T0 });
  // Pass → לא צריך להופיע
  A.recordMOYAttempt('stu-due-2', { task_3: { score: 9 }, task_4: { score: 18 } }, { date: T0 });

  // לפני שעבר הזמן — לא מופיעה
  const before = A.getDueAssessments(T0 + A.FIVE_WEEKS_MS - 1);
  assert(before.length === 0, 'לפני הדדליין — getDueAssessments מחזיר []');

  // אחרי שעבר — מופיעה
  const after = A.getDueAssessments(T0 + A.FIVE_WEEKS_MS + 100);
  assert(after.length === 1, 'אחרי דדליין — מופיעה תלמידה אחת');
  assert(after[0].studentId === 'stu-due-1', 'התלמידה הנכונה (זו שנכשלה)');
  assert(after[0].type === 'moy', 'type=moy');
  assert(typeof after[0].due_date === 'number', 'due_date מספר');
}

// ────────────────────────────────────────────
// בלוק 7 — 2 ניסיונות (repeat scenario)
// ────────────────────────────────────────────
header('7. שתי העברות (repeat after fail)');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  const T0 = 1738368000000;
  const T1 = T0 + A.FIVE_WEEKS_MS;

  // ניסיון 1 — נכשלה
  A.recordMOYAttempt('stu-rep', { task_3: { score: 4 }, task_4: { score: 6 } }, { date: T0 });
  // ניסיון 2 — עברה
  A.recordMOYAttempt('stu-rep', { task_3: { score: 8 }, task_4: { score: 17 } }, { date: T1 });

  const status = A.getMOYStatus('stu-rep');
  assert(status.attempts.length === 2, 'attempts.length = 2');
  assert(status.latest_status === 'pass', 'latest_status=pass אחרי שעברה בניסיון 2');
  assert(status.next_review_due === null, 'next_review_due=null אחרי pass בניסיון 2');
  assert(status.last_attempt.date === T1, 'last_attempt = הניסיון האחרון');
}

// ────────────────────────────────────────────
// בלוק 8 — בידוד מ-state.events (localStorage נפרד)
// ────────────────────────────────────────────
header('8. בידוד מ-events רגילים (spec §3.3)');
{
  const { win, localStorage } = loadAssessmentsModule();
  const A = win.AvneiAssessments;

  // לפני שמירה — אין שום key
  assert(localStorage.getItem('underwater-app:v1') === null, 'underwater-app:v1 (events) ריק');
  assert(localStorage.getItem(A.STORAGE_KEY) === null, 'STORAGE_KEY ריק לפני שמירה');

  A.recordMOYAttempt('stu-iso', { task_3: { score: 8 }, task_4: { score: 17 } });

  assert(localStorage.getItem('underwater-app:v1') === null, 'אחרי שמירה — events לא נגעו');
  assert(localStorage.getItem(A.STORAGE_KEY) !== null, 'אחרי שמירה — STORAGE_KEY נכתב');

  const raw = JSON.parse(localStorage.getItem(A.STORAGE_KEY));
  assert(raw.moy && raw.moy['stu-iso'], 'מבנה state.assessments.moy[studentId] קיים');
  assert(raw.boy !== undefined, 'state.assessments.boy מוגדר (אפילו אם ריק)');
  assert(raw.eoy !== undefined, 'state.assessments.eoy מוגדר (אפילו אם ריק)');
}

// ────────────────────────────────────────────
// בלוק 9 — resetForStudent
// ────────────────────────────────────────────
header('9. resetForStudent');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  A.recordMOYAttempt('stu-x', { task_3: { score: 8 }, task_4: { score: 17 } });
  assert(A.getMOYStatus('stu-x').measured === true, 'מדידה קיימת לפני reset');
  A.resetForStudent('stu-x', 'moy');
  assert(A.getMOYStatus('stu-x').measured === false, 'אחרי resetForStudent — אין מדידה');
}

// ────────────────────────────────────────────
// בלוק 10 — Validation errors
// ────────────────────────────────────────────
header('10. Validation errors');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  let threw = false;
  try { A.recordMOYAttempt(null, { task_3: { score: 8 } }); } catch (e) { threw = true; }
  assert(threw, 'recordMOYAttempt(null, ...) זורק שגיאה');

  assert(A.getMOYStatus(null) === null, 'getMOYStatus(null) מחזיר null');

  // ציון 0 — fail (לא אמור לקרוס)
  const result = A.recordMOYAttempt('stu-zero', { task_3: { score: 0 }, task_4: { score: 0 } });
  assert(result.overall_status === 'fail', 'ציון 0 → fail (לא crash)');
}

// ────────────────────────────────────────────
// סיכום
// ────────────────────────────────────────────
console.log('\n====================================');
console.log(`Total: ${pass + fail} · ✓ ${pass} · ✗ ${fail}`);
if (fail === 0) {
  console.log('🟢 כל הבדיקות עברו.');
  process.exit(0);
} else {
  console.error('🔴 ' + fail + ' בדיקות נכשלו.');
  process.exit(1);
}
