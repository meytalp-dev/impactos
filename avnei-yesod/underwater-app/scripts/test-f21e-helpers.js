#!/usr/bin/env node
// ============================================================================
// test-f21e-helpers.js — F.21E helpers (Action Dashboard)
// סוכן קוד F.21E · 29.5.2026
//
// בודק:
//   - API surface
//   - getTopWeakLetters: empty · no data · n=3 · ordering
//   - groupLetterOverlap: 3+ · <3 · empty · single
//   - getGreetingByHour: 4 buckets לפי spec §5.2
//   - buildHeroSentence: 4 rules §9.4 + priority MOY≥2
//   - isSameCalendarDay · startOfWeekTimestamp (Sunday)
//   - action log: append · remove · dedupe · today · week counts
//   - statusForEntry: today / week / none
//   - logEntryKey: canonical format
//   - patternToSimpleHe
//   - reasonByEvidence: epa / moy / combined / empty
//   - moyAlertSimpleHe
//
// הרצה: node scripts/test-f21e-helpers.js (מתיקיית underwater-app)
// יוצא ב-exit 0 אם הכל ירוק, אחרת 1.
// ============================================================================

'use strict';

const path = require('path');

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

// localStorage mock — store + get + set + clear + length
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
  global.AvneiBKT = null;
  global.localStorage = null;
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'f21e-helpers.js');
  delete require.cache[p];
}

function setupBKT(weakestByStudent) {
  global.AvneiBKT = {
    getWeakestLetters: function (sid, n) {
      const list = weakestByStudent && weakestByStudent[sid];
      if (!Array.isArray(list)) return [];
      return list.slice(0, n || 3);
    },
    ALL_HEBREW_LETTERS_22: ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
                            'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת']
  };
}

function loadHelpers() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'f21e-helpers.js');
  delete require.cache[p];
  return require(p);
}

// ----------------------------------------------------------------------------
// Runner
// ----------------------------------------------------------------------------
let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}
function header(t) { console.log('\n=== ' + t + ' ==='); }

console.log('\n📋 F.21E Helpers — Test Suite');
console.log('==================================================');

// ----------------------------------------------------------------------------
// בלוק 1 — API surface
// ----------------------------------------------------------------------------
header('1. API surface');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();
  assert(typeof H.getTopWeakLetters === 'function', 'getTopWeakLetters() נחשפת');
  assert(typeof H.groupLetterOverlap === 'function', 'groupLetterOverlap() נחשפת');
  assert(typeof H.getGreetingByHour === 'function', 'getGreetingByHour() נחשפת');
  assert(typeof H.buildHeroSentence === 'function', 'buildHeroSentence() נחשפת');
  assert(typeof H.isSameCalendarDay === 'function', 'isSameCalendarDay() נחשפת');
  assert(typeof H.startOfWeekTimestamp === 'function', 'startOfWeekTimestamp() נחשפת');
  assert(typeof H.getActionLog === 'function', 'getActionLog() נחשפת');
  assert(typeof H.appendActionLog === 'function', 'appendActionLog() נחשפת');
  assert(typeof H.removeActionLog === 'function', 'removeActionLog() נחשפת');
  assert(typeof H.countCompletedToday === 'function', 'countCompletedToday() נחשפת');
  assert(typeof H.countCompletedThisWeek === 'function', 'countCompletedThisWeek() נחשפת');
  assert(typeof H.statusForEntry === 'function', 'statusForEntry() נחשפת');
  assert(typeof H.logEntryKey === 'function', 'logEntryKey() נחשפת');
  assert(typeof H.patternToSimpleHe === 'function', 'patternToSimpleHe() נחשפת');
  assert(typeof H.reasonByEvidence === 'function', 'reasonByEvidence() נחשפת');
  assert(typeof H.moyAlertSimpleHe === 'function', 'moyAlertSimpleHe() נחשפת');
  assert(H.ACTION_LOG_KEY === 'avnei-action-log-v1', 'ACTION_LOG_KEY = avnei-action-log-v1');
}

