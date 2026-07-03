#!/usr/bin/env node
// ============================================================================
// test-mechanic-cv-summary.js — לוגיקת משחקון-סיכום חמישייה (3.7.2026)
//
// בודק את הלוגיקה הטהורה (בלי DOM):
//   - buildSummarySet: גוזר את כל תאי per_cv ל-5 האותיות; fallback /a/ לאות ריקה
//   - buildTrialSchedule: אורך נכון · interleaving (אין אות עוקבת זהה) ·
//     שקלול-לחלשים (חלש מופיע יותר) · ערבוב מצבים listen/read מאוזן
//   - evaluateSummary: sits=true רק כשכל צירופי הסט ב-mastery; weakCVs נכון
//
// הרצה: node scripts/test-mechanic-cv-summary.js
// ============================================================================

'use strict';
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ ' + msg); }
}

function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: k => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; },
  };
}

// seeded RNG דטרמיניסטי (mulberry32) לבדיקות schedule.
function seededRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fresh() {
  global.window = global.window || {};
  global.localStorage = makeLocalStorageMock();
  global.window.localStorage = global.localStorage;
  ['bkt', 'vowel-adapter'].forEach(function (m) {
    const p = path.resolve(__dirname, '..', 'js', 'shared', m + '.js');
    delete require.cache[p]; require(p);
  });
  const mp = path.resolve(__dirname, '..', 'js', 'templates', 'mechanic-cv-summary.js');
  delete require.cache[mp];
  const mech = require(mp);
  return { BKT: global.window.AvneiBKT, VA: global.window.AvneiVowelAdapter, L: mech._logic };
}

function cvEvt(sid, letter, group, correct) {
  return { student_id: sid, primary_island_id: 4, target_letter: letter,
           target_phoneme_group: group, is_correct: correct, response_time_ms: null };
}

console.log('\n=== משחקון-סיכום חמישייה · לוגיקה ===\n');

// ---- 1. buildSummarySet ----
let { BKT, L } = fresh();
// תרגול: ב_a, ב_i, מ_a  (3 תאים), האות ק ריקה, ת/ר ריקות
BKT.ingestEvent(cvEvt('kid', 'ב', 'a', true));
BKT.ingestEvent(cvEvt('kid', 'ב', 'i', true));
BKT.ingestEvent(cvEvt('kid', 'מ', 'a', true));
let set = L.buildSummarySet('kid', ['ת', 'מ', 'ר', 'ב', 'ק']);
const keys = set.map(s => s.key).sort();
ok(set.some(s => s.key === 'ב_a') && set.some(s => s.key === 'ב_i'), 'סט כולל את שני צירופי ב שתורגלו');
ok(set.some(s => s.key === 'מ_a'), 'סט כולל מ_a שתורגל');
ok(set.some(s => s.key === 'ק_a' && s.pKnown === null), 'אות ריקה (ק) → fallback /a/ עם pKnown=null');
ok(set.some(s => s.key === 'ת_a') && set.some(s => s.key === 'ר_a'), 'ת ו-ר ריקות → fallback /a/');
ok(set.length === 6, 'סט = 6 (ב×2 + מ + ק + ת + ר)');

// ---- 2. buildTrialSchedule — אורך + interleaving ----
({ BKT, L } = fresh());
['ת', 'מ', 'ר', 'ב', 'ק'].forEach(l => BKT.ingestEvent(cvEvt('kid', l, 'a', true)));
set = L.buildSummarySet('kid', ['ת', 'מ', 'ר', 'ב', 'ק']);
let sched = L.buildTrialSchedule(set, 10, seededRng(42));
ok(sched.length === 10, 'schedule באורך numTrials (10)');
let adjacentSame = 0;
for (let i = 1; i < sched.length; i++) if (sched[i].letter === sched[i - 1].letter) adjacentSame++;
ok(adjacentSame === 0, 'interleaving: אין אות עוקבת זהה (5 אותיות זמינות)');

