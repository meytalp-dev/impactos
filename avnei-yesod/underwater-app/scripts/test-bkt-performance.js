// ============================================================
// test-bkt-performance.js — סוכן 24 · Phase A
// בדיקת performance של מנוע BKT תחת עומס פיילוט (5 ילדות × 22 אותיות × ~1800 events)
// סף קבילות: < 50ms פר קריאת read-API (checkMastery / getLetterMasteryDistribution
//              / getStrandState / getWeakestLetters). Aggregation על 5 ילדות
//              × 22 אותיות < 1000ms total.
// הרצה: node avnei-yesod/underwater-app/scripts/test-bkt-performance.js
// ============================================================
const fs = require('fs');
const path = require('path');

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};

const bktCode = fs.readFileSync(path.join(__dirname, '../js/shared/bkt.js'), 'utf-8');
eval(bktCode);
const BKT = global.window.AvneiBKT;

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
function reset() { global.localStorage._data = {}; }

// ============================================================
// Helpers
// ============================================================
function hrMs(t) {
  // process.hrtime.bigint() ב-ns. הופך ל-ms.
  return Number(t) / 1e6;
}
function now() { return process.hrtime.bigint(); }

function stats(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const sum = s.reduce((x, y) => x + y, 0);
  return {
    n: s.length,
    avg: sum / s.length,
    p50: s[Math.floor(s.length * 0.50)],
    p95: s[Math.floor(s.length * 0.95)],
    p99: s[Math.floor(s.length * 0.99)],
    max: s[s.length - 1],
  };
}
function fmtStats(s) {
  if (!s) return 'n=0';
  return `n=${s.n}  avg=${s.avg.toFixed(3)}ms  p50=${s.p50.toFixed(3)}ms  p95=${s.p95.toFixed(3)}ms  p99=${s.p99.toFixed(3)}ms  max=${s.max.toFixed(3)}ms`;
}

// פיזור deterministic — לא תלוי Math.random כדי שהבדיקה תהיה חזרתית.
function deterministicShuffle(seed, arr) {
  // LCG פשוט, deterministic
  let s = seed >>> 0;
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// בונה event-stream realistic לפיילוט:
//   נטייה לאי 3 (95%) — שאר ה-5% מתחלקים בין איים 2/5/6/9/15 (sampling אמיתי לפיילוט).
//   accuracy לפי "ילדה ממוצעת": 65-75% נכון. response_time 1500-5000ms.
function generateEvents(numStudents, eventsPerStudent, seed) {
  const STUDENTS = Array.from({ length: numStudents }, (_, i) => `pilot-stu-${i + 1}`);
  const LETTERS_22 = BKT.ALL_HEBREW_LETTERS_22.slice();
  const ISLAND_DIST = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 5, 6, 9, 15];
  const events = [];
  let s = seed >>> 0;
  function rand() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  }
  STUDENTS.forEach((stuId, idx) => {
    // accuracy פר-ילדה (כדי שלא יהיו זהות) — 0.55-0.85
    const baseAcc = 0.55 + (idx / Math.max(numStudents - 1, 1)) * 0.30;
    let sessId = 0;
    let sessionEvents = 0;
    for (let i = 0; i < eventsPerStudent; i++) {
      if (sessionEvents > 30) { sessId++; sessionEvents = 0; }
      sessionEvents++;
      const island = ISLAND_DIST[Math.floor(rand() * ISLAND_DIST.length)];
      const letter = LETTERS_22[Math.floor(rand() * 22)];
      const correct = rand() < baseAcc;
      const rt = 1500 + Math.floor(rand() * 3500);
      events.push({
        student_id: stuId,
        session_id: `sess-${stuId}-${sessId}`,
        primary_island_id: island,
        target_letter: letter,
        is_correct: correct,
        response_time_ms: rt,
        timestamp: 1700000000000 + i * 1000,
      });
    }
  });
  return { events, students: STUDENTS, letters: LETTERS_22 };
}

// ============================================================
// 1) Setup — 9000 events (5 × 1800)
// ============================================================
divider('1) Setup — מייצרת fixture של 9,000 events (5 ילדות × 1,800 כ"א)');

const NUM_STUDENTS = 5;
const EVENTS_PER_STUDENT = 1800;
const TOTAL_EVENTS = NUM_STUDENTS * EVENTS_PER_STUDENT;
const SEED = 0xC0DE;

reset();
const { events, students, letters } = generateEvents(NUM_STUDENTS, EVENTS_PER_STUDENT, SEED);
ok(`fixture: ${TOTAL_EVENTS.toLocaleString()} events ב-${NUM_STUDENTS} ילדות`,
   events.length === TOTAL_EVENTS);