// ----------------------------------------------------------------------------
// בלוק 2 — getTopWeakLetters
// ----------------------------------------------------------------------------
header('2. getTopWeakLetters — empty / data / ordering');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  // אין BKT
  let H = loadHelpers();
  assert(Array.isArray(H.getTopWeakLetters('s1')) && H.getTopWeakLetters('s1').length === 0,
         'אין BKT → []');

  // sid ריק
  setupBKT({ s1: [{ letter: 'מ', pKnown: 0.2 }] });
  H = loadHelpers();
  assert(H.getTopWeakLetters(null).length === 0, 'sid=null → []');
  assert(H.getTopWeakLetters('').length === 0, 'sid=ריק → []');

  // אין דאטה לתלמיד
  assert(H.getTopWeakLetters('unknown').length === 0, 'תלמיד.ה ללא דאטה → []');

  // 1 אות
  const r1 = H.getTopWeakLetters('s1');
  assert(r1.length === 1 && r1[0] === 'מ', '1 אות מוחזרת כתו (לא object)');

  // n=3 mocked
  setupBKT({
    s2: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ר', pKnown: 0.3 },
      { letter: 'ל', pKnown: 0.4 },
      { letter: 'ח', pKnown: 0.5 }
    ]
  });
  H = loadHelpers();
  const r2 = H.getTopWeakLetters('s2', 3);
  assert(r2.length === 3, 'n=3 → 3 אותיות');
  assert(r2[0] === 'מ' && r2[1] === 'ש' && r2[2] === 'ר',
         'סדר נשמר (mock כבר מסודר עולה)');

  // ברירת מחדל n=3
  const r3 = H.getTopWeakLetters('s2');
  assert(r3.length === 3, 'ברירת מחדל n=3');

  // n=5 → מחזיר 5
  const r4 = H.getTopWeakLetters('s2', 5);
  assert(r4.length === 5, 'n=5 → 5 אותיות');

  // throw — מטופל ב-try/catch
  global.AvneiBKT = {
    getWeakestLetters: function () { throw new Error('mock'); }
  };
  H = loadHelpers();
  assert(H.getTopWeakLetters('any').length === 0, 'BKT throw → [] (לא קורס)');
}

// ----------------------------------------------------------------------------
// בלוק 3 — groupLetterOverlap
// ----------------------------------------------------------------------------
header('3. groupLetterOverlap — intersection logic');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();

  // אין תלמידים
  let H = loadHelpers();
  assert(H.groupLetterOverlap([]).length === 0, '[] → []');
  assert(H.groupLetterOverlap(null).length === 0, 'null → []');

  // תלמידים ללא דאטה
  setupBKT({});
  H = loadHelpers();
  assert(H.groupLetterOverlap(['s1', 's2', 's3']).length === 0,
         'תלמידים ללא דאטה → []');

  // single student
  setupBKT({
    s1: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ר', pKnown: 0.3 }
    ]
  });
  H = loadHelpers();
  // single student → overlap of [self] = self; ≥3 → returns self
  const r1 = H.groupLetterOverlap(['s1']);
  assert(r1.length === 3, 'תלמיד.ה יחיד.ה עם ≥3 → 3 אותיות (intersect של עצמו)');

  // overlap >= 3
  setupBKT({
    s1: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ר', pKnown: 0.3 },
      { letter: 'ל', pKnown: 0.4 },
      { letter: 'ח', pKnown: 0.5 }
    ],
    s2: [
      { letter: 'מ', pKnown: 0.15 },
      { letter: 'ש', pKnown: 0.25 },
      { letter: 'ר', pKnown: 0.35 },
      { letter: 'ק', pKnown: 0.45 },
      { letter: 'נ', pKnown: 0.55 }
    ],
    s3: [
      { letter: 'מ', pKnown: 0.05 },
      { letter: 'ש', pKnown: 0.15 },
      { letter: 'ר', pKnown: 0.25 },
      { letter: 'ת', pKnown: 0.35 },
      { letter: 'ע', pKnown: 0.45 }
    ]
  });
  H = loadHelpers();
  const r2 = H.groupLetterOverlap(['s1', 's2', 's3']);
  assert(r2.length === 3, 'overlap של 3 ב-3 תלמידים → 3');
  assert(r2.indexOf('מ') !== -1 && r2.indexOf('ש') !== -1 && r2.indexOf('ר') !== -1,
         'האותיות הנכונות: מ ש ר');

  // overlap < 3 → drop
  setupBKT({
    s1: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ר', pKnown: 0.3 },
      { letter: 'ל', pKnown: 0.4 },
      { letter: 'ח', pKnown: 0.5 }
    ],
    s2: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ק', pKnown: 0.3 },
      { letter: 'נ', pKnown: 0.4 },
      { letter: 'ת', pKnown: 0.5 }
    ]
  });
  H = loadHelpers();
  const r3 = H.groupLetterOverlap(['s1', 's2']);
  assert(r3.length === 0, 'overlap = 2 (פחות מ-3) → []');

  // תלמיד אחד בלי דאטה — כל ה-overlap נופל
  setupBKT({
    s1: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ר', pKnown: 0.3 }
    ],
    s2: [
      { letter: 'מ', pKnown: 0.1 },
      { letter: 'ש', pKnown: 0.2 },
      { letter: 'ר', pKnown: 0.3 }
    ]
    // s3 חסר
  });
  H = loadHelpers();
  assert(H.groupLetterOverlap(['s1', 's2', 's3']).length === 0,
         'תלמיד.ה ללא דאטה בקבוצה → [] (כל הקבוצה נופלת)');
}

