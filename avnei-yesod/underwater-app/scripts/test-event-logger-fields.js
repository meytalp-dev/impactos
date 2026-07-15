// ============================================================
// test-event-logger-fields.js — בדיקות E.17 (28.5.2026)
//
// מאמת:
//   1. אירוע חדש כולל 20 שדות (17 הקיימים + 3 שהוספנו)
//   2. strand_id נכון פר-אי לפי ISLAND_TO_STRAND mapping (5 איים מייצגים)
//   3. rama_task_alignment עובר מהפריט (result) לאירוע
//   4. peima_target עובר מהפריט לאירוע
//   5. Backwards compat — אירועים ישנים בלי 3 השדות נשמרים עם null
//
// הרצה:
//   node avnei-yesod/underwater-app/scripts/test-event-logger-fields.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ===== localStorage stub =====
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};
// state.js רושם DOMContentLoaded listener על document — stub no-op
global.document = {
  addEventListener: () => {},
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
  }),
  head: {
    appendChild: (node) => {
      if (node && typeof node.onload === 'function') node.onload();
      return node;
    },
  },
};
global.console = console;

// state.js מצפה ל-loadState/saveState ב-scope גלובלי. נטען אותו דרך eval כדי
// שה-function appendEvent וה-helpers יהיו זמינים כאן.
const stateCode = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf-8');
eval(stateCode);

// event-logger.js תלוי ב-window.AvneiEventLogger. גם ב-window.AvneiBKT/EPA אם
// קיימים — לבדיקה אנחנו לא מציבים אותם, אז ingestEvent לא ייקרא (warn-only).
const loggerCode = fs.readFileSync(path.join(__dirname, '../js/shared/event-logger.js'), 'utf-8');
eval(loggerCode);

const Logger = global.window.AvneiEventLogger;

// ===== Test runner =====
let pass = 0;
let fail = 0;
function assert(label, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else      { fail++; console.log('  ❌ ' + label + (extra ? '\n     ' + extra : '')); }
}
function divider(label) {
  console.log('\n' + '='.repeat(60));
  console.log(label);
  console.log('='.repeat(60));
}

// ============================================================
// 1. אירוע חדש כולל את 3 השדות
// ============================================================
divider('בדיקה 1 — 3 השדות החדשים מופיעים באירוע');

localStorage._data = {};
const evt1 = Logger.logActivityResult({
  activity_type: 'storm-quest',
  target_letter: 'ת',
  item_id: 'storm-coral-1',
  is_correct: true,
  attempts: 1,
  response_time_ms: 1200,
  rama_task_alignment: 1,
  peima_target: 1,
});

assert('strand_id קיים באירוע',           'strand_id' in evt1);
assert('rama_task_alignment קיים באירוע', 'rama_task_alignment' in evt1);
assert('peima_target קיים באירוע',        'peima_target' in evt1);
assert('strand_id = 1 (storm-quest → אי 3 → strand 1)', evt1.strand_id === 1, 'התקבל: ' + evt1.strand_id);
assert('rama_task_alignment = 1 (עבר מ-result)',         evt1.rama_task_alignment === 1, 'התקבל: ' + evt1.rama_task_alignment);
assert('peima_target = 1 (עבר מ-result)',                evt1.peima_target === 1, 'התקבל: ' + evt1.peima_target);

// ספירת שדות בסיס + 3 חדשים
const expectedFields = [
  'student_id', 'session_id', 'island_id_current', 'activity_type',
  'activity_variant', 'item_id', 'target_letter', 'supportLevel',
  'primary_island_id', 'secondary_island_ids',
  'strand_id', 'rama_task_alignment', 'peima_target',
  'is_correct', 'attempts', 'response_time_ms',
  'hint_used', 'auto_hint_triggered', 'noni_guidance_used', 'timestamp',
];
const missingFields = expectedFields.filter(f => !(f in evt1));
assert('כל 20 השדות נוכחים באירוע', missingFields.length === 0,
       missingFields.length ? 'חסרים: ' + missingFields.join(', ') : '');

// ============================================================
// 2. ISLAND_TO_STRAND mapping — 5 איים מייצגים (אחד פר סטרנד)
// ============================================================
divider('בדיקה 2 — ISLAND_TO_STRAND mapping נכון פר-אי');

