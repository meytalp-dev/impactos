#!/usr/bin/env node
// ============================================================================
// test-vowel-adapter.js — Vowel + CV Pair Adapter (אי 4 — אות-ניקוד-צליל)
// סוכן 29 · 29.5.2026
//
// בודק:
//   - API surface (constants + functions)
//   - VOWELS (9 פריטים, כולל קובוץ+שורוק) + getVowelById
//   - buildCV / parseCV / cvKey (round-trip, כולל שורוק=ו+דגש)
//   - getAllCVPairs (default 198, filtered by letters/vowels/books)
//   - getAnchorWord (seeded values + nulls)
//   - getTopWeakCVs (derived from BKT.getWeakestLetters, frozen filter)
//   - addTarget/removeTarget/getTargets (כולל auto-freeze on add)
//   - markFrozen/removeFrozen/isFrozen/getFrozen
//   - persistence דרך localStorage mock
//   - edge cases: missing sid · invalid letter · invalid vowel
//
// הרצה: node scripts/test-vowel-adapter.js
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
  global.AvneiBKT = null;
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'vowel-adapter.js');
  delete require.cache[p];
}

function loadModule() {
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

console.log('\n📋 Vowel Adapter — Test Suite');
console.log('==================================================');

// --------------------------------------------------------
header('1. API surface + constants');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();
  assert(typeof VA.getVowels === 'function', 'getVowels נחשפת');
  assert(typeof VA.getVowelById === 'function', 'getVowelById נחשפת');
  assert(typeof VA.buildCV === 'function', 'buildCV נחשפת');
  assert(typeof VA.parseCV === 'function', 'parseCV נחשפת');
  assert(typeof VA.cvKey === 'function', 'cvKey נחשפת');
  assert(typeof VA.getAllCVPairs === 'function', 'getAllCVPairs נחשפת');
  assert(typeof VA.getAnchorWord === 'function', 'getAnchorWord נחשפת');
  assert(typeof VA.getTopWeakCVs === 'function', 'getTopWeakCVs נחשפת');
  assert(typeof VA.addTarget === 'function', 'addTarget נחשפת');
  assert(typeof VA.removeTarget === 'function', 'removeTarget נחשפת');
  assert(typeof VA.getTargets === 'function', 'getTargets נחשפת');
  assert(typeof VA.markFrozen === 'function', 'markFrozen נחשפת');
  assert(typeof VA.removeFrozen === 'function', 'removeFrozen נחשפת');
  assert(typeof VA.isFrozen === 'function', 'isFrozen נחשפת');
  assert(typeof VA.getFrozen === 'function', 'getFrozen נחשפת');
  assert(VA.TARGETS_KEY === 'avnei-teacher-vowel-targets-v1', 'TARGETS_KEY');
  assert(VA.FREEZE_KEY === 'avnei-teacher-vowel-freeze-v1', 'FREEZE_KEY');
  assert(VA.TARGET_DURATION_DAYS === 14, 'TARGET_DURATION_DAYS = 14');
  assert(VA.FREEZE_DURATION_DAYS === 3, 'FREEZE_DURATION_DAYS = 3');
  assert(Array.isArray(VA.ALL_HEBREW_LETTERS_22) && VA.ALL_HEBREW_LETTERS_22.length === 22,
    'ALL_HEBREW_LETTERS_22 = 22 פריטים');
}

