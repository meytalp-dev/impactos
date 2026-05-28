#!/usr/bin/env node
// test-pack-bridge.js — C.12 smoke tests
//
// בדיקות אוטומטיות ל-pack-bkt-bridge.js: 4 thresholds, 2 focus_modes,
// override flow, cold-start, fallbacks, API surface. סה"כ 20+ assertions.
//
// usage:
//   node avnei-yesod/underwater-app/scripts/test-pack-bridge.js

'use strict';

// ============================================================================
// Mock environment (localStorage + AvneiBKT)
// ============================================================================

const _localStore = {};
global.localStorage = {
  getItem: (k) => _localStore[k] || null,
  setItem: (k, v) => { _localStore[k] = String(v); },
  removeItem: (k) => { delete _localStore[k]; },
  clear: () => { for (const k of Object.keys(_localStore)) delete _localStore[k]; }
};

// Mock AvneiBKT — נשתל לפי הצורך פר טסט
function setupBktMock(perLetter, strands) {
  global.AvneiBKT = {
    getLetterState: function (studentId, letter) {
      const s = perLetter[studentId];
      return (s && s[letter]) ? s[letter] : null;
    },
    getStudentStrands: function (studentId) {
      return strands[studentId] || {};
    }
  };
}

function clearBktMock() {
  global.AvneiBKT = null;
}

// ============================================================================
// טעינת ה-bridge
// ============================================================================

// `window` mock — ה-bridge תומך גם ב-Node (module.exports), אבל נצמיד גם window
global.window = global;

const path = require('path');
const bridgePath = path.resolve(__dirname, '..', 'js', 'shared', 'pack-bkt-bridge.js');
delete require.cache[bridgePath];
const Bridge = require(bridgePath);

// ============================================================================
// Test runner
// ============================================================================

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
// BLOCK 1 — API surface
// ============================================================================

section('BLOCK 1 — API surface (8 פונקציות + 2 constants)');

assert('loadPack פונקציה', typeof Bridge.loadPack === 'function');
assert('preloadPack פונקציה', typeof Bridge.preloadPack === 'function');
assert('loadCurrentPack פונקציה', typeof Bridge.loadCurrentPack === 'function');
assert('selectTierForStudent פונקציה', typeof Bridge.selectTierForStudent === 'function');
assert('getItemsForStudent פונקציה', typeof Bridge.getItemsForStudent === 'function');
assert('overrideTier פונקציה', typeof Bridge.overrideTier === 'function');
assert('clearOverride פונקציה', typeof Bridge.clearOverride === 'function');
assert('TIER_THRESHOLDS object', typeof Bridge.TIER_THRESHOLDS === 'object');
assert('STRAND_NAMES object', typeof Bridge.STRAND_NAMES === 'object');

// ============================================================================
// BLOCK 2 — Constants
// ============================================================================

section('BLOCK 2 — TIER_THRESHOLDS + STRAND_NAMES values');

assert('T1_MAX === 0.30', Bridge.TIER_THRESHOLDS.T1_MAX === 0.30,
       'got ' + Bridge.TIER_THRESHOLDS.T1_MAX);
assert('T2_MAX === 0.60', Bridge.TIER_THRESHOLDS.T2_MAX === 0.60);
assert('T3_MAX === 0.85', Bridge.TIER_THRESHOLDS.T3_MAX === 0.85);
assert('STRAND_NAMES[1] === פונולוגיה', Bridge.STRAND_NAMES[1] === 'פונולוגיה',
       'got ' + Bridge.STRAND_NAMES[1]);
assert('STRAND_NAMES 5 keys', Object.keys(Bridge.STRAND_NAMES).length === 5);
assert('TIER_THRESHOLDS frozen', Object.isFrozen(Bridge.TIER_THRESHOLDS));

// ============================================================================
// BLOCK 3 — pickTier boundaries
// ============================================================================

section('BLOCK 3 — _pickTier על 4 גבולות');

