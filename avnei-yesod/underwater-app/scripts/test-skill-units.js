#!/usr/bin/env node
// ============================================================================
// test-skill-units.js — Skill Unit Abstraction layer (F.21E unit-agnostic)
// סוכן קוד F.21E · 29.5.2026 ערב מאוחר
//
// בודק:
//   - API surface + UNIT_TYPES constants
//   - validation (_isValidUnit)
//   - unitToDisplayHe (per type + fallback)
//   - unitKey (canonical)
//   - addTarget / removeTarget / getTargets (delegated to LetterTargets for type='letter')
//   - markFrozen / removeFrozen / isFrozen / getFrozen
//   - getWeakUnits (pulls from BKT, filters frozen)
//   - makeLetterUnit shorthand
//   - non-letter types → returns false / [] gracefully (future)
//
// הרצה: node scripts/test-skill-units.js
// ============================================================================

'use strict';
const path = require('path');

function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; }
  };
}

function clearMocks() {
  global.localStorage = null;
  global.AvneiLetterTargets = null;
  global.AvneiVowelAdapter = null;
  global.AvneiBKT = null;
  const pSU = path.resolve(__dirname, '..', 'js', 'shared', 'skill-units.js');
  const pLT = path.resolve(__dirname, '..', 'js', 'shared', 'letter-targets.js');
  const pVA = path.resolve(__dirname, '..', 'js', 'shared', 'vowel-adapter.js');
  delete require.cache[pSU];
  delete require.cache[pLT];
  delete require.cache[pVA];
}

function loadSU() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'skill-units.js');
  delete require.cache[p];
  return require(p);
}

function loadLT() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'letter-targets.js');
  delete require.cache[p];
  return require(p);
}

function loadVA() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'vowel-adapter.js');
  delete require.cache[p];
  return require(p);
}

function setupBKT(weakestByStudent) {
  global.AvneiBKT = {
    getWeakestLetters: function (sid, n) {
      const list = weakestByStudent && weakestByStudent[sid];
      if (!Array.isArray(list)) return [];
      return list.slice(0, n || 3);
    }
  };
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}
function header(t) { console.log('\n=== ' + t + ' ==='); }

console.log('\n📋 Skill Units — Test Suite');
console.log('==================================================');

// --------------------------------------------------------
header('1. API surface + constants');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const SU = loadSU();
  assert(typeof SU.addTarget === 'function', 'addTarget');
  assert(typeof SU.removeTarget === 'function', 'removeTarget');
  assert(typeof SU.getTargets === 'function', 'getTargets');
  assert(typeof SU.markFrozen === 'function', 'markFrozen');
  assert(typeof SU.removeFrozen === 'function', 'removeFrozen');
  assert(typeof SU.isFrozen === 'function', 'isFrozen');
  assert(typeof SU.getFrozen === 'function', 'getFrozen');
  assert(typeof SU.getWeakUnits === 'function', 'getWeakUnits');
  assert(typeof SU.unitToDisplayHe === 'function', 'unitToDisplayHe');
  assert(typeof SU.unitKey === 'function', 'unitKey');
  assert(typeof SU.makeLetterUnit === 'function', 'makeLetterUnit');
  assert(typeof SU.makeCVUnit === 'function', 'makeCVUnit');
  assert(SU.UNIT_TYPES.LETTER === 'letter', 'UNIT_TYPES.LETTER');
  assert(SU.UNIT_TYPES.VOWEL === 'vowel', 'UNIT_TYPES.VOWEL');
  assert(SU.UNIT_TYPES.WORD === 'word', 'UNIT_TYPES.WORD');
  assert(SU.UNIT_TYPES.MORPHEME === 'morpheme', 'UNIT_TYPES.MORPHEME');
  assert(SU.UNIT_TYPES.PHON_SKILL === 'phon-skill', 'UNIT_TYPES.PHON_SKILL');
  assert(SU.UNIT_TYPES.READING_SKILL === 'reading-skill', 'UNIT_TYPES.READING_SKILL');
  assert(SU.UNIT_TYPES.ORAL_SKILL === 'oral-skill', 'UNIT_TYPES.ORAL_SKILL');
  assert(SU.UNIT_TYPES.WRITING === 'writing', 'UNIT_TYPES.WRITING');
}

// --------------------------------------------------------
header('2. _isValidUnit');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const SU = loadSU();
  assert(SU._isValidUnit({type: 'letter', id: 'מ'}) === true, 'תקין: type+id');
  assert(SU._isValidUnit({type: 'letter', id: 'מ', displayHe: 'מ'}) === true, 'תקין: עם displayHe');
  assert(SU._isValidUnit({type: 'letter'}) === false, 'חסר id → false');
  assert(SU._isValidUnit({id: 'מ'}) === false, 'חסר type → false');
  assert(SU._isValidUnit(null) === false, 'null → false');
  assert(SU._isValidUnit('letter') === false, 'string → false');
  assert(SU._isValidUnit({type: '', id: 'מ'}) === false, 'type ריק → false');
}