// --------------------------------------------------------
header('2. VOWELS — 9 פריטים');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();
  const vs = VA.getVowels();
  assert(Array.isArray(vs) && vs.length === 9, '9 vowels');
  const ids = vs.map(function (v) { return v.id; });
  ['kamatz','patach','shva','hiriq','holam','tzere','segol','kubutz','shuruk'].forEach(function (id) {
    assert(ids.indexOf(id) >= 0, 'מכיל ' + id);
  });
  // הכל יחד עם שדות חובה
  vs.forEach(function (v) {
    if (!v.id || !v.displayHe || !v.symbol || !v.phoneme || typeof v.book !== 'number') {
      assert(false, 'vowel ' + v.id + ' חסר שדה');
    }
  });

  const k = VA.getVowelById('kamatz');
  assert(k && k.symbol === 'ָ' && k.phoneme === '/a/', 'getVowelById(kamatz) → ָ /a/');
  const kb = VA.getVowelById('kubutz');
  assert(kb && kb.symbol === 'ֻ' && kb.phoneme === '/u/' && kb.book === 5, 'getVowelById(kubutz) → ֻ /u/ book 5');
  const sh = VA.getVowelById('shuruk');
  assert(sh && sh.symbol === 'וּ' && sh.phoneme === '/u/' && sh.book === 5, 'getVowelById(shuruk) → וּ /u/ book 5');
  assert(VA.getVowelById('nonsense') === null, 'getVowelById(unknown) → null');
}

// --------------------------------------------------------
header('3. buildCV / parseCV / cvKey');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  assert(VA.buildCV('מ', 'patach') === 'מַ', 'buildCV(מ, patach) = מַ');
  assert(VA.buildCV('ל', 'tzere') === 'לֵ', 'buildCV(ל, tzere) = לֵ');
  assert(VA.buildCV('ש', 'segol') === 'שֶ', 'buildCV(ש, segol) = שֶ');
  assert(VA.buildCV('ק', 'kamatz') === 'קָ', 'buildCV(ק, kamatz) = קָ');
  assert(VA.buildCV('ת', 'shva') === 'תְ', 'buildCV(ת, shva) = תְ');

  // ב/כ/פ — חובה דגש קל (אחרת AvriNeural מבטא /v·x·f/, ראה
  // reference-hebrew-bgd-kpt-dagesh-rule). נוסף 30.5.2026.
  assert(VA.buildCV('ב', 'patach') === 'בַּ',  'buildCV(ב, patach) = בַּ (דגש)');
  assert(VA.buildCV('ב', 'kamatz') === 'בָּ',  'buildCV(ב, kamatz) = בָּ (דגש)');
  assert(VA.buildCV('ב', 'shva')   === 'בְּ',  'buildCV(ב, shva) = בְּ (דגש)');
  assert(VA.buildCV('כ', 'patach') === 'כַּ',  'buildCV(כ, patach) = כַּ (דגש)');
  assert(VA.buildCV('כ', 'hiriq')  === 'כִּ',  'buildCV(כ, hiriq) = כִּ (דגש)');
  assert(VA.buildCV('פ', 'patach') === 'פַּ',  'buildCV(פ, patach) = פַּ (דגש)');
  assert(VA.buildCV('פ', 'tzere')  === 'פֵּ',  'buildCV(פ, tzere) = פֵּ (דגש)');
  // אותיות אחרות לא משתנות (ג/ד/ת קלות לא רלוונטי בעברית מודרנית)
  assert(VA.buildCV('ד', 'patach') === 'דַ',  'buildCV(ד, patach) = דַ (ללא דגש)');
  assert(VA.buildCV('ג', 'kamatz') === 'גָ',  'buildCV(ג, kamatz) = גָ (ללא דגש)');

  // קובוץ — combining mark רגיל (דפוס letter+vowel+dagesh ל-ב/כ/פ)
  assert(VA.buildCV('מ', 'kubutz') === 'מֻ',   'buildCV(מ, kubutz) = מֻ');
  assert(VA.buildCV('ב', 'kubutz') === 'בֻּ',  'buildCV(ב, kubutz) = בֻּ (דגש)');
  // שורוק — ו+דגש; הדגש הקל של ב/כ/פ על העיצור לפני ה-ו (5d1 5bc 5d5 5bc)
  assert(VA.buildCV('ל', 'shuruk') === 'לוּ',  'buildCV(ל, shuruk) = לוּ');
  assert(VA.buildCV('מ', 'shuruk') === 'מוּ',  'buildCV(מ, shuruk) = מוּ');
  assert(VA.buildCV('ב', 'shuruk') === 'ב' + 'ּ' + 'ו' + 'ּ', 'buildCV(ב, shuruk) = בּוּ (דגש על ב, לא כפול על ו)');
  assert(VA.buildCV('ב', 'shuruk').length === 4, 'בּוּ = 4 code units (ב+דגש+ו+דגש)');
  // Constants חשופים
  assert(Array.isArray(VA.BKP_LETTERS) && VA.BKP_LETTERS.length === 3, 'BKP_LETTERS = [ב,כ,פ]');
  assert(VA.DAGESH === 'ּ', 'DAGESH = U+05BC');

  // invalid inputs
  assert(VA.buildCV('Z', 'patach') === '', 'buildCV(Z, patach) → "" (אות לא חוקית)');
  assert(VA.buildCV('מ', 'bogus') === '', 'buildCV(מ, bogus) → "" (vowel לא חוקי)');
  assert(VA.buildCV(null, null) === '', 'buildCV(null,null) → ""');

  // key + parse round trip
  assert(VA.cvKey('מ', 'patach') === 'מ:patach', 'cvKey(מ, patach) = "מ:patach"');
  const parsed = VA.parseCV('מ:patach');
  assert(parsed && parsed.letter === 'מ' && parsed.vowelId === 'patach', 'parseCV → {letter, vowelId}');
  assert(VA.parseCV('garbage') === null, 'parseCV(garbage) → null');
  assert(VA.parseCV('Z:patach') === null, 'parseCV(Z:patach) → null');
  assert(VA.parseCV('מ:bogus') === null, 'parseCV(מ:bogus) → null');
  assert(VA.parseCV(null) === null, 'parseCV(null) → null');
}