assert('p=0.10 → Tier 1', Bridge._pickTier(0.10) === 1);
assert('p=0.29 → Tier 1', Bridge._pickTier(0.29) === 1);
assert('p=0.30 → Tier 2', Bridge._pickTier(0.30) === 2);
assert('p=0.45 → Tier 2', Bridge._pickTier(0.45) === 2);
assert('p=0.60 → Tier 3', Bridge._pickTier(0.60) === 3);
assert('p=0.74 → Tier 3', Bridge._pickTier(0.74) === 3);
assert('p=0.85 → Tier 4', Bridge._pickTier(0.85) === 4);
assert('p=0.99 → Tier 4', Bridge._pickTier(0.99) === 4);

// ============================================================================
// BLOCK 4 — loadPack (fs fallback)
// ============================================================================

section('BLOCK 4 — loadPack מקבצים אמיתיים');

Bridge._clearCache();
const sept = Bridge.loadPack('september-2026');
assert('september-2026 נטען', !!sept, 'pack=' + sept);
assert('september-2026 focus_mode=letters', sept && sept.focus_mode === 'letters');
assert('september-2026 4 letters', sept && sept.letters_in_focus && sept.letters_in_focus.length === 4);
assert('september-2026 4 tiers', sept && Object.keys(sept.tiers).length === 4);

const jan = Bridge.loadPack('january-2026');
assert('january-2026 נטען', !!jan);
assert('january-2026 focus_mode=strand', jan && jan.focus_mode === 'strand');
assert('january-2026 strand_breakdown 3 skills', jan && jan.strand_breakdown && jan.strand_breakdown.skills.length === 3);

assert('loadPack לא קיים → null', Bridge.loadPack('nonexistent-9999') === null);

// ============================================================================
// BLOCK 5 — selectTierForStudent · letters-focused · cold-start
// ============================================================================

section('BLOCK 5 — letters-focused · cold-start (אין דאטה)');

localStorage.clear();
setupBktMock({}, {});  // אין דאטה לאף תלמידה

const cold = Bridge.selectTierForStudent('student-cold', 'september-2026');
assert('cold → tier 1', cold.tier === 1, 'got ' + cold.tier);
assert('cold → source=cold-start', cold.source === 'cold-start', 'got ' + cold.source);
assert('cold → confidence=low', cold.confidence === 'low');
assert('cold → reason קיים', typeof cold.reason === 'string' && cold.reason.length > 0);

// ============================================================================
// BLOCK 6 — letters-focused · partial data (2/4 letters with ≥5 attempts)
// ============================================================================

section('BLOCK 6 — letters-focused · דאטה חלקית (2/4 אותיות)');

setupBktMock({
  'student-partial': {
    'ש': { pKnown: 0.70, attempts: 8 },
    'ל': { pKnown: 0.72, attempts: 10 }
    // נ, א — אין
  }
}, {});

const partial = Bridge.selectTierForStudent('student-partial', 'september-2026');
assert('partial → tier 3 (avg=0.71)', partial.tier === 3, 'got tier=' + partial.tier + ' p=' + partial.pKnown);
assert('partial → source=auto', partial.source === 'auto');
assert('partial → confidence=med (2/4)', partial.confidence === 'med', 'got ' + partial.confidence);
assert('partial → contributingLetters=2', partial.contributingLetters && partial.contributingLetters.length === 2);

// ============================================================================
// BLOCK 7 — letters-focused · full data, all 4 letters
// ============================================================================

section('BLOCK 7 — letters-focused · דאטה מלאה (4/4 אותיות → high)');

setupBktMock({
  'student-full': {
    'ש': { pKnown: 0.90, attempts: 15 },
    'ל': { pKnown: 0.88, attempts: 20 },
    'נ': { pKnown: 0.92, attempts: 12 },
    'א': { pKnown: 0.86, attempts: 10 }
  }
}, {});