ok(`כל ילדה מקבלת ${EVENTS_PER_STUDENT} events`,
   students.every(s => events.filter(e => e.student_id === s).length === EVENTS_PER_STUDENT));

// ============================================================
// 2) Bulk ingest performance
// ============================================================
divider(`2) BKT.ingestEvent × ${TOTAL_EVENTS.toLocaleString()} — bulk + per-event timing`);

const ingestTimes = [];
const bulkStart = now();
for (let i = 0; i < events.length; i++) {
  const t = now();
  BKT.ingestEvent(events[i]);
  ingestTimes.push(hrMs(now() - t));
}
const bulkMs = hrMs(now() - bulkStart);
const ingestStats = stats(ingestTimes);

console.log(`     bulk total: ${bulkMs.toFixed(0)}ms`);
console.log(`     per-event : ${fmtStats(ingestStats)}`);

ok(`bulk ingest פחות מ-30 שניות (got ${(bulkMs / 1000).toFixed(2)}s)`,
   bulkMs < 30_000,
   bulkMs >= 30_000 ? 'BLOCKING: אם ingest של 9000 events לוקח > 30 שניות, המורה לא תקבל reaction realtime' : null);
ok(`avg ingest < 5ms פר event (got ${ingestStats.avg.toFixed(3)}ms)`,
   ingestStats.avg < 5,
   ingestStats.avg >= 5 ? `סלאש פוטנציאלי — JSON.parse+stringify של state גדל O(n²)` : null);
ok(`p99 ingest < 20ms (got ${ingestStats.p99.toFixed(3)}ms)`, ingestStats.p99 < 20);
ok(`max ingest < 100ms (got ${ingestStats.max.toFixed(3)}ms)`,
   ingestStats.max < 100,
   ingestStats.max >= 100 ? `spike בודד גבוה — אולי GC/serialize של state גדול` : null);

if (ingestStats.avg > 5 || ingestStats.p99 > 20) {
  findings.push({
    severity: ingestStats.avg > 10 ? 'critical' : 'important',
    area: 'BKT ingest',
    detail: `ingest avg=${ingestStats.avg.toFixed(2)}ms p99=${ingestStats.p99.toFixed(2)}ms — bottleneck הוא JSON.parse+stringify של 2 mapים פר event. לאחר 9000 events ה-state גדל ל-~${(JSON.stringify(BKT.dump()).length / 1024).toFixed(0)}KB`,
  });
}

// ============================================================
// 3) Read API performance — קריאות שהדשבורד יבצע
// ============================================================
divider('3) Read APIs — checkMastery / getLetterMasteryDistribution / getStrandState / getWeakestLetters');

const N_READS = 1000;

function bench(label, fn) {
  const times = [];
  for (let i = 0; i < N_READS; i++) {
    const stuId = students[i % students.length];
    const t = now();
    fn(stuId);
    times.push(hrMs(now() - t));
  }
  const s = stats(times);
  console.log(`     ${label}`);
  console.log(`       ${fmtStats(s)}`);
  return s;
}

const sCheck = bench('checkMastery(stu, 3) × 1000', (id) => BKT.checkMastery(id, 3));
const sDist  = bench('getLetterMasteryDistribution(stu) × 1000', (id) => BKT.getLetterMasteryDistribution(id));
const sStr1  = bench('getStrandState(stu, 1) × 1000', (id) => BKT.getStrandState(id, 1));
const sCheckStrand = bench('checkStrandMastery(stu, 1) × 1000', (id) => BKT.checkStrandMastery(id, 1));
const sWeak  = bench('getWeakestLetters(stu, 3) × 1000', (id) => BKT.getWeakestLetters(id, 3));
const sLetter = bench('getLetterState(stu, "מ") × 1000', (id) => BKT.getLetterState(id, 'מ'));

ok(`checkMastery avg < 50ms (got ${sCheck.avg.toFixed(2)}ms)`, sCheck.avg < 50);
ok(`getLetterMasteryDistribution avg < 50ms (got ${sDist.avg.toFixed(2)}ms)`, sDist.avg < 50);
ok(`getStrandState avg < 50ms (got ${sStr1.avg.toFixed(2)}ms)`, sStr1.avg < 50);
ok(`getWeakestLetters avg < 50ms (got ${sWeak.avg.toFixed(2)}ms)`, sWeak.avg < 50);
ok(`getLetterState avg < 50ms (got ${sLetter.avg.toFixed(2)}ms)`, sLetter.avg < 50);