const SAMPLES = [
  { island: 3,  strand: 1, label: 'אי 3 (זיהוי אותיות)  → סטרנד 1 (פונולוגיה)' },
  { island: 8,  strand: 1, label: 'אי 8 (גבול סטרנד 1)  → סטרנד 1' },
  { island: 10, strand: 2, label: 'אי 10 (מורפולוגיה)   → סטרנד 2' },
  { island: 13, strand: 3, label: 'אי 13 (שפה דבורה)    → סטרנד 3' },
  { island: 16, strand: 4, label: 'אי 16 (קריאה+הבנה)   → סטרנד 4' },
  { island: 21, strand: 5, label: 'אי 21 (כתיבה)         → סטרנד 5' },
];

SAMPLES.forEach(({ island, strand, label }) => {
  const actual = Logger.ISLAND_TO_STRAND[island];
  assert(label, actual === strand, 'התקבל: ' + actual);
});

// 22 איים → רק 22 entries
const keys = Object.keys(Logger.ISLAND_TO_STRAND);
assert('ISLAND_TO_STRAND מכיל בדיוק 22 איים', keys.length === 22,
       'התקבל: ' + keys.length);

// ============================================================
// 3+4. rama_task_alignment + peima_target עוברים מ-result לאירוע
// ============================================================
divider('בדיקה 3+4 — שדות מהפריט עוברים נכון');

localStorage._data = {};
const evt2 = Logger.logActivityResult({
  activity_type: 'soundMatch',
  target_letter: 'מ',
  is_correct: true,
  attempts: 0,
  rama_task_alignment: 2,    // משימה 2 ראמ"ה (מודעות פונולוגית)
  peima_target: 1,
});
assert('rama_task_alignment=2 עובר מ-result',  evt2.rama_task_alignment === 2);
assert('peima_target=1 עובר מ-result',         evt2.peima_target === 1);

const evt3 = Logger.logActivityResult({
  activity_type: 'findLetter',
  target_letter: 'ר',
  is_correct: false,
  attempts: 2,
  rama_task_alignment: 5,    // משימה 5 ראמ"ה (45 צירופים)
  peima_target: 3,
});
assert('rama_task_alignment=5 עובר מ-result',  evt3.rama_task_alignment === 5);
assert('peima_target=3 עובר מ-result',         evt3.peima_target === 3);

// ============================================================
// 5. Backwards compat — אירוע ישן בלי השדות → null
// ============================================================
divider('בדיקה 5 — backwards compat (אירוע בלי 3 השדות)');

localStorage._data = {};
const evtLegacy = Logger.logActivityResult({
  activity_type: 'storm-quest',
  target_letter: 'ת',
  is_correct: true,
  attempts: 1,
  // *לא* מעבירים rama_task_alignment + peima_target
});
assert('rama_task_alignment=null כשלא הועבר',  evtLegacy.rama_task_alignment === null,
       'התקבל: ' + evtLegacy.rama_task_alignment);
assert('peima_target=null כשלא הועבר',         evtLegacy.peima_target === null,
       'התקבל: ' + evtLegacy.peima_target);
assert('strand_id עדיין מוגדר אוטומטית',       evtLegacy.strand_id === 1);

// אירוע עם ערכים לא-מספריים → null (סינון defensive)
const evtBad = Logger.logActivityResult({
  activity_type: 'storm-quest',
  target_letter: 'ת',
  is_correct: true,
  rama_task_alignment: 'not-a-number',
  peima_target: undefined,
});
assert('rama_task_alignment עם ערך לא-מספרי → null', evtBad.rama_task_alignment === null);
assert('peima_target=undefined → null',              evtBad.peima_target === null);

// ============================================================
// 6. island_id resolution — אי 4/5/14 (תיקון 29.6.2026)
//    קודם השדה היה מקובע 3 ואירועי אי 4/5/14 נשרו מ-BKT (island=null).
//    עכשיו primary_island_id מפורש מהמשחקון מכובד, ו-strand נגזר ממנו.
// ============================================================
divider('בדיקה 6 — island/strand נגזרים מהאי בפועל (לא מקובע 3)');

localStorage._data = {};
// משחקון אי 4 (cv-vs-cv) מעביר primary_island_id מפורש:
const evtIsland4 = Logger.logActivityResult({
  activity_type: 'cv-vs-cv',
  target_letter: 'ל',
  is_correct: true,
  attempts: 0,
  primary_island_id: 4,
  secondary_island_ids: [3],
});
assert('primary_island_id מפורש (4) מכובד',          evtIsland4.primary_island_id === 4, 'התקבל: ' + evtIsland4.primary_island_id);
assert('island_id_current = 4 (לא מקובע 3)',          evtIsland4.island_id_current === 4, 'התקבל: ' + evtIsland4.island_id_current);
assert('strand_id = 1 נגזר מאי 4 (פונולוגיה)',        evtIsland4.strand_id === 1, 'התקבל: ' + evtIsland4.strand_id);
assert('secondary_island_ids עוברים מ-result',        JSON.stringify(evtIsland4.secondary_island_ids) === '[3]');

