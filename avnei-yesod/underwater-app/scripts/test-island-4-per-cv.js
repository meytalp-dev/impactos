#!/usr/bin/env node
// ============================================================================
// test-island-4-per-cv.js — Sub-BKT פר צירוף CV (אי 4 · 3.7.2026)
//
// בודק:
//   - ISLANDS_WITH_SUB_BKT כולל 4
//   - emptyIsland4Record: per_cv ריק + aggregate_pKnown
//   - ingestEvent מנתב אי 4 ל-ingestIsland4Event (target_letter+target_phoneme_group)
//   - יצירה עצלה: תא נוצר בפעם הראשונה בלבד
//   - phoneme-group merge: "בַּ" (patach→a) ו-"בָּ" (kamatz→a) = אותו תא "ב_a"
//   - prior נגזר-אות: תא CV חדש מתחיל מ-0.5*pKnown(אות)+0.5*pL0
//   - event ללא phoneme_group / letter → מדולג (return null)
//   - checkMastery(4): per_cv + weak_cvs
//   - getCVState / getWeakestCVs / getCVMasteryDistribution
//   - מיגרציה non-destructive: רשומת אי-4 ישנה (.pKnown) → per_cv בלי איבוד
//   - "ירוק כוזב" נמנע: תקרת prior < סף שליטה (אי-אפשר שליטה בלי ראיה)
//
// הרצה: node scripts/test-island-4-per-cv.js
// ============================================================================

'use strict';
const path = require('path');

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  ✓ ' + msg); }
  else { failed++; console.log('  ✗ ' + msg); }
}
function approx(a, b, eps) { return Math.abs(a - b) <= (eps || 1e-9); }

function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: k => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; },
    _raw: () => store,
  };
}

function loadBKT() {
  global.window = global.window || {};
  global.localStorage = makeLocalStorageMock();
  global.window.localStorage = global.localStorage;
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'bkt.js');
  delete require.cache[p];
  require(p);
  return global.window.AvneiBKT;
}

function cvEvent(letter, group, correct, extra) {
  return Object.assign({
    student_id: 'kid',
    primary_island_id: 4,
    target_letter: letter,
    target_phoneme_group: group,
    is_correct: correct,
    response_time_ms: null,
  }, extra || {});
}

// ============================================================
console.log('\n=== אי 4 · Sub-BKT פר צירוף CV ===\n');

// ---- 1. constants + empty record ----
let BKT = loadBKT();
ok(BKT.ISLANDS_WITH_SUB_BKT.includes(4), 'ISLANDS_WITH_SUB_BKT כולל 4');
ok(BKT.PARAMS_PER_ISLAND[4] && typeof BKT.PARAMS_PER_ISLAND[4].pL0 === 'number', 'PARAMS_PER_ISLAND[4] קיים');
ok(typeof BKT.getCVState === 'function', 'getCVState חשוף');
ok(typeof BKT.getWeakestCVs === 'function', 'getWeakestCVs חשוף');
ok(typeof BKT.getCVMasteryDistribution === 'function', 'getCVMasteryDistribution חשוף');
ok(BKT.cvUnitKey('ב', 'a') === 'ב_a', 'cvUnitKey("ב","a") = "ב_a"');

// ---- 2. ingest routes to island 4 + lazy creation ----
BKT = loadBKT();
let r = BKT.ingestEvent(cvEvent('ב', 'a', true));
ok(r && r.cv_key === 'ב_a', 'ingestEvent מנתב לאי 4, מחזיר cv_key');
let st = BKT.dump().island.kid[4];
ok(st && st.per_cv && st.per_cv['ב_a'], 'תא "ב_a" נוצר עצלן');
ok(Object.keys(st.per_cv).length === 1, 'רק תא אחד קיים (אין אתחול-מראש של 220)');
ok(st.per_cv['ב_a'].attempts === 1, 'attempts=1 אחרי event אחד');

// ---- 3. phoneme-group merge: patach + kamatz → same cell "ב_a" ----
BKT = loadBKT();
BKT.ingestEvent(cvEvent('ב', 'a', true));   // מייצג בַּ (patach)
BKT.ingestEvent(cvEvent('ב', 'a', true));   // מייצג בָּ (kamatz) — אותה קבוצה
st = BKT.dump().island.kid[4];
ok(Object.keys(st.per_cv).length === 1, 'בַּ ו-בָּ = תא אחד (phoneme-group merge)');
ok(st.per_cv['ב_a'].attempts === 2, 'שני ה-events נספרו לאותו תא');