const full = Bridge.selectTierForStudent('student-full', 'september-2026');
assert('full → tier 4 (avg≈0.89)', full.tier === 4, 'got tier=' + full.tier);
assert('full → confidence=high (4/4)', full.confidence === 'high', 'got ' + full.confidence);
assert('full → pKnown ≈ 0.89', Math.abs(full.pKnown - 0.89) < 0.02, 'got ' + full.pKnown);

// ============================================================================
// BLOCK 8 — letters-focused · insufficient attempts (<5 per letter)
// ============================================================================

section('BLOCK 8 — letters-focused · attempts מעטים (<5)');

setupBktMock({
  'student-few': {
    'ש': { pKnown: 0.95, attempts: 3 },  // <5 → לא ייספר
    'ל': { pKnown: 0.95, attempts: 2 }
  }
}, {});

const few = Bridge.selectTierForStudent('student-few', 'september-2026');
assert('few attempts → tier 1 + cold-start', few.tier === 1 && few.source === 'cold-start',
       'got tier=' + few.tier + ' src=' + few.source);

// ============================================================================
// BLOCK 9 — strand-focused · cold (<10 attempts)
// ============================================================================

section('BLOCK 9 — strand-focused · cold (<10 ניסיונות בסטרנד 1)');

setupBktMock({}, {
  'student-strand-cold': {
    1: { pKnown: 0.80, attempts: 5 }  // <10 → cold
  }
});

const sCold = Bridge.selectTierForStudent('student-strand-cold', 'january-2026');
assert('strand cold → tier 1', sCold.tier === 1, 'got ' + sCold.tier);
assert('strand cold → source=cold-start', sCold.source === 'cold-start');
assert('strand cold → confidence=low', sCold.confidence === 'low');

// ============================================================================
// BLOCK 10 — strand-focused · medium data (10-29 attempts)
// ============================================================================

section('BLOCK 10 — strand-focused · דאטה בינונית (10-29 → med)');

setupBktMock({}, {
  'student-strand-med': {
    1: { pKnown: 0.50, attempts: 15 }
  }
});

const sMed = Bridge.selectTierForStudent('student-strand-med', 'january-2026');
assert('strand med → tier 2 (p=0.5)', sMed.tier === 2, 'got ' + sMed.tier);
assert('strand med → confidence=med', sMed.confidence === 'med');
assert('strand med → pKnown=0.5', sMed.pKnown === 0.50);

// ============================================================================
// BLOCK 11 — strand-focused · high data (≥30 attempts)
// ============================================================================

section('BLOCK 11 — strand-focused · דאטה גבוהה (≥30 → high)');

setupBktMock({}, {
  'student-strand-high': {
    1: { pKnown: 0.92, attempts: 45 }
  }
});

const sHigh = Bridge.selectTierForStudent('student-strand-high', 'january-2026');
assert('strand high → tier 4 (p=0.92)', sHigh.tier === 4, 'got ' + sHigh.tier);
assert('strand high → confidence=high', sHigh.confidence === 'high');

// ============================================================================
// BLOCK 12 — overrideTier + selectTierForStudent קורא קודם
// ============================================================================

section('BLOCK 12 — override flow (set + read + clear)');

localStorage.clear();
setupBktMock({
  'student-override': {
    'ש': { pKnown: 0.10, attempts: 20 },
    'ל': { pKnown: 0.10, attempts: 20 },
    'נ': { pKnown: 0.10, attempts: 20 },
    'א': { pKnown: 0.10, attempts: 20 }
  }
}, {});

// בלי override → tier 1
const before = Bridge.selectTierForStudent('student-override', 'september-2026');
assert('לפני override → tier 1', before.tier === 1, 'got ' + before.tier);
assert('לפני override → source=auto', before.source === 'auto');

// מגדירים override ל-Tier 4
const setOk = Bridge.overrideTier('student-override', 'september-2026', 4);
assert('overrideTier(4) הצליח', setOk === true);

