#!/usr/bin/env node
// ============================================================================
// test-island-5-integration.js — Integration tests for אי 5 (סוכן 30 · 30.5.2026)
//
// בודק:
//   - bkt.js: ISLANDS_WITH_SUB_BKT כולל 5
//   - bkt.js: PARAMS_PER_ISLAND[5] קיים
//   - bkt.js: emptyIsland5Record / ingestIsland5Event
//   - bkt.js: ingestEvent מנתב אי 5 ל-sub-BKT (target_word_length)
//   - bkt.js: getWordLengthState / getWeakestWordLengths / getWordLengthMasteryDistribution
//   - bkt.js: checkMastery(5) מחזיר per_word_length
//   - skill-units.js: WORD type מועבר ל-AvneiWordAdapter (addTarget/getTargets)
//   - skill-units.js: makeWordUnit מחזיר אובייקט נכון
//   - event-logger ISLAND_TO_STRAND[5] === 1
//   - mastery-check ISLAND_TO_RAMA[5] קיים (rama_task=6)
//
// הרצה: node scripts/test-island-5-integration.js
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
  global.AvneiBKT = null;
  global.AvneiWordAdapter = null;
  global.AvneiLetterTargets = null;
  global.AvneiVowelAdapter = null;
  global.AvneiOralSkillAdapter = null;
  global.window = undefined;
  // wipe caches
  ['bkt', 'word-adapter', 'skill-units', 'event-logger', 'mastery-check'].forEach(function (m) {
    try {
      const p = path.resolve(__dirname, '..', 'js', 'shared', m + '.js');
      delete require.cache[p];
    } catch (e) {}
  });
}

function loadBKT() {
  // bkt.js mutates window.AvneiBKT — emulate browser-like global
  global.window = global.window || {};
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'bkt.js');
  delete require.cache[p];
  require(p);
  return global.window.AvneiBKT || global.AvneiBKT;
}

function loadWA() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'word-adapter.js');
  delete require.cache[p];
  return require(p);
}

function loadSU() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'skill-units.js');
  delete require.cache[p];
  return require(p);
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}
function header(t) { console.log('\n=== ' + t + ' ==='); }

console.log('\n📋 אי 5 Integration — Test Suite');
console.log('==================================================');

// --------------------------------------------------------
header('1. bkt.js — Constants + emptyIsland5Record');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const BKT = loadBKT();
  assert(BKT.ISLANDS_WITH_SUB_BKT.indexOf(5) >= 0, 'ISLANDS_WITH_SUB_BKT כולל 5');
  assert(BKT.ISLANDS_WITH_SUB_BKT.indexOf(3) >= 0, '3 עדיין נמצא (לא דרסנו)');
  assert(BKT.ISLANDS_WITH_SUB_BKT.indexOf(14) >= 0, '14 עדיין נמצא (לא דרסנו)');
  assert(BKT.PARAMS_PER_ISLAND[5] !== undefined, 'PARAMS_PER_ISLAND[5] קיים');
  assert(BKT.PARAMS_PER_ISLAND[14] !== undefined, '14 params עדיין קיימים');
  assert(typeof BKT.PARAMS_PER_ISLAND[5].pL0 === 'number', 'PARAMS_PER_ISLAND[5].pL0 הוא number');
  assert(Array.isArray(BKT.ISLAND_5_WORD_LENGTHS), 'ISLAND_5_WORD_LENGTHS נחשף');
  assert(BKT.ISLAND_5_WORD_LENGTHS.length === 3, 'ISLAND_5_WORD_LENGTHS = 3 buckets');
  assert(BKT.WORD_LENGTH_DISPLAY_HE['2cv'].length > 0, 'WORD_LENGTH_DISPLAY_HE[2cv] קיים');
}

