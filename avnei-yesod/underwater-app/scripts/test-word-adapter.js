#!/usr/bin/env node
// ============================================================================
// test-word-adapter.js — Word Adapter (אי 5 — מיזוג צירופים למילים)
// סוכן 30 · 30.5.2026
//
// בודק:
//   - API surface (constants + functions)
//   - getWords by level (2cv/3cv/4cv) — count + uniqueness
//   - decomposeWord (letter + niqud + dagesh detection)
//   - validateBgdkptDagesh (ב/כ/פ בתחילת מילה)
//   - classifyWordLevel (פר letter_count)
//   - wordKey + wordAudioKey
//   - getWordsByLetter / getWordsForFamilySession
//   - getTopWeakWords (derived from BKT.getWeakestLetters)
//   - addTarget/removeTarget/getTargets (כולל auto-freeze)
//   - markFrozen/removeFrozen/isFrozen/getFrozen
//   - persistence דרך localStorage mock
//   - JSON sync check: data/island-05-words/*.json תואם WORDS_*CV באדפטר
//
// הרצה: node scripts/test-word-adapter.js
// ============================================================================

'use strict';
const path = require('path');
const fs = require('fs');

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
  global.AvneiBKT = null;
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'word-adapter.js');
  delete require.cache[p];
}

function loadModule() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'word-adapter.js');
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

console.log('\n📋 Word Adapter — Test Suite (אי 5)');
console.log('==================================================');

// --------------------------------------------------------
header('1. API surface + constants');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  assert(typeof WA.decomposeWord === 'function', 'decomposeWord נחשפת');
  assert(typeof WA.stripNiqud === 'function', 'stripNiqud נחשפת');
  assert(typeof WA.countBaseLetters === 'function', 'countBaseLetters נחשפת');
  assert(typeof WA.classifyWordLevel === 'function', 'classifyWordLevel נחשפת');
  assert(typeof WA.validateBgdkptDagesh === 'function', 'validateBgdkptDagesh נחשפת');
  assert(typeof WA.wordKey === 'function', 'wordKey נחשפת');
  assert(typeof WA.wordAudioKey === 'function', 'wordAudioKey נחשפת');
  assert(typeof WA.getWords === 'function', 'getWords נחשפת');
  assert(typeof WA.getAllWords === 'function', 'getAllWords נחשפת');
  assert(typeof WA.getWordByKey === 'function', 'getWordByKey נחשפת');
  assert(typeof WA.getWordByText === 'function', 'getWordByText נחשפת');
  assert(typeof WA.getWordsByLetter === 'function', 'getWordsByLetter נחשפת');
  assert(typeof WA.getWordsForFamilySession === 'function', 'getWordsForFamilySession נחשפת');
  assert(typeof WA.getTopWeakWords === 'function', 'getTopWeakWords נחשפת');
  assert(typeof WA.addTarget === 'function', 'addTarget נחשפת');
  assert(typeof WA.removeTarget === 'function', 'removeTarget נחשפת');
  assert(typeof WA.getTargets === 'function', 'getTargets נחשפת');
  assert(typeof WA.markFrozen === 'function', 'markFrozen נחשפת');
  assert(typeof WA.removeFrozen === 'function', 'removeFrozen נחשפת');
  assert(typeof WA.isFrozen === 'function', 'isFrozen נחשפת');
  assert(typeof WA.getFrozen === 'function', 'getFrozen נחשפת');
  assert(WA.TARGETS_KEY === 'avnei-teacher-word-targets-v1', 'TARGETS_KEY');
  assert(WA.FREEZE_KEY === 'avnei-teacher-word-freeze-v1', 'FREEZE_KEY');
  assert(WA.TARGET_DURATION_DAYS === 14, 'TARGET_DURATION_DAYS = 14');
  assert(WA.FREEZE_DURATION_DAYS === 3, 'FREEZE_DURATION_DAYS = 3');
  assert(Array.isArray(WA.ISLAND_5_WORD_LENGTHS) && WA.ISLAND_5_WORD_LENGTHS.length === 3,
    'ISLAND_5_WORD_LENGTHS = 3 buckets');
  assert(WA.ISLAND_5_WORD_LENGTHS[0] === '2cv', 'bucket 1 = 2cv');
  assert(WA.ISLAND_5_WORD_LENGTHS[2] === '4cv', 'bucket 3 = 4cv');
}