// אחרי override → tier 4 + source=manual
const afterOverride = Bridge.selectTierForStudent('student-override', 'september-2026');
assert('אחרי override → tier 4', afterOverride.tier === 4, 'got ' + afterOverride.tier);
assert('אחרי override → source=manual', afterOverride.source === 'manual');
assert('אחרי override → confidence=high', afterOverride.confidence === 'high');
assert('אחרי override → overrideDate קיים', typeof afterOverride.overrideDate === 'number');

// clear → חזרה ל-tier 1
const clearOk = Bridge.clearOverride('student-override', 'september-2026');
assert('clearOverride הצליח', clearOk === true);

const afterClear = Bridge.selectTierForStudent('student-override', 'september-2026');
assert('אחרי clear → tier 1 (חזרה ל-auto)', afterClear.tier === 1);
assert('אחרי clear → source=auto', afterClear.source === 'auto');

// ============================================================================
// BLOCK 13 — overrideTier validation (tier מחוץ לטווח)
// ============================================================================

section('BLOCK 13 — overrideTier validation');

assert('overrideTier(0) דוחה', Bridge.overrideTier('s', 'september-2026', 0) === false);
assert('overrideTier(5) דוחה', Bridge.overrideTier('s', 'september-2026', 5) === false);
assert('overrideTier("3") דוחה (לא number)', Bridge.overrideTier('s', 'september-2026', '3') === false);
assert('clearOverride לא קיים → false', Bridge.clearOverride('s-noexist', 'september-2026') === false);

// ============================================================================
// BLOCK 14 — getItemsForStudent
// ============================================================================

section('BLOCK 14 — getItemsForStudent');

localStorage.clear();
setupBktMock({
  'student-items': {
    'ש': { pKnown: 0.70, attempts: 10 },
    'ל': { pKnown: 0.72, attempts: 10 },
    'נ': { pKnown: 0.70, attempts: 10 },
    'א': { pKnown: 0.70, attempts: 10 }
  }
}, {});

const items = Bridge.getItemsForStudent('student-items', 'september-2026');
assert('getItemsForStudent מחזיר array', Array.isArray(items));
assert('items > 0', items.length > 0);
assert('items מ-Tier 3 (avg=0.705)', items[0] && items[0].tier === 3,
       'got items[0].tier=' + (items[0] && items[0].tier));

// עם override → Tier 1 items
Bridge.overrideTier('student-items', 'september-2026', 1);
const itemsT1 = Bridge.getItemsForStudent('student-items', 'september-2026');
assert('items אחרי override(1) מ-Tier 1', itemsT1[0] && itemsT1[0].tier === 1);
Bridge.clearOverride('student-items', 'september-2026');

// ============================================================================
// BLOCK 15 — Fallbacks (pack לא קיים · focus_mode לא תקין)
// ============================================================================

section('BLOCK 15 — fallbacks');

const noPack = Bridge.selectTierForStudent('s', 'nonexistent-9999');
assert('pack לא קיים → tier 1', noPack.tier === 1);
assert('pack לא קיים → source=fallback', noPack.source === 'fallback');

// AvneiBKT לא נטען
clearBktMock();
const noBkt = Bridge.selectTierForStudent('s', 'september-2026');
assert('AvneiBKT לא נטען → tier 1 + fallback',
       noBkt.tier === 1 && noBkt.source === 'fallback', 'got ' + JSON.stringify(noBkt));

// ============================================================================
// BLOCK 16 — Backwards compat: getItemsForStudent ללא pack
// ============================================================================

section('BLOCK 16 — edge cases');

const itemsEmpty = Bridge.getItemsForStudent('s', 'nonexistent');
assert('getItemsForStudent על pack לא קיים → []', Array.isArray(itemsEmpty) && itemsEmpty.length === 0);

setupBktMock({}, {});
const studentNonexistent = Bridge.selectTierForStudent('totally-new-student', 'september-2026');
assert('תלמידה חדשה → tier 1', studentNonexistent.tier === 1);
assert('תלמידה חדשה → source=cold-start', studentNonexistent.source === 'cold-start');

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