// --------------------------------------------------------
header('4. getAllCVPairs — default + filters');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  const all = VA.getAllCVPairs();
  assert(all.length === 22 * 9, '22 × 9 = 198 CV pairs');

  // Each entry has required fields
  const sample = all[0];
  assert(sample.letter && sample.vowelId && sample.cv && sample.key,
    'entry: { letter, vowelId, cv, key, anchor_word }');
  assert('anchor_word' in sample, 'anchor_word field exists (יכול להיות null)');

  // filter by letters
  const onlyMem = VA.getAllCVPairs({ letters: ['מ'] });
  assert(onlyMem.length === 9, 'filter letters=[מ] → 9 entries');
  assert(onlyMem.every(function (e) { return e.letter === 'מ'; }), 'כולן עם מ');

  // filter by vowels
  const onlyKamatz = VA.getAllCVPairs({ vowels: ['kamatz'] });
  assert(onlyKamatz.length === 22, 'filter vowels=[kamatz] → 22 entries');
  assert(onlyKamatz.every(function (e) { return e.vowelId === 'kamatz'; }), 'כולן עם kamatz');

  // filter by books
  const onlyBook2 = VA.getAllCVPairs({ books: [2] });
  // book 2 = קמץ + פתח + שווא = 3 vowels × 22 = 66
  assert(onlyBook2.length === 22 * 3, 'filter books=[2] → 66 entries');
  const bookVowels = new Set(onlyBook2.map(function (e) { return e.vowelId; }));
  assert(bookVowels.has('kamatz') && bookVowels.has('patach') && bookVowels.has('shva'),
    'books=[2] → רק קמץ+פתח+שווא');

  // book 5 = קובוץ + שורוק = 2 vowels × 22 = 44
  const onlyBook5 = VA.getAllCVPairs({ books: [5] });
  assert(onlyBook5.length === 22 * 2, 'filter books=[5] → 44 entries');
  const book5Vowels = new Set(onlyBook5.map(function (e) { return e.vowelId; }));
  assert(book5Vowels.has('kubutz') && book5Vowels.has('shuruk') && book5Vowels.size === 2,
    'books=[5] → רק קובוץ+שורוק');

  // combined letters + vowels
  const combo = VA.getAllCVPairs({ letters: ['מ', 'ב'], vowels: ['kamatz', 'patach'] });
  assert(combo.length === 4, 'letters=[מ,ב] × vowels=[kamatz,patach] = 4');
}