// --------------------------------------------------------
header('2. Word counts פר level');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  const l1 = WA.getWords('2cv');
  const l2 = WA.getWords('3cv');
  const l3 = WA.getWords('4cv');
  assert(l1.length >= 5, '2cv: ≥ 5 words (יש ' + l1.length + ')');
  assert(l2.length >= 20, '3cv: ≥ 20 words (יש ' + l2.length + ')');
  assert(l3.length >= 5, '4cv: ≥ 5 words (יש ' + l3.length + ')');
  const all = WA.getAllWords();
  assert(all.length === l1.length + l2.length + l3.length, 'getAllWords = סכום של 3 רמות');
  // Uniqueness of keys + texts
  const keys = new Set(); const texts = new Set();
  all.forEach(function (w) { keys.add(w.key); texts.add(w.text); });
  assert(keys.size === all.length, 'כל ה-keys ייחודיים');
  assert(texts.size === all.length, 'כל ה-texts ייחודיים');
}

// --------------------------------------------------------
header('3. decomposeWord — אותיות + ניקוד + דגש');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  // בַּת = ב+patach+dagesh, ת
  const d1 = WA.decomposeWord('בַּת');
  assert(d1.length === 2, 'בַּת = 2 חלקים');
  assert(d1[0].letter === 'ב', 'חלק 1 = ב');
  assert(d1[0].dagesh === true, 'חלק 1 דגש = true');
  assert(d1[0].niqud.length > 0, 'חלק 1 ניקוד קיים');
  assert(d1[1].letter === 'ת', 'חלק 2 = ת');
  assert(d1[1].dagesh === false, 'חלק 2 דגש = false');
  // בַּיִת = ב+patach+dagesh, י+hiriq, ת
  const d2 = WA.decomposeWord('בַּיִת');
  assert(d2.length === 3, 'בַּיִת = 3 חלקים');
  assert(d2[0].dagesh === true, 'ב-בַּיִת דגש = true');
  // מילה ריקה
  assert(WA.decomposeWord('').length === 0, 'מילה ריקה → []');
  assert(WA.decomposeWord(null).length === 0, 'null → []');
}

// --------------------------------------------------------
header('4. stripNiqud + countBaseLetters + classifyWordLevel');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  assert(WA.stripNiqud('בַּת') === 'בת', 'stripNiqud(בַּת) = בת');
  assert(WA.stripNiqud('בַּיִת') === 'בית', 'stripNiqud(בַּיִת) = בית');
  assert(WA.countBaseLetters('בַּת') === 2, 'countBaseLetters(בַּת) = 2');
  assert(WA.countBaseLetters('בַּיִת') === 3, 'countBaseLetters(בַּיִת) = 3');
  assert(WA.countBaseLetters('תַּפּוּז') === 4, 'countBaseLetters(תַּפּוּז) = 4');
  assert(WA.classifyWordLevel('בַּת') === '2cv', 'בַּת → 2cv');
  assert(WA.classifyWordLevel('בַּיִת') === '3cv', 'בַּיִת → 3cv');
  assert(WA.classifyWordLevel('תַּפּוּז') === '4cv', 'תַּפּוּז → 4cv');
  assert(WA.classifyWordLevel('מַתָּנָה') === '4cv', 'מַתָּנָה → 4cv');
}

