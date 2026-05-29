#!/usr/bin/env node
// ============================================================================
// test-weakness-targeting.js — C.12B Smoke tests
// ============================================================================
//
// בדיקות עבור Weakness Targeting Engine שמוסיף C.12B מעל C.12:
//   חלק A — AvneiBKT.getWeakLetters (ב-bkt.js)
//   חלק B — AvneiPackBridge.selectItemsForStudent (Weakness Targeting layer)
//   חלק C — Constants חשופים + backward-compat
//
// usage:
//   node avnei-yesod/underwater-app/scripts/test-weakness-targeting.js
// ============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

// ----------------------------------------------------------------------------
// Mock environment (localStorage + window)
// ----------------------------------------------------------------------------

const _localStore = {};
global.localStorage = {
  getItem: (k) => _localStore[k] || null,
  setItem: (k, v) => { _localStore[k] = String(v); },
  removeItem: (k) => { delete _localStore[k]; },
  clear: () => { for (const k of Object.keys(_localStore)) delete _localStore[k]; }
};
global.window = global;

// ----------------------------------------------------------------------------
// Test runner
// ----------------------------------------------------------------------------

let total = 0;
let passed = 0;
const failures = [];

function assert(label, cond, detail) {
  total++;
  if (cond) {
    passed++;
    console.log('  ✅ ' + label);
  } else {
    failures.push(label + (detail ? ' — ' + detail : ''));
    console.log('  ❌ ' + label + (detail ? ' — ' + detail : ''));
  }
}

function section(name) {
  console.log('\n📦 ' + name);
}

// ============================================================================
// טעינת bkt.js לקבל את AvneiBKT האמיתי (Part A)
// ============================================================================

const bktCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'shared', 'bkt.js'), 'utf-8');
eval(bktCode);
const RealBKT = global.window.AvneiBKT;

// helper — בונה state ידני לתלמידה ל-strand 1 per_letter, לשימוש ב-Part A
function setupStudentLetters(studentId, perLetterData) {
  // perLetterData: { 'א': {pKnown, attempts, correct?, wrong?, masteryAchievedAt?}, ... }
  const ALL = RealBKT.ALL_HEBREW_LETTERS_22;
  const params = RealBKT.DEFAULT_PARAMS;
  const per_letter = {};
  ALL.forEach(l => {
    const provided = perLetterData[l];
    if (provided) {
      per_letter[l] = {
        pKnown: provided.pKnown,
        attempts: provided.attempts || 0,
        correct: provided.correct || 0,
        wrong: provided.wrong || 0,
        responseTimesMs: [],
        masteryAchievedAt: provided.masteryAchievedAt || null
      };
    } else {
      per_letter[l] = {
        pKnown: params.pL0,
        attempts: 0,
        correct: 0,
        wrong: 0,
        responseTimesMs: [],
        masteryAchievedAt: null
      };
    }
  });

  const strandStore = {};
  strandStore[studentId] = {
    1: {
      pKnown: 0.5,
      attempts: 0,
      correct: 0,
      wrong: 0,
      responseTimesMs: [],
      sessionsAtMastery: 0,
      lastSessionId: null,
      masteryAchievedAt: null,
      per_island_attempts: {},
      per_letter: per_letter
    }
  };
  localStorage.setItem(RealBKT.STORAGE_KEY_STRAND, JSON.stringify(strandStore));
}

// ============================================================================
// PART A — AvneiBKT.getWeakLetters
// ============================================================================

section('PART A · BLOCK 1 — getWeakLetters: API surface');

assert('getWeakLetters קיים כפונקציה ב-AvneiBKT', typeof RealBKT.getWeakLetters === 'function');

section('PART A · BLOCK 2 — getWeakLetters על תלמידה ללא דאטה');

localStorage.clear();
const noData = RealBKT.getWeakLetters('student-no-data');
assert('ללא דאטה → [] (לא null)', Array.isArray(noData) && noData.length === 0);

