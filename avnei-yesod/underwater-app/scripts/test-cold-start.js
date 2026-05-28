// ============================================================
// Smoke test for A.5 — Cold-start Protocol
// ============================================================
// בודק את 4 הקומבינציות הקריטיות של (ימים × ניסיונות):
//   day1 × 5att   → inColdStart=true  (לא עברנו אף קריטריון)
//   day1 × 50att  → inColdStart=true  (עברנו attempts בלבד · ימים=false)
//   day5 × 5att   → inColdStart=true  (עברנו days בלבד · attempts=false)
//   day5 × 50att  → inColdStart=false (שני הקריטריונים → יצאנו)
//
// בנוסף: לוודא ש-firstSeenAt נלקח מ-entry_date (StudentsStore), עם fallback ל-event timestamp.
//
// הרצה: node scripts/test-cold-start.js (מתיקיית underwater-app)
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeLocalStorage() {
  const store = {};
  return {
    getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    _dump: () => ({...store}),
  };
}

function loadAllModules() {
  const win = {};
  const localStorage = makeLocalStorage();
  const sandbox = {
    window: win, localStorage, console, Date, Math, JSON, Object, Array, String, Number,
    setTimeout: () => {},
    document: { createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }), body: { appendChild: () => {} } },
  };
  win.localStorage = localStorage;
  vm.createContext(sandbox);
  ['bkt.js', 'epa.js', 'mastery-check.js'].forEach(f => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'shared', f), 'utf8');
    vm.runInContext(src, sandbox, { filename: f });
    Object.keys(win).forEach(k => { sandbox[k] = win[k]; });
  });
  return { sandbox, win, localStorage };
}

function assert(cond, msg) {
  if (!cond) { console.error('  ✗ FAIL:', msg); process.exitCode = 1; return false; }
  console.log('  ✓', msg);
  return true;
}

// Helper — יוצר תלמידה ב-StudentsStore עם entry_date מסוים, וכותב X ניסיונות לסטרנדים.
function seedStudent(win, studentId, name, daysAgo, attemptsTotal) {
  // 1) student record עם entry_date
  const entryDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);
  const existing = JSON.parse(win.localStorage.getItem('avnei-yesod-students') || '[]');
  existing.push({ id: studentId, name, entry_date: entryDate, profile: null, profile_decided_at: null });
  win.localStorage.setItem('avnei-yesod-students', JSON.stringify(existing));

  // 2) הזרקת attempts לסטרנדים — מחלקים שווה בין 5 הסטרנדים
  if (attemptsTotal > 0) {
    const STORAGE_KEY_STRAND = 'avnei-bkt-strand-v1';
    const ALL_22 = win.AvneiBKT.ALL_HEBREW_LETTERS_22;
    const raw = win.localStorage.getItem(STORAGE_KEY_STRAND);
    const state = raw ? JSON.parse(raw) : {};
    if (!state[studentId]) state[studentId] = {};
    for (let s = 1; s <= 5; s++) {
      const perLetter = {};
      if (s === 1) {
        ALL_22.forEach(l => {
          perLetter[l] = { pKnown: 0.12, attempts: 0, correct: 0, wrong: 0, responseTimesMs: [], masteryAchievedAt: null };
        });
      }
      state[studentId][s] = {
        pKnown: 0.12, attempts: Math.floor(attemptsTotal / 5), correct: 0, wrong: 0,
        responseTimesMs: [], sessionsAtMastery: 0, lastSessionId: null, masteryAchievedAt: null,
        per_island_attempts: {}, per_letter: s === 1 ? perLetter : undefined,
      };
    }
    win.localStorage.setItem(STORAGE_KEY_STRAND, JSON.stringify(state));
  }
}

// ============================================================
// Test 1 — API exists
// ============================================================
console.log('\n[1] API exists');
{
  const { win } = loadAllModules();
  assert(typeof win.AvneiMasteryCheck.isInColdStart === 'function', 'isInColdStart is a function');
  assert(win.AvneiMasteryCheck.COLD_START_DAYS === 3, `COLD_START_DAYS === 3 (got ${win.AvneiMasteryCheck.COLD_START_DAYS})`);
  assert(win.AvneiMasteryCheck.COLD_START_ATTEMPTS === 30, `COLD_START_ATTEMPTS === 30 (got ${win.AvneiMasteryCheck.COLD_START_ATTEMPTS})`);
}

// ============================================================
// Test 2 — return shape
// ============================================================
console.log('\n[2] Return shape — {inColdStart, daysSince, attemptsTotal, daysCriterion, attemptsCriterion}');
{
  const { win } = loadAllModules();
  const r = win.AvneiMasteryCheck.isInColdStart('stu-shape');
  ['inColdStart', 'daysSince', 'attemptsTotal', 'daysCriterion', 'attemptsCriterion'].forEach(k => {
    assert(k in r, `result has field "${k}"`);
  });
  assert(typeof r.inColdStart === 'boolean', 'inColdStart is boolean');
  assert(typeof r.daysSince === 'number', 'daysSince is number');
  assert(typeof r.attemptsTotal === 'number', 'attemptsTotal is number');
}

// ============================================================
// Test 3 — 4 קומבינציות קריטיות (Acceptance Criteria)
// ============================================================
console.log('\n[3] 4 combinations — Acceptance Criteria #1');