// --------------------------------------------------------
header('5. validateBgdkptDagesh — ב/כ/פ דגש בתחילה');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  assert(WA.validateBgdkptDagesh('בַּת').ok === true, 'בַּת תקין');
  assert(WA.validateBgdkptDagesh('כַּף').ok === true, 'כַּף תקין');
  // בלי דגש — אזהרה
  assert(WA.validateBgdkptDagesh('בַת').ok === false, 'בַת (ללא דגש) → אזהרה');
  assert(WA.validateBgdkptDagesh('כַף').ok === false, 'כַף (ללא דגש) → אזהרה');
  // אותיות אחרות — לא רלוונטי
  assert(WA.validateBgdkptDagesh('יָד').ok === true, 'יָד (לא ב/כ/פ) תקין');
  assert(WA.validateBgdkptDagesh('').ok === false, 'מילה ריקה → false');
}

// --------------------------------------------------------
header('6. Every WORDS_* entry passes validation');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  const all = WA.getAllWords();
  let issuesCount = 0;
  all.forEach(function (w) {
    const v = WA.validateBgdkptDagesh(w.text);
    if (!v.ok) {
      console.error('    ⚠ ' + w.text + ': ' + v.errors.join(', '));
      issuesCount++;
    }
  });
  assert(issuesCount === 0, 'כל ' + all.length + ' המילים עוברות validation (0 אזהרות)');
}

// --------------------------------------------------------
header('7. Every word level matches its bucket');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  let bad = 0;
  WA.getWords('2cv').forEach(function (w) {
    if (WA.classifyWordLevel(w.text) !== '2cv') {
      console.error('    ⚠ ' + w.text + ' ב-2cv אבל classified כ-' + WA.classifyWordLevel(w.text));
      bad++;
    }
  });
  WA.getWords('3cv').forEach(function (w) {
    if (WA.classifyWordLevel(w.text) !== '3cv') {
      console.error('    ⚠ ' + w.text + ' ב-3cv אבל classified כ-' + WA.classifyWordLevel(w.text));
      bad++;
    }
  });
  WA.getWords('4cv').forEach(function (w) {
    if (WA.classifyWordLevel(w.text) !== '4cv') {
      console.error('    ⚠ ' + w.text + ' ב-4cv אבל classified כ-' + WA.classifyWordLevel(w.text));
      bad++;
    }
  });
  assert(bad === 0, 'כל המילים ב-level הנכון לפי letter_count');
}

// --------------------------------------------------------
header('8. wordKey + wordAudioKey + getWordByKey + getWordByText');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  const bat = WA.getWordByText('בַּת');
  assert(bat !== null, 'getWordByText(בַּת) מחזיר');
  assert(bat.key === 'bet-tav-bat', 'בַּת.key = bet-tav-bat');
  const byKey = WA.getWordByKey('bet-tav-bat');
  assert(byKey !== null && byKey.text === 'בַּת', 'getWordByKey roundtrip');
  assert(WA.wordAudioKey('בַּת') === 'word-bet-tav-bat', 'wordAudioKey(בַּת)');
  // wordKey לחישוב fallback
  const k = WA.wordKey('בַּיִת');
  assert(k === 'bet-yud-tav', 'wordKey(בַּיִת) = bet-yud-tav (3 letters)');
}

// --------------------------------------------------------
header('9. getWordsByLetter + getWordsForFamilySession');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  const beit = WA.getWordsByLetter('ב');
  assert(beit.length >= 3, 'getWordsByLetter(ב) ≥ 3 מילים');
  beit.forEach(function (w) {
    assert(w.first_letter === 'ב', 'כל מילה ב-ב פותחת ב-ב (' + w.text + ')');
  });
  const family = WA.getWordsForFamilySession('ב', 5);
  assert(family.length <= 5, 'familySession מחזיר עד 5 מילים');
  family.forEach(function (w) {
    assert(w.first_letter === 'ב', 'family.ב: ' + w.text);
    assert(typeof w.level === 'string', w.text + ' יש level');
  });
}

