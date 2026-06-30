// ============================================================
// tests/epa-g4-unit-key.test.js — אימות end-to-end ל-G4 (מפתח-יחידה גנרי ב-EPA)
// minigame-fit T5 · 30.6.2026 · _handoff/2026-06-30-G4-epa-unit-key-agent-brief.md §4 T4
//
// epa.js הוא JS-דפדפן (window + localStorage). הבדיקה מספקת shim מינימלי לשניהם,
// טוענת את הקובץ האמיתי (require), ומריצה את 3 התרחישים מה-brief.
//
// הרצה:  node avnei-yesod/underwater-app/tests/epa-g4-unit-key.test.js
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---- shim localStorage ----
function makeLocalStorage() {
  const store = {};
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };
}

// ---- טעינת epa.js לתוך sandbox עם window+localStorage ----
function loadEPA() {
  const sandbox = { console };
  sandbox.window = sandbox;            // window === global (כמו בדפדפן)
  sandbox.localStorage = makeLocalStorage();
  vm.createContext(sandbox);
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'shared', 'epa.js'), 'utf8');
  vm.runInContext(src, sandbox, { filename: 'epa.js' });
  return sandbox.window.AvneiEPA;
}

// ---- micro-assert ----
let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? '  → ' + detail : '')); }
}
function deep(v) { return JSON.stringify(v); }

console.log('G4 · EPA unit-key — end-to-end\n');

// ============================================================
// תרחיש 1 · תאימות לאחור — אירוע אות נשמר תחת [island][letter] בדיוק כמו היום
// ============================================================
(function scenarioLetter() {
  console.log('1) תאימות לאחור (target_letter)');
  const EPA = loadEPA();
  for (let i = 0; i < 4; i++) {
    EPA.ingestEvent({
      student_id: 'stu', primary_island_id: 3, target_letter: 'מ',
      is_correct: false, failure_type: 'Sound', task_type: 'recognition',
    });
  }
  const dump = EPA.dump();
  const rec = ((dump.stu || {})[3] || {})['מ'];
  check('נשמר תחת state.stu.3.מ', !!rec, deep(dump));
  check('failure.Sound = 4', rec && rec.failure.Sound === 4, rec && deep(rec.failure));
  check('getEPAForUnit מחזיר את אותה רשומה (השוואת-ערך — loadState מפענח מחדש)',
        deep(EPA.getEPAForUnit('stu', 3, 'מ')) === deep(rec));
  check('getEPAForUnit ליחידה לא-קיימת → null',
        EPA.getEPAForUnit('stu', 3, 'ז') === null);
})();

// ============================================================
// תרחיש 2 · המקרה החדש — אירוע מורפולוגי בלי target_letter נשמר תחת characteristic_id
// ============================================================
(function scenarioMorph() {
  console.log('\n2) מורפולוגיה (characteristic_id, בלי target_letter)');
  const EPA = loadEPA();
  EPA.ingestEvent({
    student_id: 'stu', primary_island_id: 9,
    characteristic_id: 'sep-w3-morph-c1',     // בלי target_letter
    is_correct: false, failure_type: 'WrongPlural', task_type: 'name',
  });
  const dump = EPA.dump();
  const rec = ((dump.stu || {})[9] || {})['sep-w3-morph-c1'];
  check('נשמר תחת state.stu.9["sep-w3-morph-c1"]', !!rec, deep(dump));
  check('failure.WrongPlural = 1',
        rec && rec.failure.WrongPlural === 1, rec && deep(rec.failure));
  check('task.name = 1 (task_type עבר)',
        rec && rec.task.name === 1, rec && deep(rec.task));

  // בלי אי OR בלי שני המפתחות → עדיין נדחה (מפתח-זבל נמנע)
  const before = deep(EPA.dump());
  EPA.ingestEvent({ student_id: 'stu', primary_island_id: 9,
                    is_correct: false, failure_type: 'WrongPlural' }); // בלי letter ובלי char_id
  check('אירוע בלי unitKey נדחה (state ללא שינוי)', deep(EPA.dump()) === before);
})();

// ============================================================
// תרחיש 3 · getDominantPattern על מדגם מעורב (אותיות + characteristic units) באותו אי
// ============================================================
(function scenarioMixed() {
  console.log('\n3) דפוס דומיננטי על מדגם מעורב באי אחד');
  const EPA = loadEPA();
  // 3 טעויות תחת אות + 3 תחת characteristic — כולן failure=WrongPlural, אותו אי
  for (let i = 0; i < 3; i++) {
    EPA.ingestEvent({ student_id: 'stu', primary_island_id: 9, target_letter: 'ים',
      is_correct: false, failure_type: 'WrongPlural', task_type: 'name' });
  }
  for (let i = 0; i < 3; i++) {
    EPA.ingestEvent({ student_id: 'stu', primary_island_id: 9, characteristic_id: 'sep-w3-morph-c1',
      is_correct: false, failure_type: 'WrongPlural', task_type: 'name' });
  }
  const pat = EPA.getDominantPattern('stu', 9);
  check('מחזיר דפוס (לא null)', !!pat, deep(pat));
  check('axis=failure value=WrongPlural',
        pat && pat.axis === 'failure' && pat.value === 'WrongPlural', deep(pat));
  check('total=6 (אגרגציה חוצה-יחידות: אות + characteristic)',
        pat && pat.total === 6, deep(pat));
  check('percent=1.0', pat && Math.abs(pat.percent - 1) < 1e-9, deep(pat));
})();

console.log('\n' + (fail === 0
  ? `✅ כל הבדיקות עברו (${pass})`
  : `❌ ${fail} נכשלו, ${pass} עברו`));
process.exit(fail === 0 ? 0 : 1);
