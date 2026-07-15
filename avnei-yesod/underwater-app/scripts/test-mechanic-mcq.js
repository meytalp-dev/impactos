// ============================================================
// test-mechanic-mcq.js — בדיקות ליבת mechanic-mcq + צינור EPA פר-מסיח
// minigame-fit T1 · 30.6.2026
//
// מאמת end-to-end את "הלינצ'פין":
//   לחיצה שגויה במשחקון → buildLogPayload ממפה epa{what,where,task} →
//   AvneiEventLogger.logActivityResult → AvneiEPA.ingestEvent רושם את הטעות
//   הספציפית של המסיח ב-3 הצירים. לחיצה נכונה → לא נרשם ל-EPA.
//
// הרצה:
//   node avnei-yesod/underwater-app/scripts/test-mechanic-mcq.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ===== stubs =====
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};
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

// eval חייב להיות ב-scope ה-top-level של המודול כדי ש-function declarations
// (appendEvent/getEvents מ-state.js) יהיו נגישות ל-event-logger.js שנטען אחריו.
function read(rel) { return fs.readFileSync(path.join(__dirname, rel), 'utf-8'); }

// סדר טעינה: state (appendEvent/getEvents) → epa → event-logger → vowel-adapter → mcq
eval(read('../js/state.js'));
eval(read('../js/shared/epa.js'));           // window.AvneiEPA
eval(read('../js/shared/event-logger.js'));  // window.AvneiEventLogger (BKT לא נטען → branch מדולג)
eval(read('../js/shared/vowel-adapter.js')); // window.AvneiVowelAdapter (buildCV)
eval(read('../js/templates/mechanic-mcq.js'));
eval(read('../js/templates/mechanic-odd-one-out.js'));
eval(read('../js/templates/mechanic-match-pairs.js'));

// event-logger.js מתייחס ל-AvneiEPA כ-global (בדפדפן window===global). ב-Node
// epa.js שם רק window.AvneiEPA — נגשר ידנית כדי שה-branch של EPA ירוץ.
global.AvneiEPA = global.window.AvneiEPA;

const Logger = global.window.AvneiEventLogger;
const EPA = global.window.AvneiEPA;
const MCQ = global.window.AvneiMechanics.mcq;

// ===== runner =====
let pass = 0, fail = 0;
function assert(label, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + label); }
  else { fail++; console.log('  ❌ ' + label + (extra ? '\n     ' + extra : '')); }
}
function divider(label) {
  console.log('\n' + '='.repeat(60) + '\n' + label + '\n' + '='.repeat(60));
}
function resetAll() {
  localStorage._data = {};
  localStorage.setItem('avnei-yesod-current-student', 'stu-test');
}

const baseOpts = {
  interaction: 'audio_to_written',
  item_id: 'q-mem-1',
  target_letter: 'מ',
  primary_island_id: 3,
  secondary_island_ids: [2],
  rama_task_alignment: 1,
  peima_target: 1,
};

// ============================================================
divider('בדיקה 1 — buildLogPayload ממפה epa → השדות שהמנוע קורא');

const wrongOpt = { label_he: 'ל', is_correct: false, epa: { what: 'Shape', where: 'initial', task: 'recognition' } };
const p = MCQ._buildLogPayload(baseOpts, wrongOpt, { attempts: 1, response_time_ms: 1500 });
assert('activity_type = mcq', p.activity_type === 'mcq');
assert('activity_variant = interaction', p.activity_variant === 'audio_to_written');
assert('failure_type = epa.what (Shape)', p.failure_type === 'Shape', 'התקבל: ' + p.failure_type);
assert('letter_position = epa.where (initial)', p.letter_position === 'initial', 'התקבל: ' + p.letter_position);
assert('task_type = epa.task (recognition)', p.task_type === 'recognition', 'התקבל: ' + p.task_type);
assert('target_letter עובר (מ)', p.target_letter === 'מ');
assert('primary_island_id עובר (3)', p.primary_island_id === 3);
assert('is_correct = false', p.is_correct === false);
assert('response_time_ms = null על טעות', p.response_time_ms === null);

const rightOpt = { label_he: 'מ', is_correct: true, epa: null };
const pc = MCQ._buildLogPayload(baseOpts, rightOpt, { attempts: 1, response_time_ms: 900 });
assert('לחיצה נכונה: is_correct = true', pc.is_correct === true);
assert('לחיצה נכונה: אין failure_type', pc.failure_type === null);
assert('לחיצה נכונה: response_time_ms נשמר', pc.response_time_ms === 900);

// ============================================================
divider('בדיקה 2 — end-to-end: טעות → EPA state (3 צירים)');

resetAll();
Logger.logActivityResult(MCQ._buildLogPayload(baseOpts, wrongOpt, { attempts: 1 }));
const rec = EPA.getEPA('stu-test', 3)['מ'];
assert('נרשמה רשומת-אות מ באי 3', !!rec, 'state: ' + JSON.stringify(EPA.getEPA('stu-test', 3)));
assert('failure.Shape = 1', rec && rec.failure.Shape === 1, rec && JSON.stringify(rec.failure));
assert('context.initial = 1', rec && rec.context.initial === 1, rec && JSON.stringify(rec.context));
assert('task.recognition = 1', rec && rec.task.recognition === 1, rec && JSON.stringify(rec.task));

// ============================================================
divider('בדיקה 3 — ערכי G2/G3 החדשים נרשמים (decode · Comprehension)');

resetAll();
// decode = ערך ה-task הנפוץ בבנק (581) — G3
Logger.logActivityResult(MCQ._buildLogPayload(
  { interaction: 'fill_missing', item_id: 'q2', target_letter: 'ש', primary_island_id: 3 },
  { label_he: 'שׂ', is_correct: false, epa: { what: 'Sound', where: 'medial', task: 'decode' } },
  { attempts: 1 }));