// --------------------------------------------------------
header('3. unitToDisplayHe — per type');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const SU = loadSU();
  assert(SU.unitToDisplayHe({type: 'letter', id: 'מ'}) === 'מ', 'letter: id IS display');
  assert(SU.unitToDisplayHe({type: 'letter', id: 'מ', displayHe: 'האות מ'}) === 'האות מ',
         'displayHe מועדף על fallback');
  assert(SU.unitToDisplayHe({type: 'vowel', id: 'kamatz'}) === 'תנועת kamatz',
         'vowel: prefix "תנועת"');
  assert(SU.unitToDisplayHe({type: 'word', id: 'שולחן'}) === 'הקריאה של שולחן',
         'word: prefix');
  assert(SU.unitToDisplayHe({type: 'morpheme', id: 've'}) === 'התחילית ve',
         'morpheme: prefix');
  assert(SU.unitToDisplayHe({type: 'writing', id: 'dictation'}) === 'כתיבת dictation',
         'writing: prefix');
  assert(SU.unitToDisplayHe(null) === '', 'null → ""');
  assert(SU.unitToDisplayHe({type: 'unknown', id: 'x'}) === 'x',
         'unknown type → fallback to id');
}

// --------------------------------------------------------
header('4. unitKey + makeLetterUnit');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const SU = loadSU();
  assert(SU.unitKey({type: 'letter', id: 'מ'}) === 'letter:מ', 'canonical key');
  assert(SU.unitKey({type: 'vowel', id: 'kamatz'}) === 'vowel:kamatz', 'vowel key');
  assert(SU.unitKey(null) === '', 'null → ""');

  const u = SU.makeLetterUnit('ש');
  assert(u.type === 'letter' && u.id === 'ש' && u.displayHe === 'ש' && u.strand === 1,
         'makeLetterUnit מבנה נכון');
}

// --------------------------------------------------------
header('5. addTarget / removeTarget — delegates to LetterTargets');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  global.AvneiLetterTargets = loadLT();
  const SU = loadSU();

  const unit = SU.makeLetterUnit('מ');
  assert(SU.addTarget('s1', unit, 'teacher-send') === true, 'addTarget letter מצליח');
  const targets = SU.getTargets('s1');
  assert(targets.length === 1, '1 target');
  assert(targets[0].type === 'letter' && targets[0].id === 'מ', 'target נכון');

  assert(SU.removeTarget('s1', unit) === true, 'removeTarget מצליח');
  assert(SU.getTargets('s1').length === 0, '0 אחרי remove');

  // edge: unit לא תקין
  assert(SU.addTarget('s1', null) === false, 'null unit → false');
  assert(SU.addTarget(null, unit) === false, 'null sid → false');
}

// --------------------------------------------------------
header('6. Freeze — delegates to LetterTargets');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  global.AvneiLetterTargets = loadLT();
  const SU = loadSU();

  const unit = SU.makeLetterUnit('ש');
  assert(SU.isFrozen('s1', unit) === false, 'לא frozen בהתחלה');
  assert(SU.markFrozen('s1', unit, 'teacher-handled') === true, 'markFrozen מצליח');
  assert(SU.isFrozen('s1', unit) === true, 'frozen אחרי mark');
  const f = SU.getFrozen('s1');
  assert(f.length === 1 && f[0].type === 'letter' && f[0].id === 'ש', 'getFrozen מחזיר unit');
  assert(SU.removeFrozen('s1', unit) === true, 'removeFrozen');
  assert(SU.isFrozen('s1', unit) === false, 'לא frozen אחרי remove');
}

// --------------------------------------------------------
header('7. getWeakUnits — pulls from BKT, filters frozen');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  global.AvneiLetterTargets = loadLT();
  setupBKT({
    s1: [
      { letter: 'מ', pKnown: 0.10 },
      { letter: 'ש', pKnown: 0.20 },
      { letter: 'ר', pKnown: 0.30 },
      { letter: 'ל', pKnown: 0.40 }
    ]
  });
  const SU = loadSU();

  const r0 = SU.getWeakUnits('s1', 3);
  assert(r0.length === 3, 'top-3');
  assert(r0[0].type === 'letter' && r0[0].id === 'מ', 'ראשון: מ');
  assert(r0[1].id === 'ש', 'שני: ש');
  assert(r0[2].id === 'ר', 'שלישי: ר');

  // הקפא את מ
  SU.markFrozen('s1', SU.makeLetterUnit('מ'));
  const r1 = SU.getWeakUnits('s1', 3);
  assert(r1[0].id === 'ש', 'אחרי freeze מ — ראשון ש');
  assert(r1.find(function (u) { return u.id === 'מ'; }) === undefined, 'מ לא בתוצאה');

  // אין BKT
  global.AvneiBKT = null;
  const SU2 = loadSU();
  assert(SU2.getWeakUnits('s1', 3).length === 0, 'אין BKT → []');
}

