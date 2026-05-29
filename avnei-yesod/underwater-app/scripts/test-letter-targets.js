#!/usr/bin/env node
// ============================================================================
// test-letter-targets.js — Teacher Letter Targets (A+B integration)
// סוכן קוד F.21E · 29.5.2026 ערב
//
// בודק:
//   - API surface
//   - Targets: add · remove · get · expiration · TTL
//   - Freeze: mark · remove · get · isFrozen · TTL
//   - addTarget מקפיא אוטומטית
//   - getAllTargetedSids
//   - persistence via localStorage mock
//   - edge cases: missing sid · missing letter · null
//
// הרצה: node scripts/test-letter-targets.js
// ============================================================================

'use strict';
const path = require('path');

function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; },
    _store: function () { return store; }
  };
}

function clearMocks() {
  global.localStorage = null;
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'letter-targets.js');
  delete require.cache[p];
}

function loadModule() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'letter-targets.js');
  delete require.cache[p];
  return require(p);
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}
function header(t) { console.log('\n=== ' + t + ' ==='); }

console.log('\n📋 Letter Targets — Test Suite');
console.log('==================================================');

// --------------------------------------------------------
header('1. API surface');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();
  assert(typeof LT.addTarget === 'function', 'addTarget נחשפת');
  assert(typeof LT.removeTarget === 'function', 'removeTarget נחשפת');
  assert(typeof LT.getTargets === 'function', 'getTargets נחשפת');
  assert(typeof LT.getActiveTargets === 'function', 'getActiveTargets נחשפת');
  assert(typeof LT.getAllTargetedSids === 'function', 'getAllTargetedSids נחשפת');
  assert(typeof LT.markFrozen === 'function', 'markFrozen נחשפת');
  assert(typeof LT.removeFrozen === 'function', 'removeFrozen נחשפת');
  assert(typeof LT.getFrozen === 'function', 'getFrozen נחשפת');
  assert(typeof LT.isFrozen === 'function', 'isFrozen נחשפת');
  assert(LT.TARGETS_KEY === 'avnei-teacher-letter-targets-v1', 'TARGETS_KEY');
  assert(LT.FREEZE_KEY === 'avnei-teacher-letter-freeze-v1', 'FREEZE_KEY');
  assert(LT.TARGET_DURATION_DAYS === 14, 'TARGET_DURATION_DAYS = 14');
  assert(LT.FREEZE_DURATION_DAYS === 3, 'FREEZE_DURATION_DAYS = 3');
}

// --------------------------------------------------------
header('2. Targets — add / get / remove');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();

  assert(LT.getTargets('s1').length === 0, 'targets ריקים בהתחלה');
  assert(LT.addTarget('s1', 'מ') === true, 'addTarget מצליח');
  const t1 = LT.getTargets('s1');
  assert(t1.length === 1 && t1[0] === 'מ', 'הוספה הופיעה ב-getTargets');

  // dedup על-ידי overwrite (אותו key) — לא דופלקציה
  assert(LT.addTarget('s1', 'מ') === true, 'add חוזר על אותה אות (overwrite)');
  assert(LT.getTargets('s1').length === 1, 'אין דופלקציה');

  // hosts on add
  assert(LT.addTarget('s1', 'ש') === true, 'add אות שונה');
  assert(LT.getTargets('s1').length === 2, 'שתי אותיות בטרגטים');

  // remove
  assert(LT.removeTarget('s1', 'מ') === true, 'remove מצליח');
  assert(LT.getTargets('s1').length === 1 && LT.getTargets('s1')[0] === 'ש', 'נשארה רק ש');

  // remove שלא קיים
  assert(LT.removeTarget('s1', 'unknown') === false, 'remove שלא קיים → false');
  assert(LT.removeTarget('s99', 'מ') === false, 'remove ל-sid לא קיים → false');

  // empty inputs
  assert(LT.addTarget(null, 'מ') === false, 'sid null → false');
  assert(LT.addTarget('s1', null) === false, 'letter null → false');
  assert(LT.addTarget('', '') === false, 'שניהם ריקים → false');
  assert(LT.getTargets(null).length === 0, 'getTargets null → []');
}

// --------------------------------------------------------
header('3. Targets — TTL (14 ימים)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();

  // הוסף ידנית entry שפג תוקפו
  const now = Date.now();
  const past15 = (new Date(now - 15 * 24 * 60 * 60 * 1000)).toISOString();
  const expired = {
    s1: {
      'מ': {
        addedAt: past15,
        expiresAt: past15,
        source: 'teacher-send'
      }
    }
  };
  global.localStorage.setItem(LT.TARGETS_KEY, JSON.stringify(expired));

  assert(LT.getTargets('s1').length === 0, 'entry שפג תוקף → לא מוחזר');
  assert(LT.getActiveTargets('s1').length === 0, 'getActiveTargets מסנן expired');

  // entry שפוקע בעוד יומיים — תקף
  const future2 = (new Date(now + 2 * 24 * 60 * 60 * 1000)).toISOString();
  const valid = {
    s1: {
      'ש': {
        addedAt: (new Date(now)).toISOString(),
        expiresAt: future2,
        source: 'teacher-send'
      }
    }
  };
  global.localStorage.setItem(LT.TARGETS_KEY, JSON.stringify(valid));
  assert(LT.getTargets('s1').length === 1, 'entry בתוך TTL → מוחזר');
}