// --------------------------------------------------------
header('5. getAnchorWord — seeded + missing');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  assert(VA.getAnchorWord('מ', 'patach') === 'מַטֶּה', 'getAnchorWord(מ, patach) = מַטֶּה');
  assert(VA.getAnchorWord('ת', 'patach') === 'תַּפּוּז', 'getAnchorWord(ת, patach) = תַּפּוּז');
  assert(VA.getAnchorWord('ק', 'patach') === 'קַר', 'getAnchorWord(ק, patach) = קַר');
  assert(VA.getAnchorWord('ב', 'shva') === 'בְּרֵכָה', 'getAnchorWord(ב, shva) = בְּרֵכָה');
  // /u/ — קובוץ + שורוק (נוספו 4.7.2026, מקור: vocab-bank/questions-grade1)
  assert(VA.getAnchorWord('ב', 'kubutz') === 'בֻּבָּה', 'getAnchorWord(ב, kubutz) = בֻּבָּה');
  assert(VA.getAnchorWord('ב', 'shuruk') === 'בּוּעוֹת', 'getAnchorWord(ב, shuruk) = בּוּעוֹת');
  assert(VA.getAnchorWord('ת', 'kubutz') === 'תֻּכִּי', 'getAnchorWord(ת, kubutz) = תֻּכִּי');
  assert(VA.getAnchorWord('ת', 'shuruk') === 'תּוּת', 'getAnchorWord(ת, shuruk) = תּוּת');
  assert(VA.getAnchorWord('ל', 'shuruk') === 'לוּל', 'getAnchorWord(ל, shuruk) = לוּל (הועבר מ-holam)');
  assert(VA.getAnchorWord('ל', 'holam') === 'לֹא', 'getAnchorWord(ל, holam) = לֹא (אושר מיטל 5.7.2026)');
  // עוגנים שמולאו 5.7.2026 (דוח סוכן-מומחה, אישור מיטל)
  assert(VA.getAnchorWord('ר', 'kamatz') === 'רָחוֹק', 'getAnchorWord(ר, kamatz) = רָחוֹק');
  assert(VA.getAnchorWord('מ', 'shva') === 'מְעִיל', 'getAnchorWord(מ, shva) = מְעִיל');
  assert(VA.getAnchorWord('ל', 'kubutz') === null, 'getAnchorWord(ל, kubutz) = null (ASK)');
  // invalid
  assert(VA.getAnchorWord('Z', 'patach') === null, 'getAnchorWord(Z, patach) = null');
  assert(VA.getAnchorWord('מ', 'bogus') === null, 'getAnchorWord(מ, bogus) = null');
}

// --------------------------------------------------------
header('6. getTopWeakCVs — נגזר מ-BKT');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  // BKT mock: s1 חלשה ב-ר ו-ק, s2 ריק
  setupBKT({
    s1: [
      { letter: 'ר', pKnown: 0.32 },
      { letter: 'ק', pKnown: 0.45 },
      { letter: 'מ', pKnown: 0.55 },
    ],
    s2: [],
  });
  const VA = loadModule();

  const weak3 = VA.getTopWeakCVs('s1', 3);
  assert(weak3.length === 3, '3 CV חלשים');
  // הראשון אמור להיות מבוסס על ר (החלשה ביותר)
  assert(weak3[0].letter === 'ר', 'הראשון מבוסס על ר');
  // CV pairs רלוונטיים: 7 vowels × 3 letters בערך, מנותקים
  assert(weak3.every(function (c) { return c.cv && c.key && c.vowelId; }), 'כל פריט עם cv+key+vowelId');

  // sid ריק
  const noneSid = VA.getTopWeakCVs('', 3);
  assert(noneSid.length === 0, 'sid ריק → []');

  // sid לא קיים בBKT
  const noneStud = VA.getTopWeakCVs('s2', 3);
  assert(noneStud.length === 0, 'sid ללא דאטה → []');

  // n מוגדר — קצוץ
  const weak1 = VA.getTopWeakCVs('s1', 1);
  assert(weak1.length === 1, 'n=1 → 1 פריט');

  // BKT לא קיים
  global.AvneiBKT = null;
  const VA2 = loadModule();
  assert(VA2.getTopWeakCVs('s1', 3).length === 0, 'ללא BKT → []');
}