{
  const { win } = loadAllModules();
  // Case 1: day1 × 5att → cold (לא עברנו אף אחד)
  seedStudent(win, 'stu-A', 'יום 1 · 5 ניסיונות', 1, 5);
  const r = win.AvneiMasteryCheck.isInColdStart('stu-A');
  assert(r.inColdStart === true, `[day1 × 5att]   inColdStart=true (got ${r.inColdStart})`);
  assert(r.daysCriterion === false, `[day1 × 5att]   daysCriterion=false (days=${r.daysSince})`);
  assert(r.attemptsCriterion === false, `[day1 × 5att]   attemptsCriterion=false (att=${r.attemptsTotal})`);
}
{
  const { win } = loadAllModules();
  // Case 2: day1 × 50att → cold (עברנו attempts בלבד, days=false)
  seedStudent(win, 'stu-B', 'יום 1 · 50 ניסיונות', 1, 50);
  const r = win.AvneiMasteryCheck.isInColdStart('stu-B');
  assert(r.inColdStart === true, `[day1 × 50att]  inColdStart=true (got ${r.inColdStart})`);
  assert(r.daysCriterion === false, `[day1 × 50att]  daysCriterion=false (days=${r.daysSince})`);
  assert(r.attemptsCriterion === true, `[day1 × 50att]  attemptsCriterion=true (att=${r.attemptsTotal})`);
}
{
  const { win } = loadAllModules();
  // Case 3: day5 × 5att → cold (עברנו days בלבד, attempts=false)
  seedStudent(win, 'stu-C', 'יום 5 · 5 ניסיונות', 5, 5);
  const r = win.AvneiMasteryCheck.isInColdStart('stu-C');
  assert(r.inColdStart === true, `[day5 × 5att]   inColdStart=true (got ${r.inColdStart})`);
  assert(r.daysCriterion === true, `[day5 × 5att]   daysCriterion=true (days=${r.daysSince})`);
  assert(r.attemptsCriterion === false, `[day5 × 5att]   attemptsCriterion=false (att=${r.attemptsTotal})`);
}
{
  const { win } = loadAllModules();
  // Case 4: day5 × 50att → יצא מ-cold-start
  seedStudent(win, 'stu-D', 'יום 5 · 50 ניסיונות', 5, 50);
  const r = win.AvneiMasteryCheck.isInColdStart('stu-D');
  assert(r.inColdStart === false, `[day5 × 50att]  inColdStart=false (יצא — got ${r.inColdStart})`);
  assert(r.daysCriterion === true, `[day5 × 50att]  daysCriterion=true (days=${r.daysSince})`);
  assert(r.attemptsCriterion === true, `[day5 × 50att]  attemptsCriterion=true (att=${r.attemptsTotal})`);
}

// ============================================================
// Test 4 — edge cases
// ============================================================
console.log('\n[4] Edge cases');
{
  const { win } = loadAllModules();
  // תלמידה לגמרי חדשה — אין רשומה ב-StudentsStore, אין events
  const r = win.AvneiMasteryCheck.isInColdStart('stu-fresh');
  assert(r.inColdStart === true, `[no record at all]  inColdStart=true (firstSeenAt=now, daysSince=0)`);
  assert(r.daysSince === 0, `[no record]         daysSince=0`);
  assert(r.attemptsTotal === 0, `[no record]         attemptsTotal=0`);
}
{
  const { win } = loadAllModules();
  // ספי גבולות — בדיוק 3 ימים + בדיוק 30 ניסיונות → יצא
  seedStudent(win, 'stu-edge', 'גבול', 3, 30);
  const r = win.AvneiMasteryCheck.isInColdStart('stu-edge');
  assert(r.inColdStart === false, `[exactly 3 days × 30 att] inColdStart=false (גבול → יצא · got ${r.inColdStart})`);
}
{
  const { win } = loadAllModules();
  // ספי גבולות — 2 ימים + 30 → עדיין cold (חסר יום)
  seedStudent(win, 'stu-edge2', 'גבול 2', 2, 30);
  const r = win.AvneiMasteryCheck.isInColdStart('stu-edge2');
  assert(r.inColdStart === true, `[2 days × 30 att]         inColdStart=true (חסר יום · got ${r.inColdStart})`);
}
{
  const { win } = loadAllModules();
  // Fallback ל-event timestamp כש-entry_date חסר
  win.localStorage.setItem('underwater-app:v1', JSON.stringify({
    events: [{ student_id: 'stu-no-entry', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 }],
    teacherFlags: [],
  }));
  const r = win.AvneiMasteryCheck.isInColdStart('stu-no-entry');
  assert(r.daysSince >= 4 && r.daysSince <= 5, `[fallback to event ts] daysSince ≈ 5 (got ${r.daysSince})`);
}

// ============================================================
// Test 5 — backwards compat
// ============================================================
console.log('\n[5] Backwards compat — checkMastery + checkRamaTaskStatus עדיין עובדים');
{
  const { win } = loadAllModules();
  const m = win.AvneiMasteryCheck.checkMastery('stu-bc', 3);
  assert('met' in m, 'checkMastery still works');
  const r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-bc', 1);
  assert('status' in r, 'checkRamaTaskStatus still works');
}

console.log('\n' + (process.exitCode ? '✗ Some tests failed' : '✓ All cold-start tests passed') + '\n');