// --------------------------------------------------------
header('10. getTopWeakWords (BKT delegation)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  setupBKT({ 's1': [{ letter: 'ב', pKnown: 0.30 }, { letter: 'מ', pKnown: 0.45 }] });
  const WA = loadModule();
  const weak = WA.getTopWeakWords('s1', 3);
  assert(weak.length > 0, 'getTopWeakWords מחזיר תוצאות');
  assert(weak.length <= 3, '≤ n');
  weak.forEach(function (w) {
    assert(typeof w.source_letter_pKnown === 'number', w.text + ' יש source_letter_pKnown');
    assert(['ב','מ'].indexOf(w.first_letter) >= 0, w.text + ' first_letter ⊆ {ב,מ}');
  });
  // ללא BKT
  global.AvneiBKT = null;
  assert(WA.getTopWeakWords('s1', 3).length === 0, 'ללא BKT → []');
}

// --------------------------------------------------------
header('11. Targets + Freeze');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  // הוספה
  assert(WA.addTarget('s1', 'בַּת', 'teacher') === true, 'addTarget מצליחה');
  const targets = WA.getTargets('s1');
  assert(targets.length === 1, '1 target אחרי הוספה');
  assert(targets[0].text === 'בַּת', 'target text שמור');
  assert(targets[0].source === 'teacher', 'source שמור');
  assert(targets[0].first_letter === 'ב', 'first_letter שמור');
  // הוספה מוסיפה auto-freeze
  assert(WA.isFrozen('s1', 'בַּת') === true, 'הוספה → auto-freeze');
  // הסרה
  assert(WA.removeTarget('s1', 'בַּת') === true, 'removeTarget מצליחה');
  assert(WA.getTargets('s1').length === 0, '0 targets אחרי הסרה');
  // freeze ידני
  assert(WA.markFrozen('s1', 'יָד', 'handled') === true, 'markFrozen מצליחה');
  assert(WA.isFrozen('s1', 'יָד') === true, 'isFrozen=true אחרי markFrozen');
  const frozen = WA.getFrozen('s1');
  assert(frozen.length >= 1, '≥ 1 frozen entry');
  // sid לא קיים
  assert(WA.getTargets('s99').length === 0, 'sid לא קיים → []');
  assert(WA.isFrozen('s99', 'בַּת') === false, 'sid לא קיים → not frozen');
  // null/empty checks
  assert(WA.addTarget(null, 'בַּת') === false, 'addTarget(null sid) → false');
  assert(WA.addTarget('s1', '') === false, 'addTarget(empty text) → false');
}

// --------------------------------------------------------
header('12. JSON sync — data/island-05-words/*.json ↔ WORDS_*CV');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const WA = loadModule();
  const DATA_DIR = path.resolve(__dirname, '..', 'data', 'island-05-words');
  ['1', '2', '3'].forEach(function (n) {
    const f = path.join(DATA_DIR, 'words-level-' + n + '.json');
    assert(fs.existsSync(f), 'קובץ קיים: words-level-' + n + '.json');
    const json = JSON.parse(fs.readFileSync(f, 'utf-8'));
    assert(Array.isArray(json.words), 'level ' + n + ': words = array');
    const levels = ['2cv', '3cv', '4cv'];
    const expected = WA.getWords(levels[n - 1]);
    assert(json.words.length === expected.length,
      'level ' + n + ': JSON.words.length (' + json.words.length + ') === adapter.length (' + expected.length + ')');
    // sample first word match
    if (json.words.length > 0 && expected.length > 0) {
      const jsonTexts = json.words.map(function (w) { return w.text; }).sort();
      const adapterTexts = expected.map(function (w) { return w.text; }).sort();
      assert(JSON.stringify(jsonTexts) === JSON.stringify(adapterTexts),
        'level ' + n + ': כל הטקסטים זהים בין JSON ל-adapter');
    }
  });
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