// ---- 3. שקלול-לחלשים (3+ אותיות — כמו חמישייה אמיתית, ל-interleaving יש slack) ----
// הערה: עם 2 אותיות בלבד, interleaving כופה סירוגין ומבטל שקלול — מקרה מנוון
// שלא קורה בחמישייה (5 אותיות). כאן בודקים תרחיש ריאלי.
({ BKT, L } = fresh());
// מ_a, ר_a חזקים (שולטים) · ב_a חלש (טעויות רבות)
for (let i = 0; i < 8; i++) { BKT.ingestEvent(cvEvt('kid', 'מ', 'a', true)); BKT.ingestEvent(cvEvt('kid', 'ר', 'a', true)); }
for (let i = 0; i < 5; i++) BKT.ingestEvent(cvEvt('kid', 'ב', 'a', false));
set = L.buildSummarySet('kid', ['מ', 'ר', 'ב']);
const strong = set.find(s => s.key === 'מ_a');
const weak = set.find(s => s.key === 'ב_a');
ok(strong.mastered === true, 'מ_a מסומן mastered');
ok(weak.mastered === false && weak.pKnown < 0.70, 'ב_a חלש (לא-נשלט, pKnown נמוך)');
// צבירה על כמה seeds להסרת רעש-דגימה (התוחלת מעדיפה חלש; מדגם בודד רועש).
let weakCount = 0, strongCount = 0;
[7, 13, 29, 101, 257].forEach(function (seed) {
  const s = L.buildTrialSchedule(set, 60, seededRng(seed));
  weakCount += s.filter(t => t.key === 'ב_a').length;
  strongCount += s.filter(t => t.key === 'מ_a').length;
});
ok(weakCount > strongCount, `צירוף חלש מקבל יותר סבבים (חלש=${weakCount} · חזק-בודד=${strongCount}, מצטבר 5 seeds)`);

// ---- 4. ערבוב מצבים listen/read ----
({ BKT, L } = fresh());
['ת', 'מ', 'ר', 'ב', 'ק'].forEach(l => BKT.ingestEvent(cvEvt('kid', l, 'a', true)));
set = L.buildSummarySet('kid', ['ת', 'מ', 'ר', 'ב', 'ק']);
sched = L.buildTrialSchedule(set, 10, seededRng(3));
const listens = sched.filter(t => t.mode === 'listen').length;
const reads = sched.filter(t => t.mode === 'read').length;
ok(listens > 0 && reads > 0, `שני המצבים מופיעים (listen=${listens} · read=${reads})`);
ok(Math.abs(listens - reads) <= 1, 'ערבוב מאוזן (הפרש ≤ 1)');
ok(sched.every(t => t.mode === 'listen' || t.mode === 'read'), 'לכל סבב יש mode תקין');

// ---- 5. evaluateSummary — sits criterion ----
({ BKT, L } = fresh());
// שני צירופים; רק אחד מגיע ל-mastery
for (let i = 0; i < 8; i++) BKT.ingestEvent(cvEvt('kid', 'מ', 'a', true));   // מ_a → שולט
for (let i = 0; i < 2; i++) BKT.ingestEvent(cvEvt('kid', 'ב', 'a', false));  // ב_a → חלש
let ev = L.evaluateSummary('kid', ['מ', 'ב']);
ok(ev.sits === false, 'החמישייה לא יושבת כשצירוף אחד חלש');
ok(ev.masteredCount === 1 && ev.total === 2, 'ספירה: 1/2 נשלטו');
ok(ev.weakCVs.length === 1 && ev.weakCVs[0].key === 'ב_a', 'weakCVs מזהה את ב_a');
ok(ev.weakCVs[0].displayHe === 'ב + פתח-קמץ', 'displayHe עברי לצירוף החלש');

// כולם נשלטים → sits
({ BKT, L } = fresh());
for (let i = 0; i < 8; i++) { BKT.ingestEvent(cvEvt('kid', 'מ', 'a', true)); BKT.ingestEvent(cvEvt('kid', 'ב', 'a', true)); }
ev = L.evaluateSummary('kid', ['מ', 'ב']);
ok(ev.sits === true, 'החמישייה יושבת כשכל הצירופים נשלטו');

console.log('\n==================================================');
console.log(`סיכום: ${passed} עברו · ${failed} נכשלו`);
process.exit(failed === 0 ? 0 : 1);