section('PART A · BLOCK 3 — getWeakLetters · threshold ברירת מחדל (0.40)');

localStorage.clear();
setupStudentLetters('student-1', {
  'מ': { pKnown: 0.30, attempts: 10 },   // weak (0.30 < 0.40, 10 >= 5)
  'ל': { pKnown: 0.50, attempts: 10 },   // לא weak (0.50 >= 0.40)
  'ר': { pKnown: 0.20, attempts: 10 }    // weak (0.20 < 0.40)
});

const wl1 = RealBKT.getWeakLetters('student-1');
assert('weak letters: 2 בלבד', wl1.length === 2, 'got ' + wl1.length + ' (' + wl1.join(',') + ')');
assert('כולל מ', wl1.includes('מ'));
assert('כולל ר', wl1.includes('ר'));
assert('לא כולל ל (p=0.50)', !wl1.includes('ל'));
assert('סדר: ר (0.20) לפני מ (0.30)', wl1[0] === 'ר', 'got order ' + wl1.join('→'));

section('PART A · BLOCK 4 — getWeakLetters · threshold גבול-בדיוק (0.39 vs 0.41)');

localStorage.clear();
setupStudentLetters('student-2', {
  'א': { pKnown: 0.39, attempts: 10 },   // weak (0.39 < 0.40)
  'ב': { pKnown: 0.40, attempts: 10 },   // לא weak (0.40 NOT < 0.40)
  'ג': { pKnown: 0.41, attempts: 10 }    // לא weak
});

const wl2 = RealBKT.getWeakLetters('student-2');
assert('p=0.39 → weak', wl2.includes('א'));
assert('p=0.40 → לא weak (גבול קשיח)', !wl2.includes('ב'));
assert('p=0.41 → לא weak', !wl2.includes('ג'));

section('PART A · BLOCK 5 — getWeakLetters · minAttempts ברירת מחדל (5)');

localStorage.clear();
setupStudentLetters('student-3', {
  'מ': { pKnown: 0.10, attempts: 4 },    // לא נסיונות מספיק (4 < 5)
  'ל': { pKnown: 0.10, attempts: 5 },    // ✓ (5 >= 5)
  'ר': { pKnown: 0.10, attempts: 10 }    // ✓
});

const wl3 = RealBKT.getWeakLetters('student-3');
assert('attempts=4 → לא weak', !wl3.includes('מ'));
assert('attempts=5 → weak', wl3.includes('ל'));
assert('attempts=10 → weak', wl3.includes('ר'));

section('PART A · BLOCK 6 — getWeakLetters · max=3 (Top-3 בלבד)');

localStorage.clear();
setupStudentLetters('student-many-weak', {
  'מ': { pKnown: 0.10, attempts: 10 },
  'ל': { pKnown: 0.15, attempts: 10 },
  'ר': { pKnown: 0.20, attempts: 10 },
  'ת': { pKnown: 0.25, attempts: 10 },
  'נ': { pKnown: 0.35, attempts: 10 }
});

const wl4 = RealBKT.getWeakLetters('student-many-weak');
assert('5 candidates → רק 3 (Top)', wl4.length === 3, 'got ' + wl4.length);
assert('Top-1: מ (0.10)', wl4[0] === 'מ');
assert('Top-2: ל (0.15)', wl4[1] === 'ל');
assert('Top-3: ר (0.20)', wl4[2] === 'ר');

section('PART A · BLOCK 7 — getWeakLetters · options מותאמים');

localStorage.clear();
setupStudentLetters('student-custom', {
  'מ': { pKnown: 0.10, attempts: 3 },
  'ל': { pKnown: 0.20, attempts: 3 },
  'ר': { pKnown: 0.50, attempts: 3 }
});

const wlCustom = RealBKT.getWeakLetters('student-custom', {
  threshold: 0.60, minAttempts: 2, max: 5
});
assert('custom: threshold=0.60+minAttempts=2 → 3 weak', wlCustom.length === 3, 'got ' + wlCustom.length);