// ----------------------------------------------------------------------------
// בלוק 4 — getGreetingByHour
// ----------------------------------------------------------------------------
header('4. getGreetingByHour — 4 buckets לפי spec §5.2');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();
  // 05:00-11:00 = בוקר טוב
  assert(H.getGreetingByHour(5)  === 'בוקר טוב',    '5  → בוקר טוב');
  assert(H.getGreetingByHour(8)  === 'בוקר טוב',    '8  → בוקר טוב');
  assert(H.getGreetingByHour(10) === 'בוקר טוב',    '10 → בוקר טוב (תחתון)');
  // 11:00-16:00 = צהריים טובים
  assert(H.getGreetingByHour(11) === 'צהריים טובים', '11 → צהריים טובים');
  assert(H.getGreetingByHour(13) === 'צהריים טובים', '13 → צהריים טובים');
  assert(H.getGreetingByHour(15) === 'צהריים טובים', '15 → צהריים טובים (תחתון)');
  // 16:00-22:00 = אחר הצהריים
  assert(H.getGreetingByHour(16) === 'אחר הצהריים',  '16 → אחר הצהריים');
  assert(H.getGreetingByHour(19) === 'אחר הצהריים',  '19 → אחר הצהריים');
  assert(H.getGreetingByHour(21) === 'אחר הצהריים',  '21 → אחר הצהריים (תחתון)');
  // אחרת = היי
  assert(H.getGreetingByHour(22) === 'היי',         '22 → היי (לילה)');
  assert(H.getGreetingByHour(3)  === 'היי',         '3  → היי (לילה מאוחר)');
  assert(H.getGreetingByHour(0)  === 'היי',         '0  → היי');
}