// --------------------------------------------------------
header('7. getTopWeakCVs — filter by vowels + skip frozen');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  setupBKT({
    s1: [
      { letter: 'ר', pKnown: 0.30 },
    ],
  });
  const VA = loadModule();

  // ביקש רק 2 vowels — שניהם של ר
  const filtered = VA.getTopWeakCVs('s1', 5, { vowels: ['kamatz', 'patach'] });
  assert(filtered.length === 2, 'limit 5, רק 2 vowels תקפים → 2 פריטים');
  assert(filtered.every(function (e) {
    return e.vowelId === 'kamatz' || e.vowelId === 'patach';
  }), 'כל ה-vowels בסיבונט');

  // הקפא אחד
  assert(VA.markFrozen('s1', 'ר', 'kamatz') === true, 'הקפאה הצליחה');
  const filtered2 = VA.getTopWeakCVs('s1', 5, { vowels: ['kamatz', 'patach'] });
  assert(filtered2.length === 1, 'אחרי הקפאה — 1');
  assert(filtered2[0].vowelId === 'patach', 'נשאר רק patach');
}

// --------------------------------------------------------
header('8. Targets — add / get / remove (כולל auto-freeze)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  assert(VA.getTargets('s1').length === 0, 'targets ריקים בהתחלה');
  assert(VA.addTarget('s1', 'מ', 'patach') === true, 'addTarget מצליח');
  const t1 = VA.getTargets('s1');
  assert(t1.length === 1, '1 target');
  assert(t1[0].letter === 'מ' && t1[0].vowelId === 'patach', 'מ + patach');
  assert(t1[0].cv === 'מַ', 'cv = מַ');
  assert(t1[0].key === 'מ:patach', 'key מתועד');

  // auto-freeze בעקבות add
  assert(VA.isFrozen('s1', 'מ', 'patach') === true, 'הוקפא אוטומטית');

  // dedup: שוב אותה pair → overwrite
  assert(VA.addTarget('s1', 'מ', 'patach') === true, 'add חוזר על אותה pair (overwrite)');
  assert(VA.getTargets('s1').length === 1, 'אין דופלקציה');

  // pair שונה
  assert(VA.addTarget('s1', 'ב', 'shva') === true, 'add CV אחר');
  assert(VA.getTargets('s1').length === 2, '2 targets');

  // remove
  assert(VA.removeTarget('s1', 'מ', 'patach') === true, 'remove מצליח');
  assert(VA.getTargets('s1').length === 1, 'נשאר 1');
  assert(VA.getTargets('s1')[0].letter === 'ב', 'נשאר ב');

  // remove שלא קיים
  assert(VA.removeTarget('s1', 'מ', 'patach') === false, 'remove שלא קיים → false');

  // edge cases
  assert(VA.addTarget('', 'מ', 'patach') === false, 'sid ריק → false');
  assert(VA.addTarget('s2', 'Z', 'patach') === false, 'אות לא חוקית → false');
  assert(VA.addTarget('s2', 'מ', 'bogus') === false, 'vowel לא חוקי → false');
}

