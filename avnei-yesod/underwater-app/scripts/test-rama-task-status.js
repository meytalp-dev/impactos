// ============================================================
// Smoke test for F.21A — checkRamaTaskStatus + teacher-rama.html JS
// ============================================================
// מטרה: לוודא ש-(1) mastery-check.js נטען בלי שגיאות, (2) checkRamaTaskStatus
// קיים, ו-(3) הוא מחזיר מבנה תקין לתרחישי בסיס: תלמידה ריקה, תלמידה עם
// נתונים חלקיים, תלמידה עם 18+ אותיות.
//
// הרצה: node scripts/test-rama-task-status.js (מהתיקייה underwater-app)
// אין תלות חיצונית — מחקה window+localStorage ב-Node.
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

function makeSandbox() {
  const win = {};
  const localStorage = makeLocalStorage();
  const sandbox = {
    window: win,
    localStorage,
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    setTimeout: () => {},
    document: { createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }), body: { appendChild: () => {} } },
  };
  win.localStorage = localStorage;
  return { sandbox, win, localStorage };
}

function loadInto(sandbox, file) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'shared', file), 'utf8');
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: file });
}

function loadAllModules() {
  const { sandbox, win, localStorage } = makeSandbox();
  vm.createContext(sandbox);

  ['bkt.js', 'epa.js', 'mastery-check.js'].forEach(f => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'shared', f), 'utf8');
    vm.runInContext(src, sandbox, { filename: f });
    // בדפדפן: window === globalThis, אז window.AvneiBKT נגיש גם כ-AvneiBKT.
    // ב-Node sandbox צריך alias ידני אחרי כל קובץ.
    Object.keys(win).forEach(k => { sandbox[k] = win[k]; });
  });

  return { sandbox, win, localStorage };
}

function assert(cond, msg) {
  if (!cond) {
    console.error('  ✗ FAIL:', msg);
    process.exitCode = 1;
    return false;
  }
  console.log('  ✓', msg);
  return true;
}

// ============================================================
// Test 1 — Modules load + APIs exist
// ============================================================
console.log('\n[1] Modules load + APIs exist');
{
  const { win } = loadAllModules();
  assert(typeof win.AvneiBKT === 'object', 'window.AvneiBKT defined');
  assert(typeof win.AvneiEPA === 'object', 'window.AvneiEPA defined');
  assert(typeof win.AvneiMasteryCheck === 'object', 'window.AvneiMasteryCheck defined');
  assert(typeof win.AvneiMasteryCheck.checkRamaTaskStatus === 'function',
    'AvneiMasteryCheck.checkRamaTaskStatus is a function');
  assert(typeof win.AvneiMasteryCheck.RAMA_TASKS === 'object', 'RAMA_TASKS exposed');
  assert(Object.keys(win.AvneiMasteryCheck.RAMA_TASKS).length === 10,
    `RAMA_TASKS has 10 entries (got ${Object.keys(win.AvneiMasteryCheck.RAMA_TASKS).length})`);
}

// ============================================================
// Test 2 — RAMA_TASKS structure
// ============================================================
console.log('\n[2] RAMA_TASKS structure — all 10 tasks have required fields');
{
  const { win } = loadAllModules();
  const tasks = win.AvneiMasteryCheck.RAMA_TASKS;
  let okAll = true;
  for (let i = 1; i <= 10; i++) {
    const t = tasks[i];
    if (!t) { okAll = false; console.error(`  ✗ task ${i} missing`); continue; }
    const required = ['name', 'value_threshold', 'value_max', 'pulse', 'islands'];
    for (const k of required) {
      if (!(k in t)) { okAll = false; console.error(`  ✗ task ${i} missing field "${k}"`); }
    }
    if (!Array.isArray(t.islands) || t.islands.length === 0) {
      okAll = false; console.error(`  ✗ task ${i} islands not a non-empty array`);
    }
  }
  assert(okAll, 'all 10 RAMA_TASKS have required fields {name, value_threshold, value_max, pulse, islands}');
  // pulse distribution: 1 → tasks 1,2 · 2 → tasks 3,4 · 3 → tasks 5-10
  const byPulse = { 1: 0, 2: 0, 3: 0 };
  for (let i = 1; i <= 10; i++) byPulse[tasks[i].pulse]++;
  assert(byPulse[1] === 2 && byPulse[2] === 2 && byPulse[3] === 6,
    `pulse distribution = pulse1:2 · pulse2:2 · pulse3:6 (got ${byPulse[1]}:${byPulse[2]}:${byPulse[3]})`);
}

// ============================================================
// Test 3 — Empty student → all tasks cold
// ============================================================
console.log('\n[3] Empty student → all 10 tasks return status="cold"');
{
  const { win } = loadAllModules();
  let allCold = true;
  for (let i = 1; i <= 10; i++) {
    const r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-empty', i);
    if (r.status !== 'cold') {
      allCold = false;
      console.error(`  ✗ task ${i}: expected status='cold', got '${r.status}' (reason: ${r.reason})`);
    }
  }
  assert(allCold, 'all 10 tasks return cold for empty student');
}