// ----------------------------------------------------------------------------
// בלוק 5 — buildHeroSentence — 4 rules + priority
// ----------------------------------------------------------------------------
header('5. buildHeroSentence — 4 rules §9.4 + MOY priority');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();
  const greeting = 'בוקר טוב';

  // Rule 1: groups >= 1 AND moy <= 1 → "X קבוצות + Y תלמידים"
  const s1 = H.buildHeroSentence({ groups: 3, no_group: 2, moy_alerts: 0, greeting: greeting });
  assert(s1.indexOf('3') !== -1 && s1.indexOf('2') !== -1 && s1.indexOf('קבוצות') !== -1,
         'Rule 1: groups=3, no_group=2 → מופיעים במשפט');
  assert(s1.indexOf(greeting) === 0, 'משפט מתחיל בברכה');

  // Rule 1 — groups=1 → singular
  const s1b = H.buildHeroSentence({ groups: 1, no_group: 0, moy_alerts: 0, greeting: greeting });
  assert(s1b.indexOf('1 קבוצה קצרה') !== -1, 'groups=1 → לשון יחיד "קבוצה"');

  // Rule 2: groups=0, no_group>=1
  const s2 = H.buildHeroSentence({ groups: 0, no_group: 2, moy_alerts: 0, greeting: greeting });
  assert(s2.indexOf('אין קבוצות דחופות') !== -1,
         'Rule 2: groups=0, no_group=2 → "אין קבוצות דחופות"');
  assert(s2.indexOf('2') !== -1, 'Rule 2: no_group=2 מופיע');

  // Rule 3: all zero
  const s3 = H.buildHeroSentence({ groups: 0, no_group: 0, moy_alerts: 0, greeting: greeting });
  assert(s3.indexOf('הכל יציב היום') !== -1,
         'Rule 3: 0/0/0 → "הכל יציב היום"');

  // Rule 4: MOY >= 2 — priority חופף לכל השאר
  const s4 = H.buildHeroSentence({ groups: 5, no_group: 3, moy_alerts: 2, greeting: greeting });
  assert(s4.indexOf('התראות אמצע שנה') !== -1,
         'Rule 4: moy=2 + הכל אחר → התראות אמצע שנה תופסות קדימות');
  assert(s4.indexOf('קבוצות') === -1,
         'Rule 4: priority — לא מופיע "קבוצות" כשyMOY≥2');

  // MOY=1 → לא priority (rule 1 חל)
  const s5 = H.buildHeroSentence({ groups: 2, no_group: 1, moy_alerts: 1, greeting: greeting });
  assert(s5.indexOf('התראות אמצע שנה') === -1,
         'MOY=1 → לא priority, ביטוי קבוצות חוזר');

  // MOY=3 → priority
  const s6 = H.buildHeroSentence({ groups: 0, no_group: 0, moy_alerts: 3, greeting: greeting });
  assert(s6.indexOf('התראות אמצע שנה') !== -1, 'MOY=3 → priority');
}

// ----------------------------------------------------------------------------
// בלוק 6 — isSameCalendarDay + startOfWeekTimestamp
// ----------------------------------------------------------------------------
header('6. isSameCalendarDay + startOfWeekTimestamp');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();

  const t1 = new Date(2026, 4, 29, 8, 0, 0).getTime(); // 29 May 2026 08:00
  const t1Later = new Date(2026, 4, 29, 23, 30, 0).getTime();
  const t2 = new Date(2026, 4, 30, 1, 0, 0).getTime(); // 30 May
  const tEarlier = new Date(2026, 4, 28, 23, 0, 0).getTime();

  assert(H.isSameCalendarDay(t1, t1Later), 'אותו יום (29.5 8:00 vs 23:30) → true');
  assert(!H.isSameCalendarDay(t1, t2), 'ימים שונים (29.5 vs 30.5) → false');
  assert(!H.isSameCalendarDay(t1, tEarlier), 'ימים שונים (29.5 vs 28.5) → false');
  assert(!H.isSameCalendarDay(null, t1), 'null → false');
  assert(!H.isSameCalendarDay(t1, null), 'null → false');

  // startOfWeekTimestamp — ראשון 00:00
  // 29.5.2026 = יום שישי (Friday). Sunday before = 24.5.2026
  const sow = H.startOfWeekTimestamp(t1);
  const sowDate = new Date(sow);
  assert(sowDate.getDay() === 0, 'startOfWeek יוצא יום ראשון');
  assert(sowDate.getHours() === 0 && sowDate.getMinutes() === 0,
         'startOfWeek = 00:00');
  assert(sow <= t1, 'startOfWeek <= now');
  // הפרש לא יותר משבוע
  assert(t1 - sow < 7 * 24 * 60 * 60 * 1000, 'startOfWeek בתוך השבוע');
}