// --------------------------------------------------------
header('9. Freeze — mark / get / isFrozen / remove');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  assert(VA.getFrozen('s1').length === 0, 'frozen ריק בהתחלה');
  assert(VA.isFrozen('s1', 'מ', 'patach') === false, 'isFrozen לפני mark → false');

  assert(VA.markFrozen('s1', 'מ', 'patach', 'teacher-handled') === true, 'markFrozen מצליח');
  assert(VA.isFrozen('s1', 'מ', 'patach') === true, 'isFrozen אחרי mark → true');
  assert(VA.getFrozen('s1').length === 1, 'frozen = 1 פריט');

  // remove frozen
  assert(VA.removeFrozen('s1', 'מ', 'patach') === true, 'removeFrozen מצליח');
  assert(VA.isFrozen('s1', 'מ', 'patach') === false, 'isFrozen אחרי remove → false');
  assert(VA.getFrozen('s1').length === 0, 'frozen ריק');

  // edge: invalid
  assert(VA.markFrozen('s2', 'Z', 'patach') === false, 'markFrozen אות לא חוקית → false');
  assert(VA.isFrozen('', 'מ', 'patach') === false, 'isFrozen sid ריק → false');
}

// --------------------------------------------------------
header('10. Persistence — localStorage');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  VA.addTarget('s1', 'מ', 'patach');
  VA.markFrozen('s1', 'ב', 'shva');

  const rawT = global.localStorage.getItem(VA.TARGETS_KEY);
  const rawF = global.localStorage.getItem(VA.FREEZE_KEY);
  assert(typeof rawT === 'string' && rawT.indexOf('מ:patach') >= 0, 'נשמר ב-TARGETS_KEY');
  assert(typeof rawF === 'string', 'נשמר ב-FREEZE_KEY');

  const parsedT = JSON.parse(rawT);
  assert(parsedT.s1['מ:patach'].source === 'teacher-send', 'source נשמר');
  assert(typeof parsedT.s1['מ:patach'].addedAt === 'string', 'addedAt ISO');
  assert(typeof parsedT.s1['מ:patach'].expiresAt === 'string', 'expiresAt ISO');
}

// --------------------------------------------------------
header('11. Phoneme groups (chalupa B — מ:patach + מ:kamatz = /a/)');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  // getPhonemeGroup
  assert(VA.getPhonemeGroup('patach') === 'a', 'patach → a');
  assert(VA.getPhonemeGroup('kamatz') === 'a', 'kamatz → a');
  assert(VA.getPhonemeGroup('hiriq')  === 'i', 'hiriq → i');
  assert(VA.getPhonemeGroup('holam')  === 'o', 'holam → o');
  assert(VA.getPhonemeGroup('tzere')  === 'e', 'tzere → e');
  assert(VA.getPhonemeGroup('segol')  === 'e', 'segol → e');
  assert(VA.getPhonemeGroup('shva')   === 'shwa', 'shva → shwa');
  assert(VA.getPhonemeGroup('kubutz') === 'u', 'kubutz → u');
  assert(VA.getPhonemeGroup('shuruk') === 'u', 'shuruk → u');
  assert(VA.getPhonemeGroup('bogus')  === null, 'unknown → null');

  // getVowelsInGroup
  const groupA = VA.getVowelsInGroup('a').map(function (v) { return v.id; }).sort();
  assert(groupA.length === 2 && groupA[0] === 'kamatz' && groupA[1] === 'patach',
    'group a = kamatz + patach');
  const groupE = VA.getVowelsInGroup('e').map(function (v) { return v.id; }).sort();
  assert(groupE.length === 2 && groupE[0] === 'segol' && groupE[1] === 'tzere',
    'group e = tzere + segol');
  assert(VA.getVowelsInGroup('i').length === 1, 'group i = hiriq בלבד');
  assert(VA.getVowelsInGroup('o').length === 1, 'group o = holam בלבד');
  assert(VA.getVowelsInGroup('shwa').length === 1, 'group shwa = shva בלבד');
  const groupU = VA.getVowelsInGroup('u').map(function (v) { return v.id; }).sort();
  assert(groupU.length === 2 && groupU[0] === 'kubutz' && groupU[1] === 'shuruk',
    'group u = kubutz + shuruk');

  // getSisterVowels
  const sistersPatach = VA.getSisterVowels('patach');
  assert(sistersPatach.length === 1 && sistersPatach[0].id === 'kamatz', 'patach sister = kamatz');
  const sistersKamatz = VA.getSisterVowels('kamatz');
  assert(sistersKamatz.length === 1 && sistersKamatz[0].id === 'patach', 'kamatz sister = patach');
  const sistersTzere = VA.getSisterVowels('tzere');
  assert(sistersTzere.length === 1 && sistersTzere[0].id === 'segol', 'tzere sister = segol');
  const sistersHiriq = VA.getSisterVowels('hiriq');
  assert(sistersHiriq.length === 0, 'hiriq sister = [] (solo)');
  const sistersKubutz = VA.getSisterVowels('kubutz');
  assert(sistersKubutz.length === 1 && sistersKubutz[0].id === 'shuruk', 'kubutz sister = shuruk');
  const sistersShuruk = VA.getSisterVowels('shuruk');
  assert(sistersShuruk.length === 1 && sistersShuruk[0].id === 'kubutz', 'shuruk sister = kubutz');
  const sistersBogus = VA.getSisterVowels('bogus');
  assert(sistersBogus.length === 0, 'unknown sister = []');
}

