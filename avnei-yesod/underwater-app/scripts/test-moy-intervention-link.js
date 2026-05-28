// ============================================================
// test-moy-intervention-link.js — MOY × B.7 link (סוכן 14 · 28.5.2026)
// spec: moy-intervention-map.json + 2026-05-28-MOY-diagnostic-spec.md +
//       2026-05-28-B7-interventions-spec.md
// ============================================================
// Decisions אישרה מיטל (28.5.2026):
//   C (Smart hybrid) + γ (queue) + after attempt 2 fail + UI שניהם.
// בודק:
//   - לפני attempt 2 fail → אין הצעה.
//   - אחרי 2 fails בלי EPA/BKT → fallback phonological (match_quality=partial).
//   - אחרי 2 fails עם EPA/BKT pattern → epa_bkt_pattern (good match).
//   - priority order: letter_knowledge > letter_cluster > decoding > fluency > phonological.
//   - filter ב-taskId — רק אם הוא בין הנכשלים.
//   - recordMOYAttempt שומר suggested_intervention אוטומטית.
//   - getMOYStatus חושף את ה-suggestion.
//
// הרצה: node scripts/test-moy-intervention-link.js (מתיקיית underwater-app)
// יוצא ב-exit 0 אם הכל ירוק, אחרת 1.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Fake localStorage כדי להריץ את הקוד בסביבת Node
function makeLocalStorage() {
  const store = {};
  return {
    getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    _dump: () => ({ ...store }),
  };
}

// טעינת assessments.js עם או בלי mock של AvneiInterventions.
// mockInterventionsTriggers — array של triggers (patternId, details, confidence)
// שהפונקציה detectForStudent תחזיר. null = AvneiInterventions לא נטען בכלל.
function loadAssessmentsModule(mockInterventionsTriggers) {
  const localStorage = makeLocalStorage();
  const win = {};
  const sandbox = {
    window: win,
    localStorage,
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    Error,
    String,
    Number,
    require,                 // נחוץ לטעינת fs של moy-intervention-map.json
    module: { exports: {} },
    __dirname: path.join(__dirname, '..', 'js', 'shared'),
  };
  win.localStorage = localStorage;

  if (Array.isArray(mockInterventionsTriggers)) {
    win.AvneiInterventions = {
      detectForStudent: function (_studentId, _ctx) {
        return mockInterventionsTriggers.slice();
      }
    };
  }

  vm.createContext(sandbox);
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'shared', 'assessments.js'),
    'utf8'
  );
  vm.runInContext(src, sandbox, { filename: 'assessments.js' });
  return { sandbox, win, localStorage };
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}

function header(title) { console.log('\n=== ' + title + ' ==='); }

console.log('\n📋 MOY × B.7 Link — Test Suite (סוכן 14)');
console.log('=========================================');

// ────────────────────────────────────────────
// בלוק 1 — API surface
// ────────────────────────────────────────────
header('1. API surface');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  assert(typeof A.getSuggestedInterventionForAssessment === 'function',
    'getSuggestedInterventionForAssessment() נחשפת');
  assert(typeof A.loadInterventionMap === 'function',
    'loadInterventionMap() נחשפת');

  const map = A.loadInterventionMap();
  assert(map && typeof map === 'object', 'loadInterventionMap מחזירה אובייקט');
  assert(Array.isArray(map.epa_bkt_pattern_priority),
    'epa_bkt_pattern_priority הוא מערך');
  assert(map.epa_bkt_pattern_priority[0] === 'letter_knowledge',
    'priority[0] = letter_knowledge (הכי פעולתי)');
  assert(map.epa_bkt_pattern_priority.indexOf('phonological') >= 0,
    'phonological בתוך הרשימה');
  assert(map.task_to_pattern && map.task_to_pattern.task_3 && map.task_to_pattern.task_4,
    'task_to_pattern מכיל task_3 ו-task_4');
}