// ----------------------------------------------------------------------------
// בלוק 7 — Action log: append / remove / dedupe / counts
// ----------------------------------------------------------------------------
header('7. Action log — append · remove · dedupe · counts');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();

  // log ריק
  assert(Array.isArray(H.getActionLog()) && H.getActionLog().length === 0,
         'log התחלתי = []');

  // append
  const now = new Date(2026, 4, 29, 10, 0, 0).getTime();
  const ok1 = H.appendActionLog({ type: 'group', key: 'phonological_s1-s2-s3', completedAt: new Date(now).toISOString() });
  assert(ok1 === true, 'append מצליח');
  assert(H.getActionLog().length === 1, 'log אחרי append = 1');

  // dedupe: אותו key אותו יום → false
  const ok2 = H.appendActionLog({ type: 'group', key: 'phonological_s1-s2-s3', completedAt: new Date(now + 3600000).toISOString() });
  assert(ok2 === false, 'dedupe באותו יום → false');
  assert(H.getActionLog().length === 1, 'log לא גדל מ-duplicate');

  // append שונה
  const ok3 = H.appendActionLog({ type: 'individual', key: 's4', completedAt: new Date(now).toISOString() });
  assert(ok3 === true, 'append entry שונה מצליח');
  assert(H.getActionLog().length === 2, 'log = 2');

  // remove
  const ok4 = H.removeActionLog('group', 'phonological_s1-s2-s3');
  assert(ok4 === true, 'remove מצליח');
  assert(H.getActionLog().length === 1, 'log אחרי remove = 1');

  // remove שלא קיים
  const ok5 = H.removeActionLog('group', 'nonexistent');
  assert(ok5 === false, 'remove of nonexistent → false');

  // counts — היום
  const log1 = H.getActionLog();
  const cToday = H.countCompletedToday(log1, now);
  assert(cToday === 1, 'countCompletedToday = 1');

  // count השבוע
  const cWeek = H.countCompletedThisWeek(log1, now);
  assert(cWeek === 1, 'countCompletedThisWeek = 1');

  // append entry בעבר (לפני שבוע) — נכנס ל-week count? לא
  const lastWeek = new Date(2026, 4, 20, 10, 0, 0).getTime(); // 9 ימים אחורה
  global.localStorage.setItem(H.ACTION_LOG_KEY, JSON.stringify([
    { type: 'group', key: 'old', completedAt: new Date(lastWeek).toISOString() }
  ]));
  const log2 = H.getActionLog();
  const cWeek2 = H.countCompletedThisWeek(log2, now);
  assert(cWeek2 === 0, 'entry לפני השבוע → לא נספר');
  const cToday2 = H.countCompletedToday(log2, now);
  assert(cToday2 === 0, 'entry של אתמול → לא נספר ב-today');

  // ריק → 0
  assert(H.countCompletedToday(null, now) === 0, 'log=null → 0');
  assert(H.countCompletedThisWeek(undefined, now) === 0, 'log=undefined → 0');
}

// ----------------------------------------------------------------------------
// בלוק 8 — statusForEntry
// ----------------------------------------------------------------------------
header('8. statusForEntry — today / week / none');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();

  const now = new Date(2026, 4, 29, 10, 0, 0).getTime(); // יום שישי
  const yesterday = new Date(2026, 4, 28, 10, 0, 0).getTime();
  const lastWeek = new Date(2026, 4, 20, 10, 0, 0).getTime();

  const log = [
    { type: 'group', key: 'today_grp', completedAt: new Date(now).toISOString() },
    { type: 'group', key: 'week_grp',  completedAt: new Date(yesterday).toISOString() },
    { type: 'group', key: 'old_grp',   completedAt: new Date(lastWeek).toISOString() }
  ];

  assert(H.statusForEntry('group', 'today_grp', log, now) === 'today', 'היום → today');
  assert(H.statusForEntry('group', 'week_grp', log, now) === 'week', 'אתמול → week');
  assert(H.statusForEntry('group', 'old_grp', log, now) === 'none', 'לפני השבוע → none');
  assert(H.statusForEntry('group', 'missing', log, now) === 'none', 'לא קיים → none');
  assert(H.statusForEntry('group', 'today_grp', [], now) === 'none', 'log ריק → none');
}

// ----------------------------------------------------------------------------
// בלוק 9 — logEntryKey
// ----------------------------------------------------------------------------
header('9. logEntryKey — canonical format');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();
  assert(H.logEntryKey('group', 'phonological_s1-s2') === 'group:phonological_s1-s2',
         'group format');
  assert(H.logEntryKey('individual', 's3') === 'individual:s3', 'individual format');
  assert(H.logEntryKey('moy', 's4', 'task_3') === 'moy:s4:task_3',
         'moy עם taskId');
  assert(H.logEntryKey('', 's4') === '', 'type ריק → ""');
  assert(H.logEntryKey('group', '') === '', 'id ריק → ""');
}