// --------------------------------------------------------
header('4. Freeze — mark / isFrozen / get / remove');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();

  assert(LT.getFrozen('s1').length === 0, 'frozen ריק בהתחלה');
  assert(LT.isFrozen('s1', 'מ') === false, 'isFrozen false בהתחלה');

  assert(LT.markFrozen('s1', 'מ') === true, 'markFrozen מצליח');
  assert(LT.isFrozen('s1', 'מ') === true, 'isFrozen true אחרי mark');
  const f1 = LT.getFrozen('s1');
  assert(f1.length === 1 && f1[0] === 'מ', 'getFrozen מחזיר את האות');

  assert(LT.markFrozen('s1', 'ש') === true, 'mark אות שנייה');
  assert(LT.getFrozen('s1').length === 2, '2 frozen');

  assert(LT.removeFrozen('s1', 'מ') === true, 'remove מצליח');
  assert(LT.isFrozen('s1', 'מ') === false, 'אחרי remove → לא frozen');
  assert(LT.getFrozen('s1').length === 1 && LT.getFrozen('s1')[0] === 'ש', 'נשארה ש');

  assert(LT.removeFrozen('s1', 'missing') === false, 'remove שלא קיים → false');
  assert(LT.markFrozen(null, 'מ') === false, 'sid null → false');
  assert(LT.markFrozen('s1', '') === false, 'letter ריק → false');
}

// --------------------------------------------------------
header('5. Freeze TTL (3 ימים)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();

  // mark הוא 3 ימים → בודקים שזה אכן 3
  LT.markFrozen('s1', 'מ');
  const all = JSON.parse(global.localStorage.getItem(LT.FREEZE_KEY));
  const entry = all['s1']['מ'];
  const frozenAt = Date.parse(entry.frozenAt);
  const expiresAt = Date.parse(entry.expiresAt);
  const diffDays = (expiresAt - frozenAt) / (24 * 60 * 60 * 1000);
  assert(Math.abs(diffDays - 3) < 0.01, 'TTL פגיעה = 3 ימים בדיוק');

  // entry שפג תוקף → לא frozen
  const past4days = (new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)).toISOString();
  const expired = { s1: { 'ש': { frozenAt: past4days, expiresAt: past4days, source: 'teacher-handled' } } };
  global.localStorage.setItem(LT.FREEZE_KEY, JSON.stringify(expired));
  assert(LT.isFrozen('s1', 'ש') === false, 'expired freeze → not frozen');
  assert(LT.getFrozen('s1').length === 0, 'getFrozen מסנן expired');
}

// --------------------------------------------------------
header('6. addTarget מקפיא אוטומטית');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();

  assert(LT.isFrozen('s1', 'מ') === false, 'מ לא frozen בהתחלה');
  LT.addTarget('s1', 'מ', 'teacher-send');
  assert(LT.isFrozen('s1', 'מ') === true, 'addTarget הקפיא אוטומטית');
  assert(LT.getFrozen('s1').indexOf('מ') !== -1, 'מ ב-getFrozen אחרי addTarget');

  // לבדוק שה-source = 'auto-from-target'
  const all = JSON.parse(global.localStorage.getItem(LT.FREEZE_KEY));
  assert(all['s1']['מ'].source === 'auto-from-target', 'source = auto-from-target');
}

// --------------------------------------------------------
header('7. getAllTargetedSids');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();

  assert(LT.getAllTargetedSids().length === 0, 'ריק בהתחלה');

  LT.addTarget('s1', 'מ');
  LT.addTarget('s2', 'ש');
  LT.addTarget('s3', 'ר');

  const sids = LT.getAllTargetedSids().sort();
  assert(sids.length === 3, '3 sids עם targets');
  assert(sids[0] === 's1' && sids[1] === 's2' && sids[2] === 's3', 'הסידים הנכונים');

  LT.removeTarget('s2', 'ש');
  const sids2 = LT.getAllTargetedSids().sort();
  assert(sids2.length === 2 && sids2.indexOf('s2') === -1, 'אחרי remove — s2 לא ברשימה');
}

// --------------------------------------------------------
header('8. Persistence between calls');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  let LT = loadModule();
  LT.addTarget('s1', 'מ');
  LT.markFrozen('s2', 'ש');

  // טעינה מחדש של המודול
  LT = loadModule();
  assert(LT.getTargets('s1')[0] === 'מ', 'targets שורד טעינה מחדש');
  assert(LT.isFrozen('s2', 'ש') === true, 'frozen שורד טעינה מחדש');
}

// --------------------------------------------------------
header('9. Edge — corrupted localStorage');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const LT = loadModule();
  global.localStorage.setItem(LT.TARGETS_KEY, '{not valid json');
  assert(LT.getTargets('s1').length === 0, 'JSON שבור → [] (לא קורס)');

  global.localStorage.setItem(LT.FREEZE_KEY, 'null');
  assert(LT.isFrozen('s1', 'מ') === false, 'null → false');
}

// --------------------------------------------------------
console.log('\n==================================================');
console.log('סיכום: ' + pass + ' עברו · ' + fail + ' נכשלו');
console.log('==================================================');
if (fail > 0) process.exit(1);