// ============================================================================
// PART B — Bridge selectItemsForStudent
// ============================================================================

// טעינת ה-bridge מחדש עם mock AvneiBKT (כמו test-pack-bridge.js)
function clearBridge() {
  const bridgePath = path.resolve(__dirname, '..', 'js', 'shared', 'pack-bkt-bridge.js');
  delete require.cache[bridgePath];
  return require(bridgePath);
}

function setupBktMock(perLetterStates, strands, weakLettersReturn) {
  global.AvneiBKT = {
    getLetterState: function (studentId, letter) {
      const s = perLetterStates[studentId];
      return (s && s[letter]) ? s[letter] : null;
    },
    getStudentStrands: function (studentId) {
      return strands[studentId] || {};
    },
    getWeakLetters: function (studentId /*, options */) {
      // מחזיר את הרשימה שהוקנפגה לתלמידה הספציפית (לטסטים)
      if (Array.isArray(weakLettersReturn)) return weakLettersReturn;
      if (weakLettersReturn && weakLettersReturn[studentId]) return weakLettersReturn[studentId];
      return [];
    }
  };
}

const Bridge = clearBridge();

section('PART B · BLOCK 8 — allows_weakness_targeting=false → החזרה רגילה');

localStorage.clear();
// september-2026.json יש בו allows_weakness_targeting=false
setupBktMock({
  'student-no-target': {
    'ש': { pKnown: 0.70, attempts: 10 },
    'ל': { pKnown: 0.72, attempts: 10 },
    'נ': { pKnown: 0.70, attempts: 10 },
    'א': { pKnown: 0.70, attempts: 10 }
  }
}, {}, ['ב', 'ר']);  // mock: יש weak letters, אבל הפאק לא מתיר

const itemsNoTarget = Bridge.selectItemsForStudent('student-no-target', 'september-2026');
assert('פאק עם allows_weakness_targeting=false → מחזיר את כל ה-tier items', itemsNoTarget.length === 10,
       'got ' + itemsNoTarget.length + ' items (expected 10 ב-Tier 3 אחרי השלמת סוכן 19 ל-40 items)');

section('PART B · BLOCK 9 — אין weak letters → החזרה רגילה (גם אם הפאק מתיר)');