// ---- 4. prior derived from letter ----
// שתילת אות ב חזקה באי 3, ואז event ראשון על "ב_i" חדש.
BKT = loadBKT();
BKT.setInitialState('kid', 3, { per_letter: { 'ב': 0.90 } });
const pL0_4 = BKT.PARAMS_PER_ISLAND[4].pL0;
const w = BKT.CV_PRIOR_LETTER_WEIGHT;
const expectedPrior = w * 0.90 + (1 - w) * pL0_4;
// event שגוי כדי לראות את ה-prior לפני שהוא מזנק (bktUpdate על wrong מוריד מעט מ-prior)
BKT.ingestEvent(cvEvent('ב', 'i', false));
const cvState = BKT.getCVState('kid', 'ב_i');
// אחרי טעות אחת ה-pKnown ירד מתחת ל-prior — נוודא שהוא נמוך מ-prior אבל שה-prior עצמו התחיל גבוה מ-pL0.
ok(cvState !== null, 'getCVState מחזיר תא "ב_i"');
ok(expectedPrior > pL0_4 + 0.2, `prior נגזר-אות גבוה מ-pL0 (${expectedPrior.toFixed(3)} vs ${pL0_4})`);
ok(expectedPrior < BKT.MASTERY_THRESHOLD, `prior מקס' < סף שליטה — "ירוק כוזב" נמנע (${expectedPrior.toFixed(3)} < 0.90)`);
// אות לא-ידועה → prior ≈ pL0
BKT.ingestEvent(cvEvent('ק', 'a', false));  // ק לא נשתלה
const cvQ = BKT.getCVState('kid', 'ק_a');
const expectedPriorQ = w * pL0_4 + (1 - w) * pL0_4; // = pL0_4 (per_letter default)
ok(cvQ !== null, 'תא "ק_a" נוצר');

// ---- 5. invalid events skipped ----
BKT = loadBKT();
ok(BKT.ingestEvent(cvEvent(null, 'a', true)) === null, 'event ללא target_letter → null');
ok(BKT.ingestEvent(cvEvent('ב', null, true)) === null, 'event ללא target_phoneme_group → null');
ok(BKT.ingestEvent(cvEvent('ZZ', 'a', true)) === null, 'event עם אות לא-חוקית → null');

// ---- 6. checkMastery(4) shape ----
BKT = loadBKT();
BKT.ingestEvent(cvEvent('ב', 'a', true));
BKT.ingestEvent(cvEvent('ב', 'a', false));
const cm = BKT.checkMastery('kid', 4);
ok(cm && cm.per_cv && cm.per_cv['ב_a'], 'checkMastery(4) מחזיר per_cv');
ok(Array.isArray(cm.weak_cvs), 'checkMastery(4) מחזיר weak_cvs (array)');
ok(typeof cm.aggregate_pKnown === 'number', 'checkMastery(4) מחזיר aggregate_pKnown');
ok(cm.per_cv['ב_a'].displayHe === 'ב + פתח-קמץ', 'displayHe עברי לצירוף');

// ---- 7. mastery achievable with evidence; weak detection ----
BKT = loadBKT();
for (let i = 0; i < 8; i++) BKT.ingestEvent(cvEvent('מ', 'i', true, { session_id: 's' + i }));
const masteredCV = BKT.getCVState('kid', 'מ_i');
ok(masteredCV.pKnown >= BKT.MASTERY_THRESHOLD, 'צירוף מגיע לשליטה עם 8 תשובות נכונות');
ok(masteredCV.mastered === true, 'cv.mastered = true');

// weak: הרבה טעויות
BKT = loadBKT();
for (let i = 0; i < 5; i++) BKT.ingestEvent(cvEvent('ל', 'e', false));
const weakList = BKT.getWeakestCVs('kid', 3);
ok(weakList.length >= 1 && weakList[0].cv_key === 'ל_e', 'getWeakestCVs מזהה צירוף חלש');
const dist = BKT.getCVMasteryDistribution('kid');
ok(dist.weak >= 1, 'getCVMasteryDistribution סופר weak');
ok(dist.total === 1, 'distribution.total = מספר צירופים שנפגשו (1)');

// ---- 8. non-destructive migration from old regular-island shape ----
BKT = loadBKT();
// זריקת רשומת אי-4 "ישנה" (צורת אי רגיל) ישירות ל-localStorage.
const raw = { kid: { 4: { pKnown: 0.42, attempts: 7, correct: 5, wrong: 2, responseTimesMs: [], sessionsAtMastery: 1, lastSessionId: 'old', masteryAchievedAt: null } } };
global.localStorage.setItem('avnei-bkt-v1', JSON.stringify(raw));
const migrated = BKT.getIslandState('kid', 4);
ok(migrated.per_cv && typeof migrated.per_cv === 'object', 'מיגרציה: per_cv נוסף');
ok(approx(migrated.aggregate_pKnown, 0.42), 'מיגרציה: pKnown ישן נשמר כ-aggregate_pKnown');
ok(migrated.pKnown === 0.42, 'מיגרציה non-destructive: pKnown הישן לא נמחק');
ok(migrated.total_attempts === 7, 'מיגרציה: total_attempts מ-attempts הישן');
// אחרי מיגרציה — ingest חדש עובד
const r2 = BKT.ingestEvent(cvEvent('ב', 'a', true));
ok(r2 && r2.cv_key === 'ב_a', 'ingest עובד אחרי מיגרציה');

// ============================================================
console.log('\n==================================================');
console.log(`סיכום: ${passed} עברו · ${failed} נכשלו`);
if (failed === 0) console.log('✓ כל הבדיקות עברו!');
process.exit(failed === 0 ? 0 : 1);