const recDecode = EPA.getEPA('stu-test', 3)['ש'];
assert('task.decode = 1 (G3 נקלט)', recDecode && recDecode.task.decode === 1, recDecode && JSON.stringify(recDecode.task));

resetAll();
// Comprehension = G2 (failure של הבנה). target_letter חייב להיות כדי שייקלט (G4 פתוח).
Logger.logActivityResult(MCQ._buildLogPayload(
  { interaction: 'true_false_image', item_id: 'q3', target_letter: 'א', primary_island_id: 4 },
  { label_he: 'לֹא נָכוֹן', is_correct: false, epa: { what: 'Comprehension', where: 'isolation', task: 'recognition' } },
  { attempts: 1 }));
const recComp = EPA.getEPA('stu-test', 4)['א'];
assert('failure.Comprehension = 1 (G2 נקלט)', recComp && recComp.failure.Comprehension === 1, recComp && JSON.stringify(recComp.failure));

// ============================================================
divider('בדיקה 4 — לחיצה נכונה לא נרשמת ל-EPA');

resetAll();
Logger.logActivityResult(MCQ._buildLogPayload(baseOpts, rightOpt, { attempts: 1, response_time_ms: 800 }));
const afterCorrect = EPA.getEPA('stu-test', 3);
assert('EPA ריק אחרי לחיצה נכונה', Object.keys(afterCorrect).length === 0, JSON.stringify(afterCorrect));

// ============================================================
divider('בדיקה 5 — optionLabel: ב/כ/פ בתחילת CV מקבל דגש קל דרך vowel-adapter');

const cvLabel = MCQ._optionLabel({ letter: 'ב', vowelId: 'patach' });
// buildCV מוסיף דגש (U+05BC) ל-ב/כ/פ — בַּ ולא בַ
assert('buildCV("ב","patach") מכיל דגש (U+05BC)', cvLabel.indexOf('ּ') !== -1, 'התקבל: ' + cvLabel + ' (' + [].map.call(cvLabel, c => c.codePointAt(0).toString(16)).join(' ') + ')');
assert('label_he מפורש גובר על בניית CV', MCQ._optionLabel({ label_he: 'מָ', letter: 'ב', vowelId: 'patach' }) === 'מָ');

// ============================================================
divider('בדיקה 6 — odd-one-out: טעות (לחיצה על פריט שאינו היוצא-דופן) → EPA');

const OOO = global.window.AvneiMechanics['odd-one-out'];
resetAll();
// פריט שנלחץ בטעות (לא היוצא-דופן) — ה-epa שלו מתאר למה אולי נחשב יוצא-דופן.
const oooWrong = { label_he: 'ר', is_correct: false, epa: { what: 'Shape', where: 'isolation', task: 'find' } };
const oooOpts = { interaction: 'pick_odd_one', item_id: 'odd1', target_letter: 'ד', primary_island_id: 3 };
const pOdd = OOO._buildLogPayload(oooOpts, oooWrong, { attempts: 1 });
assert('odd-one-out activity_type', pOdd.activity_type === 'odd-one-out');
assert('odd-one-out failure_type = epa.what', pOdd.failure_type === 'Shape', 'התקבל: ' + pOdd.failure_type);
assert('odd-one-out task_type = epa.task (find)', pOdd.task_type === 'find');
Logger.logActivityResult(pOdd);
const oddRec = EPA.getEPA('stu-test', 3)['ד'];
assert('odd-one-out end-to-end: failure.Shape=1', oddRec && oddRec.failure.Shape === 1, oddRec && JSON.stringify(oddRec.failure));
// היוצא-דופן (נכון) → לא נרשם
const pOddOk = OOO._buildLogPayload(oooOpts, { label_he: 'ב', is_correct: true, epa: null }, { attempts: 1 });
assert('odd-one-out נכון: is_correct=true', pOddOk.is_correct === true);
assert('odd-one-out נכון: אין failure', pOddOk.failure_type === null);

// ============================================================
divider('בדיקה 7 — match-pairs: חיבור שגוי → EPA (WrongPlural)');

const MP = global.window.AvneiMechanics['match-pairs'];
resetAll();
const mpOpts = { interaction: 'match_pair', item_id: 'mp1', target_letter: 'ן', primary_island_id: 9 };
const mpEpa = { what: 'WrongPlural', where: 'final', task: 'recognition' };
const pMpWrong = MP._buildLogPayload(mpOpts, mpEpa, { is_correct: false, attempts: 1 });
assert('match-pairs activity_type', pMpWrong.activity_type === 'match-pairs');
assert('match-pairs failure_type = WrongPlural (G2)', pMpWrong.failure_type === 'WrongPlural');
assert('match-pairs is_correct=false', pMpWrong.is_correct === false);
Logger.logActivityResult(pMpWrong);
const mpRec = EPA.getEPA('stu-test', 9)['ן'];
assert('match-pairs end-to-end: failure.WrongPlural=1', mpRec && mpRec.failure.WrongPlural === 1, mpRec && JSON.stringify(mpRec.failure));
const pMpOk = MP._buildLogPayload(mpOpts, null, { is_correct: true, attempts: 1, response_time_ms: 1200 });
assert('match-pairs נכון: is_correct=true, אין failure', pMpOk.is_correct === true && pMpOk.failure_type === null);

// ============================================================
divider(`סיכום: ${pass} עברו · ${fail} נכשלו`);
if (fail > 0) { console.log('\n❌ יש כשלים'); process.exit(1); }
else { console.log('\n✅ כל הבדיקות עברו — ליבת mcq + צינור EPA מאומתים'); process.exit(0); }