// משחקון אי 5 (word-merge) — strand 1 גם הוא (איים 1-8 = strand 1):
const evtIsland5 = Logger.logActivityResult({
  activity_type: 'word-merge', target_letter: null, is_correct: true, attempts: 0,
  primary_island_id: 5, secondary_island_ids: [4],
});
assert('אי 5 → island_id_current = 5', evtIsland5.island_id_current === 5, 'התקבל: ' + evtIsland5.island_id_current);
assert('אי 5 → strand_id = 1',         evtIsland5.strand_id === 1, 'התקבל: ' + evtIsland5.strand_id);

// משחקון אי 14 (oral) → strand 3 (שפה דבורה):
const evtIsland14 = Logger.logActivityResult({
  activity_type: 'listen-and-answer', is_correct: true, attempts: 0,
  primary_island_id: 14,
});
assert('אי 14 → island_id_current = 14', evtIsland14.island_id_current === 14, 'התקבל: ' + evtIsland14.island_id_current);
assert('אי 14 → strand_id = 3 (שפה דבורה)', evtIsland14.strand_id === 3, 'התקבל: ' + evtIsland14.strand_id);

// תמיכה ב-island_id (alias) + strand_id override מפורש:
const evtAlias = Logger.logActivityResult({
  activity_type: 'future-game', is_correct: true, attempts: 0,
  island_id: 10, strand_id: 2,
});
assert('island_id (alias) נגזר ל-island_id_current', evtAlias.island_id_current === 10, 'התקבל: ' + evtAlias.island_id_current);
assert('strand_id override מפורש מכובד (2)',          evtAlias.strand_id === 2, 'התקבל: ' + evtAlias.strand_id);

// מנגנון גנרי באי 3 (sort-by-letter) — דרך המפה, לא מפורש:
const evtSort = Logger.logActivityResult({
  activity_type: 'sort-by-letter', target_letter: 'ל', is_correct: true, attempts: 0,
});
assert('sort-by-letter → אי 3 דרך המפה', evtSort.primary_island_id === 3, 'התקבל: ' + evtSort.primary_island_id);
assert('sort-by-letter → strand_id = 1', evtSort.strand_id === 1, 'התקבל: ' + evtSort.strand_id);

// activity לא ידוע בלי island מפורש → null (BKT יתעלם, אבל האירוע עדיין נשמר):
const evtUnknown = Logger.logActivityResult({
  activity_type: 'totally-unknown', is_correct: true, attempts: 0,
});
assert('activity לא ידוע → primary_island_id = null', evtUnknown.primary_island_id === null, 'התקבל: ' + evtUnknown.primary_island_id);
assert('activity לא ידוע → strand_id = null',         evtUnknown.strand_id === null, 'התקבל: ' + evtUnknown.strand_id);

// ============================================================
// 7. Cloud sync נטען אסינכרונית — אירוע מוקדם לא הולך לאיבוד
// ============================================================
divider('בדיקה 7 — אירוע לפני CloudSync נשמר עד readiness');

localStorage._data = {};
delete window.AvneiCloudSync;
const evtBeforeCloud = Logger.logActivityResult({
  activity_type: 'storm-quest',
  target_letter: 'ת',
  is_correct: true,
  attempts: 1,
});
const cloudCalls = [];
window.AvneiCloudSync = {
  queueEvent: (eventType, payload, clientTimestamp) => {
    cloudCalls.push({ eventType, payload, clientTimestamp });
  },
};
assert('Logger חושף flush פנימי לבדיקה', typeof Logger._flushPendingCloudEventsForTest === 'function');
if (typeof Logger._flushPendingCloudEventsForTest === 'function') {
  Logger._flushPendingCloudEventsForTest();
}
assert('אירועים מוקדמים נשלחו ל-cloud כשה-sync מוכן', cloudCalls.length >= 1,
       'התקבלו קריאות: ' + cloudCalls.length);
assert('אותו event עבר ל-cloud', cloudCalls.some(call => call.payload === evtBeforeCloud));

// ============================================================
// סיכום
// ============================================================
divider(`סיכום: ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) {
  console.log('\n❌ יש כשלים — לתקן לפני dipush');
  process.exit(1);
} else {
  console.log('\n✅ כל הבדיקות עברו — E.17 מוכן');
  process.exit(0);
}