[
  ['checkMastery', sCheck],
  ['getLetterMasteryDistribution', sDist],
  ['getStrandState', sStr1],
  ['checkStrandMastery', sCheckStrand],
  ['getWeakestLetters', sWeak],
  ['getLetterState', sLetter],
].forEach(([name, s]) => {
  if (s.avg > 50) {
    findings.push({
      severity: 'critical',
      area: `BKT read: ${name}`,
      detail: `avg=${s.avg.toFixed(2)}ms p95=${s.p95.toFixed(2)}ms — מעל סף 50ms. ה-API נטען על-ידי דשבורד פר-קריאה.`,
    });
  } else if (s.avg > 20) {
    findings.push({
      severity: 'important',
      area: `BKT read: ${name}`,
      detail: `avg=${s.avg.toFixed(2)}ms — לא חוסם, אבל ב-rerender תכוף של דשבורד מתחיל לדגדג.`,
    });
  }
});

// ============================================================
// 4) Aggregation — מסך מורה (F.21A): 5 ילדות × 22 אותיות
// ============================================================
divider('4) Aggregation — מסך F.21A מציג 5 ילדות × 22 אותיות');

const aggStart = now();
const aggResults = {};
students.forEach(stuId => {
  const dist = BKT.getLetterMasteryDistribution(stuId);
  const weakest = BKT.getWeakestLetters(stuId, 5);
  const strand1 = BKT.checkStrandMastery(stuId, 1);
  const island3 = BKT.checkMastery(stuId, 3);
  aggResults[stuId] = { dist, weakest, strand1, island3 };
});
const aggMs = hrMs(now() - aggStart);
console.log(`     full aggregation (5 ילדות × 4 APIs): ${aggMs.toFixed(2)}ms`);

ok(`aggregation < 1000ms (got ${aggMs.toFixed(0)}ms)`, aggMs < 1000);
ok(`aggregation < 500ms (יעד פנים-מסך — ${aggMs.toFixed(0)}ms)`, aggMs < 500);

if (aggMs > 500) {
  findings.push({
    severity: aggMs > 1000 ? 'critical' : 'important',
    area: 'F.21A aggregation',
    detail: `5 ילדות × 4 APIs = ${aggMs.toFixed(0)}ms. כל קריאה עושה JSON.parse של state מלא — קל לקאש פר session.`,
  });
}

// ============================================================
// 5) State size — כמה ה-BKT state משקל אחרי 9000 events
// ============================================================
divider('5) state size (JSON.stringify) אחרי 9,000 events');

const islandSize = (localStorage._data[BKT.STORAGE_KEY] || '').length;
const strandSize = (localStorage._data[BKT.STORAGE_KEY_STRAND] || '').length;
const totalBkt = islandSize + strandSize;

console.log(`     avnei-bkt-v1        : ${(islandSize / 1024).toFixed(1)}KB`);
console.log(`     avnei-bkt-strand-v1 : ${(strandSize / 1024).toFixed(1)}KB`);
console.log(`     total BKT footprint : ${(totalBkt / 1024).toFixed(1)}KB`);

ok(`BKT state < 2MB (got ${(totalBkt / 1024).toFixed(0)}KB)`, totalBkt < 2 * 1024 * 1024);
ok(`BKT state < 500KB (יעד נוחות — ${(totalBkt / 1024).toFixed(0)}KB)`, totalBkt < 500 * 1024);

// ============================================================
// 6) Sanity — האם ה-BKT באמת התעדכן? (לא טעות שקטה)
// ============================================================
divider('6) Sanity checks — BKT באמת התעדכן');

const stu1 = students[0];
const stu1Dist = BKT.getLetterMasteryDistribution(stu1);
ok(`לילדה הראשונה (${stu1}) יש 22 אותיות פעילות`,
   stu1Dist.total === 22);
ok(`רוב האותיות תורגלו (untouched < 5)`,
   stu1Dist.untouched < 5,
   `untouched=${stu1Dist.untouched} (מתוך 22). אם גבוה — sampling לא מכסה את כל האותיות`);

const stu1State = BKT.getStrandState(stu1, 1);
ok(`לילדה הראשונה strand 1.attempts > 1000`,
   stu1State.attempts > 1000,
   `attempts=${stu1State.attempts}`);

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
console.log(`    ingest avg   : ${ingestStats.avg.toFixed(3)}ms`);
console.log(`    ingest p99   : ${ingestStats.p99.toFixed(3)}ms`);
console.log(`    checkMastery : ${sCheck.avg.toFixed(2)}ms avg`);
console.log(`    distribution : ${sDist.avg.toFixed(2)}ms avg`);
console.log(`    aggregation  : ${aggMs.toFixed(2)}ms (5 ילדות × 4 APIs)`);
console.log(`    BKT footprint: ${(totalBkt / 1024).toFixed(1)}KB`);

process.exit(failed > 0 ? 1 : 0);