// ────────────────────────────────────────────
// בלוק 2 — לפני שיש מדידה / לפני attempt 2
// ────────────────────────────────────────────
header('2. לפני 2 ניסיונות fail — אין הצעה');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;

  assert(A.getSuggestedInterventionForAssessment('no-such-student') === null,
    'studentId לא קיים → null');

  assert(A.getSuggestedInterventionForAssessment(null) === null,
    'studentId=null → null');

  // attempt 1 fail בלבד → null (מחכה ל-attempt 2)
  A.recordMOYAttempt('stu-once', { task_3: { score: 2 }, task_4: { score: 4 } });
  assert(A.getSuggestedInterventionForAssessment('stu-once') === null,
    'attempt 1 fail בלבד → null (מחכה ל-attempt 2)');

  // 2 attempts אבל ה-2nd pass → null (התלמידה התאוששה)
  A.recordMOYAttempt('stu-rec', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-rec', { task_3: { score: 9 }, task_4: { score: 17 } });
  assert(A.getSuggestedInterventionForAssessment('stu-rec') === null,
    '2 attempts אבל 2nd pass → null');

  // 2 attempts pass+pass → null
  A.recordMOYAttempt('stu-good', { task_3: { score: 9 }, task_4: { score: 17 } });
  A.recordMOYAttempt('stu-good', { task_3: { score: 10 }, task_4: { score: 20 } });
  assert(A.getSuggestedInterventionForAssessment('stu-good') === null,
    'שני ניסיונות pass → null');
}