// ============================================================
// Test 4 — Return shape per spec §5
// ============================================================
console.log('\n[4] checkRamaTaskStatus return shape matches spec §5');
{
  const { win } = loadAllModules();
  const r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-x', 1);
  const expectedKeys = ['status', 'value', 'threshold', 'confidence', 'contributingIslands', 'reason'];
  expectedKeys.forEach(k => {
    assert(k in r, `result has field "${k}"`);
  });
  assert(['pass', 'near', 'fail', 'cold'].includes(r.status), `status is one of {pass,near,fail,cold} (got "${r.status}")`);
  assert(['high', 'med', 'low'].includes(r.confidence), `confidence is one of {high,med,low} (got "${r.confidence}")`);
  assert(Array.isArray(r.contributingIslands), 'contributingIslands is array');
  assert(r.contributingIslands.length === 1 && r.contributingIslands[0] === 3,
    'task 1 contributingIslands = [3]');
}

// ============================================================
// Test 5 — Task 1 status reflects real mastered-letter count (not BKT proxy)
//          1 letter mastered  → fail (1 < 14 = 18 × 0.80)
//          14 letters mastered → near (14 ≤ x < 18)
//          18 letters mastered → pass (≥ 18)
// ============================================================
console.log('\n[5] Task 1 status — derived from mastered letter count, not BKT proxy');

function masterLetters(win, studentId, letters) {
  // הזרקה ישירה ל-localStorage של avnei-bkt-strand-v1 כדי לסמן masteryAchievedAt
  // (מהיר יותר מלהריץ עשרות events פר אות עד שמגיעים לסף).
  const STORAGE_KEY_STRAND = 'avnei-bkt-strand-v1';
  const ALL_22 = win.AvneiBKT.ALL_HEBREW_LETTERS_22;
  const raw = win.localStorage.getItem(STORAGE_KEY_STRAND);
  const state = raw ? JSON.parse(raw) : {};
  if (!state[studentId]) state[studentId] = {};
  if (!state[studentId][1]) {
    const perLetter = {};
    ALL_22.forEach(l => {
      perLetter[l] = { pKnown: 0.12, attempts: 0, correct: 0, wrong: 0, responseTimesMs: [], masteryAchievedAt: null };
    });
    state[studentId][1] = {
      pKnown: 0.12, attempts: 0, correct: 0, wrong: 0,
      responseTimesMs: [], sessionsAtMastery: 0, lastSessionId: null,
      masteryAchievedAt: null, per_island_attempts: {}, per_letter: perLetter,
    };
  }
  const perLetter = state[studentId][1].per_letter;
  letters.forEach(l => {
    if (perLetter[l]) {
      perLetter[l].pKnown = 0.99;
      perLetter[l].attempts = 10;
      perLetter[l].correct = 10;
      perLetter[l].masteryAchievedAt = Date.now();
    }
  });
  // צבירת attempts לסטרנד עצמו — דרוש כדי שה-confidence לא יהיה 'low' באופן מלאכותי
  state[studentId][1].attempts = letters.length * 10;
  win.localStorage.setItem(STORAGE_KEY_STRAND, JSON.stringify(state));

  // mirror גם ל-island 3 (legacy) כדי ש-island.total_attempts ייתן signal ל-totalAttempts
  const STORAGE_KEY = 'avnei-bkt-v1';
  const rawL = win.localStorage.getItem(STORAGE_KEY);
  const stateL = rawL ? JSON.parse(rawL) : {};
  if (!stateL[studentId]) stateL[studentId] = {};
  if (!stateL[studentId][3]) {
    const perLetterL = {};
    ALL_22.forEach(l => {
      perLetterL[l] = { pKnown: 0.10, attempts: 0, correct: 0, wrong: 0, responseTimesMs: [], masteryAchievedAt: null };
    });
    stateL[studentId][3] = {
      per_letter: perLetterL, aggregate_pKnown: 0.10,
      total_attempts: 0, sessionsAtMastery: 0, lastSessionId: null, masteryAchievedAt: null,
    };
  }
  letters.forEach(l => {
    if (stateL[studentId][3].per_letter[l]) {
      stateL[studentId][3].per_letter[l].attempts = 10;
      stateL[studentId][3].per_letter[l].pKnown = 0.99;
      stateL[studentId][3].per_letter[l].masteryAchievedAt = Date.now();
    }
  });
  stateL[studentId][3].total_attempts = letters.length * 10;
  win.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateL));
}