// --------------------------------------------------------
header('2. ingestEvent → אי 5 → sub-BKT update');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const BKT = loadBKT();
  const sid = 's1';
  const evt = {
    student_id: sid,
    session_id: 'sess-test',
    primary_island_id: 5,
    target_word_length: '3cv',
    target_letter: 'ב',
    is_correct: true,
    response_time_ms: 1200,
  };
  const result = BKT.ingestEvent(evt);
  assert(result !== null, 'ingestEvent מחזיר תוצאה');
  assert(result.word_length === '3cv', 'result.word_length = 3cv');
  assert(typeof result.pKnown_word_length === 'number', 'pKnown_word_length הוא number');
  assert(typeof result.pKnown_island === 'number', 'pKnown_island הוא number');
  // State updated
  const island = BKT.getIslandState(sid, 5);
  assert(island.per_word_length['3cv'].attempts === 1, '3cv.attempts = 1');
  assert(island.per_word_length['3cv'].correct === 1, '3cv.correct = 1');
  assert(island.per_word_length['2cv'].attempts === 0, '2cv unaffected');
  assert(island.per_word_length['4cv'].attempts === 0, '4cv unaffected');
  assert(island.total_attempts === 1, 'total_attempts = 1');
}

// --------------------------------------------------------
header('3. ingestEvent → אי 5 ללא target_word_length → null + warn');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const BKT = loadBKT();
  // Silence console.warn
  const oldWarn = console.warn;
  let warned = false;
  console.warn = function () { warned = true; };
  const evt = {
    student_id: 's2',
    session_id: 'sess-bad',
    primary_island_id: 5,
    // no target_word_length
    is_correct: true,
  };
  // ingestEvent returns the island result even if subevent fails — strand still runs
  // BUT our island callback returns null → ingestEvent should return null
  const r = BKT.ingestEvent(evt);
  console.warn = oldWarn;
  assert(r === null, 'event ללא target_word_length → null');
  assert(warned === true, 'console.warn נקרא');
}

// --------------------------------------------------------
header('4. getWordLengthState + getWeakestWordLengths');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const BKT = loadBKT();
  const sid = 's3';
  // Simulate 5 correct + 1 wrong on 2cv, 2 wrong on 3cv
  for (let i = 0; i < 5; i++) {
    BKT.ingestEvent({
      student_id: sid, session_id: 'sess-' + i, primary_island_id: 5,
      target_word_length: '2cv', target_letter: 'ב',
      is_correct: true, response_time_ms: 1000,
    });
  }
  BKT.ingestEvent({
    student_id: sid, session_id: 'sess-w', primary_island_id: 5,
    target_word_length: '2cv', target_letter: 'ב',
    is_correct: false,
  });
  for (let i = 0; i < 2; i++) {
    BKT.ingestEvent({
      student_id: sid, session_id: 'sess-3-' + i, primary_island_id: 5,
      target_word_length: '3cv', target_letter: 'מ',
      is_correct: false,
    });
  }
  const state2cv = BKT.getWordLengthState(sid, '2cv');
  assert(state2cv !== null, 'getWordLengthState(2cv) קיים');
  assert(state2cv.attempts === 6, '2cv.attempts = 6');
  assert(state2cv.correct === 5, '2cv.correct = 5');
  const weakest = BKT.getWeakestWordLengths(sid, 3);
  assert(Array.isArray(weakest), 'getWeakestWordLengths מחזיר array');
  if (weakest.length > 0) {
    assert(weakest[0].pKnown <= 0.7, 'הראשון הכי חלש');
  }
  // distribution
  const dist = BKT.getWordLengthMasteryDistribution(sid);
  assert(typeof dist.untouched === 'number', 'dist.untouched הוא number');
  assert(dist.total === 3, 'dist.total = 3');
}

// --------------------------------------------------------
header('5. checkMastery(5) — per_word_length response');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const BKT = loadBKT();
  const sid = 's4';
  BKT.ingestEvent({
    student_id: sid, session_id: 'sess-1', primary_island_id: 5,
    target_word_length: '2cv', target_letter: 'ב', is_correct: true, response_time_ms: 800,
  });
  const m = BKT.checkMastery(sid, 5);
  assert(m.per_word_length !== undefined, 'checkMastery(5) מחזיר per_word_length');
  assert(typeof m.per_word_length['2cv'] === 'object', '2cv state moves');
  assert(typeof m.aggregate_pKnown === 'number', 'aggregate_pKnown קיים');
  assert(Array.isArray(m.weak_word_lengths), 'weak_word_lengths is array');
}