// ────────────────────────────────────────────
// בלוק 3 — 2 fails בלי AvneiInterventions → fallback phonological
// ────────────────────────────────────────────
header('3. Fallback phonological (בלי EPA/BKT pattern)');
{
  const { win } = loadAssessmentsModule(/* no mock interventions */);
  const A = win.AvneiAssessments;

  A.recordMOYAttempt('stu-fail', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-fail', { task_3: { score: 3 }, task_4: { score: 5 } });

  const sug = A.getSuggestedInterventionForAssessment('stu-fail');
  assert(sug !== null, '2 fails → יש הצעה');
  assert(sug.patternId === 'phonological', 'fallback patternId=phonological');
  assert(sug.source === 'moy_default_fallback', 'source=moy_default_fallback');
  assert(sug.match_quality === 'partial', 'match_quality=partial');
  assert(Array.isArray(sug.based_on_failed_tasks), 'based_on_failed_tasks הוא מערך');
  assert(sug.based_on_failed_tasks.length === 2, '2 ה-tasks נכשלו');
  assert(typeof sug.notice === 'string' && sug.notice.length > 0,
    'notice מילולי קיים (התווית "התאמה חלקית")');
  assert(typeof sug.generated_at === 'number', 'generated_at מספר');
}

// ────────────────────────────────────────────
// בלוק 4 — 2 fails עם EPA letter_knowledge → epa_bkt_pattern
// ────────────────────────────────────────────
header('4. EPA hit → epa_bkt_pattern (good match)');
{
  const { win } = loadAssessmentsModule([
    {
      patternId: 'letter_knowledge',
      details: { confused_pair: ['מ', 'ם'], distinction: 'ם בסוף מילה' },
      confidence: 'high'
    }
  ]);
  const A = win.AvneiAssessments;

  A.recordMOYAttempt('stu-lk', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-lk', { task_3: { score: 3 }, task_4: { score: 5 } });

  const sug = A.getSuggestedInterventionForAssessment('stu-lk');
  assert(sug !== null, 'יש הצעה');
  assert(sug.patternId === 'letter_knowledge', 'patternId=letter_knowledge מ-EPA');
  assert(sug.source === 'epa_bkt_pattern', 'source=epa_bkt_pattern');
  assert(sug.match_quality === 'good', 'match_quality=good (לא partial)');
  assert(sug.confidence === 'high', 'confidence=high מועבר מ-EPA trigger');
  assert(sug.details && sug.details.confused_pair && sug.details.confused_pair[0] === 'מ',
    'details.confused_pair מועבר נכון');
}

// ────────────────────────────────────────────
// בלוק 5 — Priority: letter_knowledge > letter_cluster > decoding > fluency > phonological
// ────────────────────────────────────────────
header('5. priority order (letter_knowledge מנצח את phonological)');
{
  // נשלח 2 triggers — אחד phonological (יותר רחב), אחד letter_knowledge (יותר ממוקד).
  // לפי priority — letter_knowledge ראשון.
  const { win } = loadAssessmentsModule([
    { patternId: 'phonological', details: { error_rate: 0.5 }, confidence: 'med' },
    { patternId: 'letter_knowledge', details: { confused_pair: ['ב', 'פ'] }, confidence: 'med' }
  ]);
  const A = win.AvneiAssessments;

  A.recordMOYAttempt('stu-pri', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-pri', { task_3: { score: 3 }, task_4: { score: 5 } });

  const sug = A.getSuggestedInterventionForAssessment('stu-pri');
  assert(sug.patternId === 'letter_knowledge',
    'letter_knowledge נבחר על-פני phonological (priority[0])');
}

{
  // letter_cluster + decoding → letter_cluster ראשון (priority[1])
  const { win } = loadAssessmentsModule([
    { patternId: 'decoding', details: { context_value: 'medial' }, confidence: 'med' },
    { patternId: 'letter_cluster', details: { weak_letters: ['ר','ד','ז'] }, confidence: 'high' }
  ]);
  const A = win.AvneiAssessments;
  A.recordMOYAttempt('stu-pri2', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-pri2', { task_3: { score: 3 }, task_4: { score: 5 } });
  const sug = A.getSuggestedInterventionForAssessment('stu-pri2');
  assert(sug.patternId === 'letter_cluster',
    'letter_cluster נבחר על-פני decoding (priority[1] vs [2])');
}

// ────────────────────────────────────────────
// בלוק 6 — taskId filter
// ────────────────────────────────────────────
header('6. taskId filter');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;

  // attempts: רק task_3 נכשלת, task_4 עוברת
  // task_3 score=2 (fail), task_4 score=18 (pass)
  A.recordMOYAttempt('stu-t3', { task_3: { score: 2 }, task_4: { score: 18 } });
  A.recordMOYAttempt('stu-t3', { task_3: { score: 3 }, task_4: { score: 18 } });

  // overall = fail כי לפחות אחת fail
  const sugAny = A.getSuggestedInterventionForAssessment('stu-t3');
  assert(sugAny !== null, 'בלי taskId → יש הצעה (overall fail)');
  assert(sugAny.based_on_failed_tasks.length === 1 && sugAny.based_on_failed_tasks[0] === 'task_3',
    'based_on_failed_tasks = [task_3] בלבד');

  const sug3 = A.getSuggestedInterventionForAssessment('stu-t3', 'task_3');
  assert(sug3 !== null, 'taskId=task_3 (שנכשלה) → יש הצעה');

  const sug4 = A.getSuggestedInterventionForAssessment('stu-t3', 'task_4');
  assert(sug4 === null, 'taskId=task_4 (שעברה) → null');
}

// ────────────────────────────────────────────
// בלוק 7 — שני tasks fail → notice משולב
// ────────────────────────────────────────────
header('7. שני tasks fail → notice משולב');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  A.recordMOYAttempt('stu-both', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-both', { task_3: { score: 3 }, task_4: { score: 5 } });
  const sug = A.getSuggestedInterventionForAssessment('stu-both');
  assert(sug.based_on_failed_tasks.length === 2,
    'based_on_failed_tasks כולל שני tasks');
  assert(sug.notice.indexOf('3 ו-4') !== -1 || sug.notice.indexOf('משימות') !== -1,
    'notice מציין שכמה משימות נכשלו');
}

// ────────────────────────────────────────────
// בלוק 8 — Auto-save: recordMOYAttempt → state.moy[id].suggested_intervention
// ────────────────────────────────────────────
header('8. recordMOYAttempt שומר suggested_intervention אוטומטית');
{
  const { win, localStorage } = loadAssessmentsModule([
    { patternId: 'fluency', details: { median_ms: 4500 }, confidence: 'med' }
  ]);
  const A = win.AvneiAssessments;

  A.recordMOYAttempt('stu-auto', { task_3: { score: 2 }, task_4: { score: 4 } });
  // אחרי attempt 1 — לא צריך להיות suggestion
  let raw = JSON.parse(localStorage.getItem(A.STORAGE_KEY));
  assert(raw.moy['stu-auto'].suggested_intervention === null ||
         raw.moy['stu-auto'].suggested_intervention === undefined,
    'אחרי attempt 1 — suggested_intervention=null');

  A.recordMOYAttempt('stu-auto', { task_3: { score: 3 }, task_4: { score: 5 } });
  raw = JSON.parse(localStorage.getItem(A.STORAGE_KEY));
  const sug = raw.moy['stu-auto'].suggested_intervention;
  assert(sug && sug.patternId === 'fluency',
    'אחרי attempt 2 fail — suggested_intervention נשמר ל-localStorage (patternId=fluency)');
  assert(sug.source === 'epa_bkt_pattern',
    'source=epa_bkt_pattern (היה mock pattern)');
}

// ────────────────────────────────────────────
// בלוק 9 — Cleanup: 2nd attempt pass מנקה suggestion קודמת
// ────────────────────────────────────────────
header('9. ניסיון 2 pass → suggested_intervention=null (ניקוי)');
{
  const { win, localStorage } = loadAssessmentsModule([
    { patternId: 'letter_knowledge', details: { confused_pair: ['ד','ר'] }, confidence: 'med' }
  ]);
  const A = win.AvneiAssessments;

  // attempt 1 fail · attempt 2 fail → suggestion נשמרת
  A.recordMOYAttempt('stu-clean', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-clean', { task_3: { score: 3 }, task_4: { score: 5 } });
  let raw = JSON.parse(localStorage.getItem(A.STORAGE_KEY));
  assert(raw.moy['stu-clean'].suggested_intervention !== null,
    'אחרי 2 fails — suggestion נשמרת');

  // attempt 3 pass → suggestion מתנקה
  A.recordMOYAttempt('stu-clean', { task_3: { score: 9 }, task_4: { score: 17 } });
  raw = JSON.parse(localStorage.getItem(A.STORAGE_KEY));
  assert(raw.moy['stu-clean'].suggested_intervention === null,
    'אחרי attempt 3 pass — suggested_intervention=null');
}

// ────────────────────────────────────────────
// בלוק 10 — getMOYStatus חושף את ה-suggested_intervention
// ────────────────────────────────────────────
header('10. getMOYStatus כולל suggested_intervention');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;

  // תלמידה לא נמדדה
  const s1 = A.getMOYStatus('stu-unmeasured');
  assert(s1.measured === false, 'measured=false');
  assert(s1.suggested_intervention === null,
    'תלמידה לא נמדדה → suggested_intervention=null ב-status');

  // תלמידה עם 2 fails
  A.recordMOYAttempt('stu-st', { task_3: { score: 2 }, task_4: { score: 4 } });
  A.recordMOYAttempt('stu-st', { task_3: { score: 3 }, task_4: { score: 5 } });
  const s2 = A.getMOYStatus('stu-st');
  assert(s2.measured === true, 'measured=true');
  assert(s2.suggested_intervention !== null,
    'getMOYStatus חושף את suggested_intervention (fallback phonological)');
  assert(s2.suggested_intervention.patternId === 'phonological',
    'patternId=phonological (אין mock AvneiInterventions)');
}

// ────────────────────────────────────────────
// בלוק 11 — No regressions: 51/51 הקיימים עדיין רלוונטיים
// (sanity: API החדש לא שובר את ה-API הישן)
// ────────────────────────────────────────────
header('11. Sanity — API ישן נשמר');
{
  const { win } = loadAssessmentsModule();
  const A = win.AvneiAssessments;
  assert(typeof A.recordMOYAttempt === 'function', 'recordMOYAttempt עדיין קיים');
  assert(typeof A.getMOYStatus === 'function', 'getMOYStatus עדיין קיים');
  assert(typeof A.getDueAssessments === 'function', 'getDueAssessments עדיין קיים');
  assert(typeof A.statusFor === 'function', 'statusFor עדיין קיים');
  assert(typeof A.enrichResults === 'function', 'enrichResults עדיין קיים');
  assert(A.STORAGE_KEY === 'underwater-app:assessments', 'STORAGE_KEY נשמר');
  assert(A.FIVE_WEEKS_MS === 5 * 7 * 24 * 60 * 60 * 1000, 'FIVE_WEEKS_MS נשמר');
}

// ────────────────────────────────────────────
// סיכום
// ────────────────────────────────────────────
console.log('\n=========================================');
console.log(`Total: ${pass + fail} · ✓ ${pass} · ✗ ${fail}`);
if (fail === 0) {
  console.log('🟢 כל הבדיקות עברו.');
  process.exit(0);
} else {
  console.error('🔴 ' + fail + ' בדיקות נכשלו.');
  process.exit(1);
}