// נבנה pack מדומה עם allows_weakness_targeting=true
const fakePackTrue = {
  pack_id: 'fake-targeting-true',
  month: 'fake', month_index: 11, year: 2026,
  focus_mode: 'letters', primary_strand: 1,
  letters_in_focus: ['מ', 'ל', 'ר'],
  allows_weakness_targeting: true,
  tiers: {
    '1': { name: 't1', items: [
      { item_id: 'f-t1-1', tier: 1, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t1-2', tier: 1, type: 'new', letter: 'ל', letters_involved: ['ל'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t1-3', tier: 1, type: 'new', letter: 'ר', letters_involved: ['ר'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 }
    ]},
    '2': { name: 't2', items: [
      { item_id: 'f-t2-1', tier: 2, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-2', tier: 2, type: 'new', letter: 'ל', letters_involved: ['ל'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-3', tier: 2, type: 'new', letter: 'ר', letters_involved: ['ר'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-4', tier: 2, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'pick', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-5', tier: 2, type: 'new', letter: 'ל', letters_involved: ['ל'], mechanic: 'pick', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-6', tier: 2, type: 'new', letter: 'ר', letters_involved: ['ר'], mechanic: 'pick', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-7', tier: 2, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'memory-pair', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-8', tier: 2, type: 'new', letter: 'ל', letters_involved: ['ל'], mechanic: 'memory-pair', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-9', tier: 2, type: 'new', letter: 'ר', letters_involved: ['ר'], mechanic: 'memory-pair', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t2-10', tier: 2, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'sort-by-letter', rama_task_alignment: 1, peima_target: 1 }
    ]},
    '3': { name: 't3', items: [
      { item_id: 'f-t3-1', tier: 3, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t3-2', tier: 3, type: 'new', letter: 'ל', letters_involved: ['ל'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 }
    ]},
    '4': { name: 't4', items: [
      { item_id: 'f-t4-1', tier: 4, type: 'new', letter: 'מ', letters_involved: ['מ'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 },
      { item_id: 'f-t4-2', tier: 4, type: 'new', letter: 'ל', letters_involved: ['ל'], mechanic: 'tap-all', rama_task_alignment: 1, peima_target: 1 }
    ]}
  }
};
Bridge._setPackCache('fake-targeting-true', fakePackTrue);

setupBktMock({
  'student-no-weak': {
    'מ': { pKnown: 0.80, attempts: 10 },
    'ל': { pKnown: 0.80, attempts: 10 },
    'ר': { pKnown: 0.80, attempts: 10 }
  }
}, {
  'student-no-weak': { 1: { pKnown: 0.80, attempts: 30 } }
}, []);  // mock weakLetters → []

const itemsNoWeak = Bridge.selectItemsForStudent('student-no-weak', 'fake-targeting-true');
assert('weak letters=[] על pack שמתיר → מחזיר את כל ה-tier items', itemsNoWeak.length > 0,
       'expected non-empty, got ' + itemsNoWeak.length);

section('PART B · BLOCK 10 — Weakness Targeting פעיל · Tier 2 ratio=0.70');

// 10 items ב-Tier 2 · weak=מ (4 פריטים), general=6 → ratio=0.70 → 7 targeted, 3 general
// אבל יש רק 4 targeted (מ) → 4 targeted + 6 general = 10 total
setupBktMock({
  'student-weak-mem': {
    1: { pKnown: 0.45, attempts: 15 }
  }
}, {
  'student-weak-mem': { 1: { pKnown: 0.45, attempts: 15 } }
}, ['מ']);

// כדי לקבל Tier 2, נצטרך לכוון p ל-0.3-0.6. עם strand mode → p=0.45 → Tier 2. ✓
// אבל ה-bridge עכשיו על pack של letters, אז ננסה אחרת — נגדיר override ל-Tier 2
Bridge.overrideTier('student-weak-mem', 'fake-targeting-true', 2);

const itemsWeakMem = Bridge.selectItemsForStudent('student-weak-mem', 'fake-targeting-true');
assert('Tier 2 · 10 items בסה"כ', itemsWeakMem.length === 10, 'got ' + itemsWeakMem.length);

const targetedInResult = itemsWeakMem.filter(i => i.letters_involved.includes('מ'));
const generalInResult  = itemsWeakMem.filter(i => !i.letters_involved.includes('מ'));
// יש 4 items של מ ב-Tier 2 (f-t2-1, f-t2-4, f-t2-7, f-t2-10). ratio=0.70 ביקש 7, אז 4 יילקחו (כל המטורגטים)
assert('כל 4 הפריטים של מ נכללו', targetedInResult.length === 4, 'got ' + targetedInResult.length);
assert('6 פריטים general (ל/ר)', generalInResult.length === 6, 'got ' + generalInResult.length);

Bridge.clearOverride('student-weak-mem', 'fake-targeting-true');

section('PART B · BLOCK 11 — Multiple weak letters · Top-3 cap נשמר בקליינט (mock)');

// המוק מחזיר רשימה ישירות — אין צורך לבדוק את ה-cap (זה בודק AvneiBKT, לא ה-bridge).
// כאן רק נוודא ש-bridge מצרף את כל ה-weak letters שהוא קיבל.
setupBktMock({}, {}, ['מ', 'ל']);
Bridge.overrideTier('student-multi-weak', 'fake-targeting-true', 2);

const itemsMulti = Bridge.selectItemsForStudent('student-multi-weak', 'fake-targeting-true');
assert('Multi-weak: 10 items', itemsMulti.length === 10);
const matchMulti = itemsMulti.filter(i => i.letters_involved.includes('מ') || i.letters_involved.includes('ל'));
// targeted pool = 4 מ + 3 ל = 7. ratio=0.70 → 7 targeted, 3 general (ר).
assert('7 פריטים מטורגטים (מ ∪ ל)', matchMulti.length === 7, 'got ' + matchMulti.length);

Bridge.clearOverride('student-multi-weak', 'fake-targeting-true');

section('PART B · BLOCK 12 — interleaving: targeted ו-general לא מצומדים בקצוות');

// בודק שה-_interleaveDrill מבצע שזירה — לא 7 targeted קודם ואז 3 general
setupBktMock({}, {}, ['מ']);
Bridge.overrideTier('student-interleave', 'fake-targeting-true', 2);

const itemsInter = Bridge.selectItemsForStudent('student-interleave', 'fake-targeting-true');
// בודק שלפחות אחד מ-3 הראשונים הוא general (לא הכל targeted)
const first3 = itemsInter.slice(0, 3);
const hasGeneralInFirst3 = first3.some(i => !i.letters_involved.includes('מ'));
assert('שזירה: ב-3 הראשונים יש לפחות פריט אחד general (לא רק targeted)',
       hasGeneralInFirst3 || itemsInter.filter(i => !i.letters_involved.includes('מ')).length === 0,
       'first3=' + first3.map(i => i.item_id).join(','));

Bridge.clearOverride('student-interleave', 'fake-targeting-true');

section('PART B · BLOCK 13 — backward-compat: getItemsForStudent === selectItemsForStudent');

assert('getItemsForStudent קיים', typeof Bridge.getItemsForStudent === 'function');
assert('selectItemsForStudent קיים', typeof Bridge.selectItemsForStudent === 'function');

// קריאות לשניהם על אותו pack/student → אותו אורך מערך
setupBktMock({
  'student-compat': {
    'ש': { pKnown: 0.70, attempts: 10 },
    'ל': { pKnown: 0.72, attempts: 10 },
    'נ': { pKnown: 0.70, attempts: 10 },
    'א': { pKnown: 0.70, attempts: 10 }
  }
}, {}, []);
const aliasA = Bridge.getItemsForStudent('student-compat', 'september-2026');
const aliasB = Bridge.selectItemsForStudent('student-compat', 'september-2026');
assert('getItemsForStudent === selectItemsForStudent (אותו אורך)',
       aliasA.length === aliasB.length, 'got ' + aliasA.length + ' vs ' + aliasB.length);

// ============================================================================
// PART C — Constants
// ============================================================================

section('PART C · BLOCK 14 — Constants חשופים ב-Bridge');

assert('WEAKNESS_THRESHOLD === 0.40', Bridge.WEAKNESS_THRESHOLD === 0.40,
       'got ' + Bridge.WEAKNESS_THRESHOLD);
assert('MIN_ATTEMPTS_FOR_WEAK === 5', Bridge.MIN_ATTEMPTS_FOR_WEAK === 5);
assert('MAX_WEAK_LETTERS_TARGETED === 3', Bridge.MAX_WEAK_LETTERS_TARGETED === 3);
assert('TARGETED_RATIO object', typeof Bridge.TARGETED_RATIO === 'object');
assert('TARGETED_RATIO[1] === 0.30', Bridge.TARGETED_RATIO[1] === 0.30);
assert('TARGETED_RATIO[2] === 0.70', Bridge.TARGETED_RATIO[2] === 0.70);
assert('TARGETED_RATIO[3] === 0.75', Bridge.TARGETED_RATIO[3] === 0.75);
assert('TARGETED_RATIO[4] === 0.70', Bridge.TARGETED_RATIO[4] === 0.70);
assert('TARGETED_RATIO frozen', Object.isFrozen(Bridge.TARGETED_RATIO));

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('סה"כ ' + passed + '/' + total + ' assertions עברו');
if (failures.length > 0) {
  console.log('\n❌ נכשלו:');
  for (const f of failures) console.log('  · ' + f);
  process.exit(1);
} else {
  console.log('✅ כל הבדיקות עברו!');
  process.exit(0);
}