// ----------------------------------------------------------------------------
// בלוק 10 — patternToSimpleHe
// ----------------------------------------------------------------------------
header('10. patternToSimpleHe — שפה פשוטה');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();
  assert(H.patternToSimpleHe('phonological') === 'תרגול צלילים',     'phonological');
  assert(H.patternToSimpleHe('letter_knowledge') === 'זיהוי אותיות מתבלבלות', 'letter_knowledge');
  assert(H.patternToSimpleHe('decoding') === 'פענוח בהקשר',         'decoding');
  assert(H.patternToSimpleHe('fluency') === 'שטף קריאה',            'fluency');
  assert(H.patternToSimpleHe('letter_cluster') === 'חיזוק אותיות חלשות', 'letter_cluster');
  assert(H.patternToSimpleHe('unknown') === 'unknown', 'patternId לא ידוע → passthrough');
  assert(H.patternToSimpleHe('') === '', 'ריק → ""');
  assert(H.patternToSimpleHe(null) === '', 'null → ""');
}

// ----------------------------------------------------------------------------
// בלוק 11 — reasonByEvidence
// ----------------------------------------------------------------------------
header('11. reasonByEvidence — שפה פשוטה לפי מקור');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();
  const r1 = H.reasonByEvidence({ by_source: { epa: 3, moy: 0, combined: 0 } });
  assert(r1.indexOf('פעילות היומית') !== -1, 'EPA only → "פעילות היומית"');

  const r2 = H.reasonByEvidence({ by_source: { epa: 0, moy: 2, combined: 0 } });
  assert(r2.indexOf('אמצע שנה') !== -1, 'MOY only → "אמצע שנה"');

  const r3 = H.reasonByEvidence({ by_source: { epa: 0, moy: 0, combined: 3 } });
  assert(r3.indexOf('פעילות היומית') !== -1 && r3.indexOf('אמצע שנה') !== -1,
         'combined only → שילוב');

  const r4 = H.reasonByEvidence({ by_source: { epa: 2, moy: 1, combined: 1 } });
  assert(r4.indexOf('מצטבר') !== -1, 'mixed → "מצטבר"');

  const r5 = H.reasonByEvidence(null);
  assert(typeof r5 === 'string' && r5.length > 0, 'evidence=null → ניסוח גנרי');

  const r6 = H.reasonByEvidence({});
  assert(typeof r6 === 'string' && r6.length > 0, 'evidence ריק → ניסוח גנרי');
}

// ----------------------------------------------------------------------------
// בלוק 12 — moyAlertSimpleHe
// ----------------------------------------------------------------------------
header('12. moyAlertSimpleHe — תרגום סטטוס MOY');
{
  clearMocks();
  global.localStorage = makeLocalStorageMock();
  const H = loadHelpers();

  // null
  assert(H.moyAlertSimpleHe(null) === '', 'null → ""');

  // next_review_due בעתיד
  const future = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const r1 = H.moyAlertSimpleHe({ next_review_due: future, latest_status: 'fail' });
  assert(r1.indexOf('בדיקה חוזרת') !== -1, 'next_review_due בעתיד → "בדיקה חוזרת"');

  // fail
  const r2 = H.moyAlertSimpleHe({ next_review_due: null, latest_status: 'fail' });
  assert(r2.indexOf('נכשל') !== -1, 'fail → "נכשל.ה"');

  // suggested_intervention
  const r3 = H.moyAlertSimpleHe({ suggested_intervention: { patternId: 'phonological' } });
  assert(r3.indexOf('תרגול ממוקד') !== -1, 'suggested → "תרגול ממוקד"');

  // near
  const r4 = H.moyAlertSimpleHe({ latest_status: 'near' });
  assert(r4.indexOf('קרוב') !== -1, 'near → "קרוב.ה"');

  // unknown → generic
  const r5 = H.moyAlertSimpleHe({ latest_status: 'pass' });
  assert(typeof r5 === 'string' && r5.length > 0, 'pass → ניסוח גנרי');
}

// ----------------------------------------------------------------------------
// סיכום
// ----------------------------------------------------------------------------
console.log('\n==================================================');
console.log('סיכום: ' + pass + ' עברו · ' + fail + ' נכשלו');
console.log('==================================================');
if (fail > 0) process.exit(1);