// --------------------------------------------------------
header('12. CV audio key naming + letter_key');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const VA = loadModule();

  // letterKey
  assert(VA.letterKey('מ') === 'mem', 'letterKey(מ) = mem');
  assert(VA.letterKey('ב') === 'bet', 'letterKey(ב) = bet');
  assert(VA.letterKey('ש') === 'shin', 'letterKey(ש) = shin');
  assert(VA.letterKey('Z') === null, 'letterKey(Z) = null');

  // cvAudioKey
  assert(VA.cvAudioKey('מ', 'patach') === 'cv-mem-patach', 'cvAudioKey(מ, patach)');
  assert(VA.cvAudioKey('ב', 'shva') === 'cv-bet-shva', 'cvAudioKey(ב, shva)');
  assert(VA.cvAudioKey('ת', 'hiriq') === 'cv-tav-hiriq', 'cvAudioKey(ת, hiriq)');
  assert(VA.cvAudioKey('Z', 'patach') === null, 'cvAudioKey(Z, patach) = null');
  assert(VA.cvAudioKey('מ', 'bogus') === null, 'cvAudioKey(מ, bogus) = null');

  // LETTER_KEY constant exposed
  assert(typeof VA.LETTER_KEY === 'object', 'LETTER_KEY נחשף');
  assert(Object.keys(VA.LETTER_KEY).length === 22, 'LETTER_KEY = 22 פריטים');

  // PHONEME_GROUP_HE
  assert(VA.PHONEME_GROUP_HE && VA.PHONEME_GROUP_HE.a === 'פתח-קמץ', 'PHONEME_GROUP_HE.a');
  assert(VA.PHONEME_GROUP_HE.e === 'צירי-סגול', 'PHONEME_GROUP_HE.e');
  assert(VA.PHONEME_GROUP_HE.u === 'קובוץ-שורוק', 'PHONEME_GROUP_HE.u');

  // cvAudioKey לתנועות החדשות
  assert(VA.cvAudioKey('מ', 'kubutz') === 'cv-mem-kubutz', 'cvAudioKey(מ, kubutz)');
  assert(VA.cvAudioKey('ב', 'shuruk') === 'cv-bet-shuruk', 'cvAudioKey(ב, shuruk)');
}

// --------------------------------------------------------
console.log('\n==================================================');
console.log('✓ ' + pass + ' passed');
if (fail > 0) console.error('✗ ' + fail + ' failed');
else console.log('🎉 All Vowel Adapter tests passed');