{
  const { win } = loadAllModules();
  // 1 letter mastered → fail
  win.AvneiBKT.getStrandState('stu-1L', 1);  // init
  masterLetters(win, 'stu-1L', ['מ']);
  let r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-1L', 1);
  assert(r.value === 1, `1 letter mastered → value=1 (got ${r.value})`);
  assert(r.status === 'fail', `1 mastered → status='fail' (got "${r.status}"; 1 < 18×0.80=14.4)`);
}
{
  const { win } = loadAllModules();
  // 14 letters mastered → near (14 ≥ 14.4? no, 14 < 14.4 — should be fail)
  // → 15 letters → near
  win.AvneiBKT.getStrandState('stu-15L', 1);
  masterLetters(win, 'stu-15L', ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס']);
  let r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-15L', 1);
  assert(r.value === 15, `15 letters mastered → value=15 (got ${r.value})`);
  assert(r.status === 'near', `15 mastered → status='near' (got "${r.status}"; 14.4 ≤ 15 < 18)`);
}
{
  const { win } = loadAllModules();
  // 18 letters mastered → pass
  win.AvneiBKT.getStrandState('stu-18L', 1);
  masterLetters(win, 'stu-18L', ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ']);
  let r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-18L', 1);
  assert(r.value === 18, `18 letters mastered → value=18 (got ${r.value})`);
  assert(r.status === 'pass', `18 mastered → status='pass' (got "${r.status}"; 18 ≥ 18)`);
}

// ============================================================
// Test 6 — Aggregation: 2 contributing islands, min wins
// ============================================================
console.log('\n[6] Aggregation logic — min wins among contributing islands');
{
  const { win } = loadAllModules();
  // task 5 contributes from islands 4, 5
  // No events → cold
  let r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-fresh', 5);
  assert(r.status === 'cold', 'task 5 cold without any events on islands 4/5');

  // Add events on island 4 only — should be cold for 5 (because island 5 has no data, 4 alone insufficient)
  for (let i = 0; i < 12; i++) {
    win.AvneiBKT.ingestEvent({
      student_id: 'stu-a', session_id: 'sess-' + Math.floor(i / 5),
      primary_island_id: 4, target_letter: null,
      is_correct: i < 10, response_time_ms: 1500,
      activity_type: 'unknown', timestamp: Date.now() - (12 - i) * 1000,
    });
  }
  r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-a', 5);
  // The breakdown: island 4 has data → maybe near/fail. island 5 has 0 → cold.
  // Aggregation: not "all cold" so will be near or fail.
  assert(['near', 'fail', 'cold'].includes(r.status),
    `task 5 with island-4-only data returns valid status (got "${r.status}", reason: ${r.reason})`);
  assert(r.contributingIslands.length === 2 && r.contributingIslands.includes(4) && r.contributingIslands.includes(5),
    'task 5 contributingIslands = [4,5]');
}

// ============================================================
// Test 7 — Confidence thresholds
// ============================================================
console.log('\n[7] Confidence thresholds — 30+ → high, 10-29 → med, <10 → low');
{
  const { win } = loadAllModules();
  // Make student with 30+ events on island 3
  for (let i = 0; i < 35; i++) {
    win.AvneiBKT.ingestEvent({
      student_id: 'stu-bigdata', session_id: 'sess-' + Math.floor(i / 10),
      primary_island_id: 3, target_letter: 'מ',
      is_correct: true, response_time_ms: 1500,
      activity_type: 'shell', timestamp: Date.now() - (35 - i) * 1000,
    });
  }
  const r = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-bigdata', 1);
  assert(r.confidence === 'high', `confidence='high' with 35 attempts (got "${r.confidence}", attempts=${r.total_attempts})`);

  // Make student with 15 events
  for (let i = 0; i < 15; i++) {
    win.AvneiBKT.ingestEvent({
      student_id: 'stu-mid', session_id: 'sess-' + Math.floor(i / 10),
      primary_island_id: 3, target_letter: 'מ',
      is_correct: true, response_time_ms: 1500,
      activity_type: 'shell', timestamp: Date.now() - (15 - i) * 1000,
    });
  }
  const r2 = win.AvneiMasteryCheck.checkRamaTaskStatus('stu-mid', 1);
  assert(r2.confidence === 'med', `confidence='med' with 15 attempts (got "${r2.confidence}", attempts=${r2.total_attempts})`);
}

// ============================================================
// Test 8 — Backwards compat: checkMastery still works
// ============================================================
console.log('\n[8] Backwards compat — checkMastery() still returns expected shape');
{
  const { win } = loadAllModules();
  const r = win.AvneiMasteryCheck.checkMastery('stu-ignored', 3);
  assert('met' in r && 'conditions' in r, 'checkMastery returns {met, conditions, ...}');
  assert(r.island_id === 3, 'island_id = 3');
}

console.log('\n' + (process.exitCode ? '✗ Some tests failed' : '✓ All tests passed') + '\n');