// --------------------------------------------------------
header('6. skill-units WORD type → AvneiWordAdapter');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadWA();
  global.AvneiWordAdapter = WA;
  const SU = loadSU();

  // makeWordUnit
  const unit = SU.makeWordUnit('בַּת');
  assert(unit.type === 'word', 'makeWordUnit type=word');
  assert(unit.id === 'בַּת', 'makeWordUnit id=text');
  assert(unit.first_letter === 'ב', 'first_letter resolved');
  assert(unit.level === '2cv', 'level resolved');
  assert(unit.strand === 1, 'strand=1');

  // addTarget → delegated
  const ok = SU.addTarget('s1', unit, 'unit-test');
  assert(ok === true, 'SU.addTarget(word) → true');
  const targets = SU.getTargets('s1');
  const wordTargets = targets.filter(function (t) { return t.type === 'word'; });
  assert(wordTargets.length === 1, '1 word target via SU');
  assert(wordTargets[0].id === 'בַּת', 'target id=בַּת');

  // isFrozen (auto-freeze מהוספת target)
  assert(SU.isFrozen('s1', unit) === true, 'isFrozen=true אחרי addTarget');

  // removeTarget
  assert(SU.removeTarget('s1', unit) === true, 'removeTarget מצליחה');
  assert(SU.getTargets('s1').filter(function (t) { return t.type === 'word'; }).length === 0, '0 word targets אחרי הסרה');
}

// --------------------------------------------------------
header('7. event-logger ISLAND_TO_STRAND[5] === 1');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  // event-logger requires state.js's appendEvent in browser. In Node we just
  // load the module and check the static map.
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'event-logger.js');
  delete require.cache[p];
  // Provide minimal stub for appendEvent (state.js)
  global.appendEvent = function () {};
  global.window = global.window || {};
  require(p);
  const EL = global.window.AvneiEventLogger || global.AvneiEventLogger;
  assert(!!EL, 'AvneiEventLogger נטען');
  assert(EL.ISLAND_TO_STRAND[5] === 1, 'ISLAND_TO_STRAND[5] = 1');
  assert(EL.ISLAND_TO_STRAND[4] === 1, '4 → 1 (לא דרסנו)');
  assert(EL.ISLAND_TO_STRAND[14] === 3, '14 → 3 (לא דרסנו)');
}

// --------------------------------------------------------
header('8. mastery-check ISLAND_TO_RAMA[5] קיים (rama_task=6)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  global.window = global.window || {};
  // mastery-check requires window.AvneiBKT
  const BKT = loadBKT();
  global.window.AvneiBKT = BKT;
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'mastery-check.js');
  delete require.cache[p];
  require(p);
  const MC = global.window.AvneiMasteryCheck || global.AvneiMasteryCheck;
  assert(!!MC, 'AvneiMasteryCheck נטען');
  assert(!!MC.ISLAND_TO_RAMA[5], 'ISLAND_TO_RAMA[5] קיים');
  assert(MC.ISLAND_TO_RAMA[5].rama_task === 6, 'rama_task = 6');
  assert(MC.ISLAND_TO_RAMA[5].rama_task_name.indexOf('20 מילים') >= 0, 'name כולל "20 מילים"');
}

// --------------------------------------------------------
console.log('\n==================================================');
console.log('סיכום: ' + pass + ' עברו · ' + fail + ' נכשלו');
if (fail === 0) {
  console.log('✓ כל הבדיקות עברו!\n');
  process.exit(0);
} else {
  console.error('✗ ' + fail + ' בדיקות נכשלו\n');
  process.exit(1);
}