// --------------------------------------------------------
header('8. Non-letter types — graceful fallback (post-pilot)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  global.AvneiLetterTargets = loadLT();
  const SU = loadSU();

  // vowel ללא letter (abstract vowel) → post-pilot, false
  const vowelOnly = { type: 'vowel', id: 'kamatz', displayHe: 'תנועת קמץ' };
  assert(SU.addTarget('s1', vowelOnly) === false, 'vowel ללא letter addTarget → false');
  assert(SU.markFrozen('s1', vowelOnly) === false, 'vowel ללא letter markFrozen → false');
  assert(SU.isFrozen('s1', vowelOnly) === false, 'vowel ללא letter isFrozen → false');

  const word = { type: 'word', id: 'שולחן' };
  assert(SU.addTarget('s1', word) === false, 'word addTarget → false (post-pilot)');

  // getTargets/getFrozen מחזירים רק letter units (delegation)
  global.AvneiLetterTargets.addTarget('s1', 'מ');
  const t = SU.getTargets('s1');
  assert(t.length === 1 && t[0].type === 'letter', 'getTargets רק letters (אין vowel adapter)');
}

// --------------------------------------------------------
header('10. Vowel + CV — סוכן 29 · אי 4');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  global.AvneiLetterTargets = loadLT();
  global.AvneiVowelAdapter = loadVA();
  const SU = loadSU();

  // makeCVUnit
  const cv = SU.makeCVUnit('מ', 'patach');
  assert(cv.type === 'vowel' && cv.id === 'patach' && cv.letter === 'מ' && cv.strand === 1,
    'makeCVUnit מבנה נכון');
  assert(cv.displayHe === 'מַ', 'displayHe = מַ');

  // unitToDisplayHe — vowel + letter
  assert(SU.unitToDisplayHe(cv) === 'מַ', 'unitToDisplayHe(CV) = מַ');
  // unitToDisplayHe — vowel ללא letter (abstract vowel)
  const abstractKamatz = { type: 'vowel', id: 'kamatz' };
  assert(SU.unitToDisplayHe(abstractKamatz) === 'תנועת קמץ',
    'unitToDisplayHe(vowel abstract) = "תנועת <שם>"');

  // addTarget — CV pair
  assert(SU.addTarget('s1', cv, 'teacher-send') === true, 'addTarget(CV) מצליח');
  // auto-freeze בעקבות add (מוסבר ב-vowel-adapter)
  assert(SU.isFrozen('s1', cv) === true, 'auto-freeze אחרי addTarget');
  const targets = SU.getTargets('s1');
  const cvTargets = targets.filter(function (t) { return t.type === 'vowel'; });
  assert(cvTargets.length === 1, '1 CV target ב-getTargets');
  assert(cvTargets[0].letter === 'מ' && cvTargets[0].id === 'patach', 'מ + patach');
  assert(cvTargets[0].displayHe === 'מַ', 'cv display ב-target');

  // removeTarget
  assert(SU.removeTarget('s1', cv) === true, 'removeTarget(CV) מצליח');
  const remainingTargets = SU.getTargets('s1');
  assert(remainingTargets.filter(function (t) { return t.type === 'vowel'; }).length === 0,
    'אין CV targets אחרי remove');

  // markFrozen + getFrozen — CV pair (ה-auto-freeze מ-addTarget הקודם נשאר ב-frozen
  // 3 ימים, אז יש כעת 2 entries; בודקים שהחדש מופיע)
  const cv2 = SU.makeCVUnit('ב', 'shva');
  assert(SU.markFrozen('s1', cv2, 'teacher-handled') === true, 'markFrozen(CV) מצליח');
  assert(SU.isFrozen('s1', cv2) === true, 'isFrozen(CV) = true');
  const frozenCVs = SU.getFrozen('s1').filter(function (f) { return f.type === 'vowel'; });
  assert(frozenCVs.find(function (f) { return f.letter === 'ב' && f.id === 'shva'; }),
    'getFrozen כולל ב:shva');
  assert(SU.removeFrozen('s1', cv2) === true, 'removeFrozen(CV) מצליח');
  assert(SU.isFrozen('s1', cv2) === false, 'isFrozen(CV) = false אחרי remove');

  // mixed: גם letter target וגם CV target ב-getTargets
  global.AvneiLetterTargets.addTarget('s1', 'ר');
  SU.addTarget('s1', SU.makeCVUnit('ק', 'kamatz'));
  const mixed = SU.getTargets('s1');
  const letterCount = mixed.filter(function (m) { return m.type === 'letter'; }).length;
  const vowelCount = mixed.filter(function (m) { return m.type === 'vowel'; }).length;
  assert(letterCount === 1, '1 letter target');
  assert(vowelCount === 1, '1 vowel target');
}

// --------------------------------------------------------
header('9. ללא LetterTargets adapter');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  // לא טוענים LetterTargets
  const SU = loadSU();
  const unit = SU.makeLetterUnit('מ');
  assert(SU.addTarget('s1', unit) === false, 'בלי adapter → false');
  assert(SU.getTargets('s1').length === 0, 'בלי adapter → []');
  assert(SU.isFrozen('s1', unit) === false, 'בלי adapter → false');
}

// --------------------------------------------------------
console.log('\n==================================================');
console.log('סיכום: ' + pass + ' עברו · ' + fail + ' נכשלו');
console.log('==================================================');
if (fail > 0) process.exit(1);
