// ============================================================
// scripts/test-bkt-letters.js — Smoke test למשימה A.4
// Sub-BKT פר-אות, הרחבה מ-5 ל-22 אותיות בסטרנד פונולוגיה.
// מטרה: לוודא ש-22 האותיות פעילות, ingestEvent מזהה אות חדשה (ש/ל/א),
// 3 ה-API החדשים עובדים, ומיגרציה non-destructive ל-state ישן.
// Backwards compat: A0.1's iteration over per_letter ממשיכה לעבוד.
// ============================================================
const fs = require('fs');
const path = require('path');

global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};

const bktCode = fs.readFileSync(path.join(__dirname, '../js/shared/bkt.js'), 'utf-8');
eval(bktCode);
const BKT = global.window.AvneiBKT;

let passed = 0, failed = 0;
function ok(label, cond, detail) {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}` + (detail ? `\n     ${detail}` : '')); }
}
function divider(label) {
  console.log('\n' + '='.repeat(60));
  console.log(label);
  console.log('='.repeat(60));
}
function reset() {
  global.localStorage._data = {};
}

// ============================================================
// 1) 22 האותיות נטענות לאי 3 ול-strand 1
// ============================================================
divider('1) אתחול — 22 אותיות ב-state חדש');
reset();
// מפעילים event אחד כדי שייווצר state
BKT.ingestEvent({
  student_id: 'test1', session_id: 'sess-A',
  primary_island_id: 3, target_letter: 'מ',
  is_correct: true, response_time_ms: 3000,
});

const dump1 = BKT.dump();
const island3 = dump1.island['test1'] && dump1.island['test1'][3];
const strand1 = dump1.strand['test1'] && dump1.strand['test1'][1];

ok('island 3 קיים אחרי event', !!island3);
ok('island 3.per_letter קיים', !!(island3 && island3.per_letter));
const islandLetters = island3 ? Object.keys(island3.per_letter).length : 0;
ok(`island 3 כולל 22 אותיות (קיבל ${islandLetters})`, islandLetters === 22);

ok('strand 1 קיים אחרי event', !!strand1);
ok('strand 1.per_letter קיים', !!(strand1 && strand1.per_letter));
const strandLetters = strand1 ? Object.keys(strand1.per_letter).length : 0;
ok(`strand 1 כולל 22 אותיות (קיבל ${strandLetters})`, strandLetters === 22);

ok('א ב ג ד ה כולן ב-per_letter (strand 1)',
  strand1 && ['א','ב','ג','ד','ה'].every(l => strand1.per_letter[l]));
ok('ת ש ר ק כולן ב-per_letter (strand 1)',
  strand1 && ['ת','ש','ר','ק'].every(l => strand1.per_letter[l]));

// ============================================================
// 2) ingestEvent על אות חדשה (לא ב-5 הישנות)
// ============================================================
divider('2) ingestEvent על אות חדשה — ש');
reset();
const sResult = BKT.ingestEvent({
  student_id: 'test2', session_id: 'sess-A',
  primary_island_id: 3, target_letter: 'ש',
  is_correct: true, response_time_ms: 2500,
});
ok('event על ש לא מחזיר null (קודם היה null)', sResult !== null);

const sLetter = BKT.getLetterState('test2', 'ש');
ok('getLetterState(ש).attempts === 1', sLetter && sLetter.attempts === 1);
ok('getLetterState(ש).correct === 1', sLetter && sLetter.correct === 1);
ok('getLetterState(ש).pKnown > 0.12 (מעודכן מ-pL0)', sLetter && sLetter.pKnown > 0.12);

// 6 פעמים נכון על ל — pKnown אמור להגיע ל-mastery
['ל','ל','ל','ל','ל','ל'].forEach(() => {
  BKT.ingestEvent({
    student_id: 'test2', session_id: 'sess-A',
    primary_island_id: 3, target_letter: 'ל',
    is_correct: true, response_time_ms: 2000,
  });
});
const lLetter = BKT.getLetterState('test2', 'ל');
ok(`getLetterState(ל) אחרי 6 נכונים — pKnown ≥ 0.90 (got ${lLetter && lLetter.pKnown.toFixed(2)})`,
  lLetter && lLetter.pKnown >= 0.90);

// ============================================================
// 3) getWeakestLetters — ברירת מחדל (רק attempts >= 3)
// ============================================================
divider('3) getWeakestLetters — ברירת מחדל (תורגלו בלבד)');
reset();
// 3 ניסיונות שגויים על א/ע/ס + 5 נכונים על מ — א/ע/ס חלשות, מ חזק
['א','א','א','ע','ע','ע','ס','ס','ס'].forEach(l => {
  BKT.ingestEvent({
    student_id: 'test3', session_id: 'sess-A',
    primary_island_id: 3, target_letter: l,
    is_correct: false, response_time_ms: 4000,
  });
});
[1,2,3,4,5].forEach(() => {
  BKT.ingestEvent({
    student_id: 'test3', session_id: 'sess-A',
    primary_island_id: 3, target_letter: 'מ',
    is_correct: true, response_time_ms: 2000,
  });
});

const weakDefault = BKT.getWeakestLetters('test3', 5);
ok(`weakest default: 3 אותיות (א/ע/ס) — לא כולל אותיות לא-תורגלו (got ${weakDefault.length})`,
  weakDefault.length === 3);
ok('weakest default ממוין pKnown עולה (החלש ראשון)',
  weakDefault.length === 3 && weakDefault[0].pKnown <= weakDefault[1].pKnown && weakDefault[1].pKnown <= weakDefault[2].pKnown);
ok('weakest default — מ לא ברשימה (חזקה)',
  !weakDefault.find(e => e.letter === 'מ'));

// ============================================================
// 4) getWeakestLetters — includeUntouched
// ============================================================
divider('4) getWeakestLetters — includeUntouched');
const weakInclude = BKT.getWeakestLetters('test3', 25, { includeUntouched: true });
// 22 אותיות - 1 (מ, חזקה — לא נכנסת) = 21 אם כולן < mastery
// אבל מ עוד לא mastered בהכרח, אז נבדוק >= 18
ok(`weakest includeUntouched: כולל אותיות לא-תורגלו (got ${weakInclude.length})`,
  weakInclude.length >= 18);
ok('weakest includeUntouched: אותיות לא-תורגלו עם attempts=0 כלולות',
  weakInclude.some(e => e.attempts === 0));

// ============================================================
// 5) getLetterMasteryDistribution — 4 דליים
// ============================================================
divider('5) getLetterMasteryDistribution — 4 דליים');
const dist = BKT.getLetterMasteryDistribution('test3');
ok(`distribution.total === 22 (got ${dist.total})`, dist.total === 22);
const sum = dist.mastered + dist.in_progress + dist.weak + dist.untouched;
ok(`סך הקבוצות === 22 (mastered=${dist.mastered}, in_progress=${dist.in_progress}, weak=${dist.weak}, untouched=${dist.untouched})`,
  sum === 22);
ok(`א/ע/ס בקבוצת weak (got: ${dist.by_bucket.weak.join(',')})`,
  ['א','ע','ס'].every(l => dist.by_bucket.weak.includes(l)));
ok(`אותיות לא-תורגלו ב-untouched (₪>=17)`,
  dist.by_bucket.untouched.length >= 17);

// ============================================================
// 6) getLetterState — מחזיר null לאות לא חוקית
// ============================================================
divider('6) getLetterState — input validation');
const invalid = BKT.getLetterState('test3', 'X');
ok('getLetterState על אות לא-עברית מחזיר null', invalid === null);
const noStudent = BKT.getLetterState('nonexistent', 'מ');
// תלמידה שאינה קיימת — getPerLetterState מחזיר null → getLetterState מחזיר null
ok('getLetterState על תלמידה לא-קיימת מחזיר null', noStudent === null);

// ============================================================
// 7) Backwards compat — A0.1's iteration over per_letter עוד עובד
// ============================================================
divider('7) Backwards compat — A0.1 suggestFromBKT logic');
reset();
// 5 ניסיונות נכונים על 3 אותיות שונות
['מ','מ','מ','ר','ר','ר','ב','ב','ב'].forEach(l => {
  BKT.ingestEvent({
    student_id: 'a01-test', session_id: 'sess-A',
    primary_island_id: 3, target_letter: l,
    is_correct: true, response_time_ms: 2000,
  });
});

// סימולציה של A0.1 — לקרוא per_letter מ-localStorage ב-island 3
const raw = JSON.parse(global.localStorage._data['avnei-bkt-v1']);
const i3 = raw['a01-test'][3];
ok('per_letter על island 3 קיים', !!i3.per_letter);
const letters = Object.entries(i3.per_letter);
ok(`Object.entries(per_letter).length === 22 (A0.1 רואה 22, ${letters.length})`,
  letters.length === 22);
const practiced = letters.filter(([, st]) => st.attempts >= 3);
ok(`practiced filter (attempts >= 3): 3 אותיות (מ/ר/ב)`,
  practiced.length === 3);
const knownLetters = practiced.filter(([, st]) => st.pKnown >= 0.70);
ok(`known filter (pKnown >= 0.70): 3 אותיות (כולן נשלטו)`,
  knownLetters.length === 3);
const ratio = knownLetters.length / practiced.length;
ok(`ratio = ${ratio} → alpha_2 = 1 (זהה ל-A0.1 לפני A.4)`, ratio >= 0.90);

// ============================================================
// 8) Backwards compat — checkMastery על island 3 עוד עובד
// ============================================================
divider('8) Backwards compat — checkMastery(student, 3)');
reset();
['מ','מ','מ','מ','מ','מ'].forEach(() => {
  BKT.ingestEvent({
    student_id: 'mastery-test', session_id: 'sess-A',
    primary_island_id: 3, target_letter: 'מ',
    is_correct: true, response_time_ms: 2000,
  });
});
const m = BKT.checkMastery('mastery-test', 3);
ok('checkMastery מחזיר per_letter (legacy 5 אותיות)', !!m.per_letter);
const m5keys = Object.keys(m.per_letter).length;
ok(`checkMastery.per_letter כולל את 5 ה-ISLAND_3_LETTERS (got ${m5keys})`,
  m5keys === 5);
ok('checkMastery.per_letter.מ.mastered === true (BKT 99%+)',
  m.per_letter.מ && m.per_letter.מ.mastered);

// ============================================================
// 9) מיגרציה non-destructive — state ישן עם 5 אותיות
// ============================================================
divider('9) מיגרציה non-destructive — state ישן');
reset();
// סימולציה של state ישן: רק 5 אותיות (כמו A.1, לפני A.4)
const oldState = {
  'legacy-kid': {
    3: {
      per_letter: {
        'מ': { pKnown: 0.95, attempts: 10, correct: 9, wrong: 1, responseTimesMs: [2100, 1900], masteryAchievedAt: Date.now() - 1000 },
        'ק': { pKnown: 0.85, attempts: 8, correct: 7, wrong: 1, responseTimesMs: [2200], masteryAchievedAt: null },
        'ב': { pKnown: 0.50, attempts: 4, correct: 2, wrong: 2, responseTimesMs: [3500], masteryAchievedAt: null },
        'ר': { pKnown: 0.30, attempts: 5, correct: 1, wrong: 4, responseTimesMs: [4500], masteryAchievedAt: null },
        'ת': { pKnown: 0.12, attempts: 0, correct: 0, wrong: 0, responseTimesMs: [], masteryAchievedAt: null },
      },
      aggregate_pKnown: 0.54,
      total_attempts: 27,
      sessionsAtMastery: 0,
      lastSessionId: 'sess-old',
      masteryAchievedAt: null,
    },
  },
};
global.localStorage._data['avnei-bkt-v1'] = JSON.stringify(oldState);

// קוראים ל-getIslandState — מצופה למלא 17 אותיות חסרות
const migrated = BKT.getIslandState('legacy-kid', 3);
ok('legacy state נטען', !!migrated);
ok(`per_letter מורחב ל-22 (היה 5, עכשיו ${Object.keys(migrated.per_letter).length})`,
  Object.keys(migrated.per_letter).length === 22);
// הערכים הקיימים נשמרו
ok('מ.pKnown נשמר ב-0.95 (לא נדרס)', migrated.per_letter['מ'].pKnown === 0.95);
ok('מ.attempts נשמר ב-10', migrated.per_letter['מ'].attempts === 10);
ok('מ.masteryAchievedAt נשמר (לא null)', migrated.per_letter['מ'].masteryAchievedAt !== null);
ok('ר.pKnown נשמר ב-0.30', migrated.per_letter['ר'].pKnown === 0.30);
// 17 חדשות באו עם ברירות מחדל
ok('א (חדשה) קיימת עם pL0=0.10', migrated.per_letter['א'].pKnown === 0.10);
ok('א (חדשה) attempts=0', migrated.per_letter['א'].attempts === 0);

// ============================================================
// 10) ingestEvent על אות חדשה אחרי מיגרציה
// ============================================================
divider('10) ingestEvent על אות חדשה אחרי מיגרציה');
const evtResult = BKT.ingestEvent({
  student_id: 'legacy-kid', session_id: 'sess-new',
  primary_island_id: 3, target_letter: 'ש',
  is_correct: true, response_time_ms: 2400,
});
ok('event על ש לא נכשל אחרי מיגרציה', evtResult !== null);
const shState = BKT.getLetterState('legacy-kid', 'ש');
ok('getLetterState(ש) attempts=1 אחרי המיגרציה',
  shState && shState.attempts === 1);
// וודוא ש-מ עדיין שלמה אחרי שש קיבלה event
const mAfter = BKT.getLetterState('legacy-kid', 'מ');
ok('מ עדיין mastered (לא נמחק)', mAfter && mAfter.mastered);
ok('מ.attempts עדיין 10 (לא נדרס)', mAfter && mAfter.attempts === 10);

// ============================================================
// 11) Dual-write — שני המפתחות מתעדכנים
// ============================================================
divider('11) Dual-write — strand 1 ו-island 3');
const finalIsland = JSON.parse(global.localStorage._data['avnei-bkt-v1'])['legacy-kid'][3];
const finalStrand = JSON.parse(global.localStorage._data['avnei-bkt-strand-v1'])['legacy-kid'][1];
ok('island 3 כולל את ש עם attempts=1',
  finalIsland.per_letter['ש'].attempts === 1);
ok('strand 1 כולל את ש עם attempts=1 (mirror)',
  finalStrand && finalStrand.per_letter['ש'].attempts === 1);
ok('strand 1.per_letter כולל 22 אותיות',
  finalStrand && Object.keys(finalStrand.per_letter).length === 22);

// ============================================================
// 12) קבועים חשופים
// ============================================================
divider('12) קבועים חשופים');
ok(`ALL_HEBREW_LETTERS_22 = 22 אותיות (got ${BKT.ALL_HEBREW_LETTERS_22.length})`,
  BKT.ALL_HEBREW_LETTERS_22.length === 22);
ok('ALL_HEBREW_LETTERS_22 כולל א', BKT.ALL_HEBREW_LETTERS_22.includes('א'));
ok('ALL_HEBREW_LETTERS_22 כולל ת', BKT.ALL_HEBREW_LETTERS_22.includes('ת'));
ok('ISLAND_3_LETTERS עדיין 5 (legacy)', BKT.ISLAND_3_LETTERS.length === 5);
ok('LETTER_WEAK_THRESHOLD = 0.70', BKT.LETTER_WEAK_THRESHOLD === 0.70);
ok('LETTER_MIN_ATTEMPTS_FOR_BUCKET = 3', BKT.LETTER_MIN_ATTEMPTS_FOR_BUCKET === 3);

// ============================================================
divider('סיכום');
console.log(`עברו: ${passed} · נכשלו: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
