#!/usr/bin/env node
// test-interventions.js — B.7 smoke tests
//
// בדיקות אוטומטיות ל-interventions.js: API surface, 5 trigger detectors,
// group aggregation, script interpolation, recordIntervention persistence,
// 5 ה-JSONים נטענים. סה"כ 30+ assertions.
//
// usage:
//   node avnei-yesod/underwater-app/scripts/test-interventions.js

'use strict';

// ============================================================================
// Mock environment (localStorage + AvneiBKT + AvneiEPA)
// ============================================================================

const _localStore = {};
global.localStorage = {
  getItem: function (k) { return _localStore[k] || null; },
  setItem: function (k, v) { _localStore[k] = String(v); },
  removeItem: function (k) { delete _localStore[k]; },
  clear: function () { for (const k of Object.keys(_localStore)) delete _localStore[k]; }
};

function clearLocalStorage() {
  for (const k of Object.keys(_localStore)) delete _localStore[k];
}

function setupBktMock(opts) {
  opts = opts || {};
  global.AvneiBKT = {
    getLetterState: function (studentId, letter) {
      const s = (opts.perLetter && opts.perLetter[studentId]) || null;
      return (s && s[letter]) ? s[letter] : null;
    },
    getStrandState: function (studentId, strandId) {
      return (opts.strands && opts.strands[studentId] && opts.strands[studentId][strandId]) || null;
    },
    getLetterMasteryDistribution: function (studentId) {
      return (opts.distributions && opts.distributions[studentId]) || null;
    }
  };
}

function setupEpaMock(opts) {
  opts = opts || {};
  global.AvneiEPA = {
    getEPA: function (studentId) {
      return (opts.epaByStudent && opts.epaByStudent[studentId]) || {};
    },
    getDominantPattern: function (studentId, islandId, threshold) {
      const map = opts.dominantPatterns || {};
      const key = studentId + ':' + islandId;
      const dom = map[key];
      if (!dom) return null;
      if (threshold && dom.percent < threshold) return null;
      return dom;
    }
  };
}

function clearMocks() {
  global.AvneiBKT = null;
  global.AvneiEPA = null;
}

// ============================================================================
// טעינת ה-module
// ============================================================================

global.window = global;
const path = require('path');
const modPath = path.resolve(__dirname, '..', 'js', 'shared', 'interventions.js');
delete require.cache[modPath];
const Interventions = require(modPath);

// ============================================================================
// Test runner
// ============================================================================

let total = 0;
let passed = 0;
const failures = [];

function assert(label, cond, detail) {
  total++;
  if (cond) {
    passed++;
    console.log('  ✅ ' + label);
  } else {
    failures.push(label + (detail ? ' — ' + detail : ''));
    console.log('  ❌ ' + label + (detail ? ' — ' + detail : ''));
  }
}

function section(name) {
  console.log('\n📦 ' + name);
}

// ============================================================================
// BLOCK 1 — API surface
// ============================================================================

section('BLOCK 1 — API surface (9 פונקציות + 4 constants)');
[
  'loadScript', 'preloadAll',
  'detectForStudent', 'detectGroupTriggers', 'interpolateScript',
  'recordIntervention', 'getInterventionsFor', 'resetInterventions'
].forEach(function (fn) {
  assert('API.' + fn + ' קיים', typeof Interventions[fn] === 'function');
});

assert('PATTERN_IDS = 8 (5 ישנים + 3 T6)', Array.isArray(Interventions.PATTERN_IDS) && Interventions.PATTERN_IDS.length === 8);
assert('PATTERN_IDS מכיל את כל החמשה הישנים',
  ['phonological', 'letter_knowledge', 'decoding', 'fluency', 'letter_cluster']
    .every(function (id) { return Interventions.PATTERN_IDS.indexOf(id) >= 0; }));
assert('PATTERN_IDS מכיל את שלושת ה-T6',
  ['comprehension', 'wrong_plural', 'gender_mismatch']
    .every(function (id) { return Interventions.PATTERN_IDS.indexOf(id) >= 0; }));
assert('CONFUSED_PAIRS מערך >= 5', Array.isArray(Interventions.CONFUSED_PAIRS) && Interventions.CONFUSED_PAIRS.length >= 5);
assert('STORAGE_KEY הוא string', typeof Interventions.STORAGE_KEY === 'string');
assert('INTERVENTION_DEFAULTS object', Interventions.INTERVENTION_DEFAULTS && typeof Interventions.INTERVENTION_DEFAULTS === 'object');

// ============================================================================
// BLOCK 2 — loadScript טוען 5 JSONים מהדיסק
// ============================================================================

section('BLOCK 2 — loadScript טוען 8 JSONים מ-fs');
Interventions._clearCache();
['phonological', 'letter_knowledge', 'decoding', 'fluency', 'letter_cluster',
 'comprehension', 'wrong_plural', 'gender_mismatch'].forEach(function (id) {
  const s = Interventions.loadScript(id);
  assert(id + ' נטען', !!s && s.pattern_id === id);
  if (s) {
    assert(id + ' עם title', typeof s.title === 'string' && s.title.length > 0);
    assert(id + ' עם 5 שלבים', Array.isArray(s.stages) && s.stages.length === 5);
    assert(id + ' עם trigger_logic', !!s.trigger_logic);
  }
});

assert('loadScript בטח לא חוזר עם patternId לא חוקי', Interventions.loadScript('nonexistent') === null);

// ============================================================================
// BLOCK 3 — _detectPhonological
// ============================================================================

section('BLOCK 3 — Phonological detector');
clearMocks();
// אין EPA = אין trigger
assert('בלי EPA → null', Interventions._detectPhonological('stu-1') === null);

setupEpaMock({
  epaByStudent: {
    'stu-1': {
      '3': {
        'מ': { failure: { Sound: 8, Shape: 4 } },
        'ב': { failure: { Sound: 5, Shape: 2 } }
      }
    }
  }
});
// סה"כ Sound=13, Shape=6 → error_rate=13/19=68% → trigger
const phonRes = Interventions._detectPhonological('stu-1');
assert('Phonological trigger מתפעל (sound=13 + 68% rate)', phonRes && phonRes.patternId === 'phonological');
assert('Phonological details.sound_failures=13', phonRes && phonRes.details.sound_failures === 13);
assert('Phonological details.error_rate ~ 0.68', phonRes && Math.abs(phonRes.details.error_rate - 13 / 19) < 0.001);

// פחות מ-10 Sound = לא trigger
setupEpaMock({
  epaByStudent: {
    'stu-2': { '3': { 'מ': { failure: { Sound: 5, Shape: 1 } } } }
  }
});
assert('Sound=5 < 10 → no trigger', Interventions._detectPhonological('stu-2') === null);

// 10 Sound אבל 5% error rate = לא trigger
setupEpaMock({
  epaByStudent: {
    'stu-3': { '3': { 'מ': { failure: { Sound: 10, Shape: 200 } } } }
  }
});
assert('rate=10/210=4.7% < 30% → no trigger', Interventions._detectPhonological('stu-3') === null);

// ============================================================================
// BLOCK 4 — _detectLetterKnowledge
// ============================================================================

section('BLOCK 4 — Letter Knowledge detector');
clearMocks();
setupBktMock({
  perLetter: {
    'stu-1': {
      'מ': { letter: 'מ', pKnown: 0.20, attempts: 8 },
      'ם': { letter: 'ם', pKnown: 0.30, attempts: 6 },
      'נ': { letter: 'נ', pKnown: 0.85, attempts: 10 }
    }
  }
});

const lkRes = Interventions._detectLetterKnowledge('stu-1');
assert('Letter Knowledge מחזיר מערך', Array.isArray(lkRes));
assert('Letter Knowledge מזהה מ↔ם', lkRes.length >= 1 && lkRes[0].details.confused_pair.join('-') === 'מ-ם');
assert('Letter Knowledge details כולל example_a', lkRes.length >= 1 && typeof lkRes[0].details.example_a === 'string' && lkRes[0].details.example_a.length > 0);

// אם רק אחת מהזוג חלשה — לא trigger
setupBktMock({
  perLetter: {
    'stu-2': {
      'מ': { letter: 'מ', pKnown: 0.20, attempts: 8 },
      'ם': { letter: 'ם', pKnown: 0.80, attempts: 8 }
    }
  }
});
const lk2 = Interventions._detectLetterKnowledge('stu-2');
assert('רק 1 מהזוג חלשה → לא trigger', lk2.length === 0);

// מעט ניסיונות → לא trigger
setupBktMock({
  perLetter: {
    'stu-3': {
      'מ': { letter: 'מ', pKnown: 0.20, attempts: 2 },
      'ם': { letter: 'ם', pKnown: 0.30, attempts: 2 }
    }
  }
});
assert('attempts < 3 → לא trigger', Interventions._detectLetterKnowledge('stu-3').length === 0);

// ============================================================================
// BLOCK 5 — _detectDecoding
// ============================================================================

section('BLOCK 5 — Decoding (context) detector');
clearMocks();
setupEpaMock({
  epaByStudent: { 'stu-1': { '3': { 'ל': { failure: {}, context: {}, task: {} } } } },
  dominantPatterns: {
    'stu-1:3': { axis: 'context', value: 'medial', percent: 0.72, count: 13, total: 18 }
  }
});
const decRes = Interventions._detectDecoding('stu-1');
assert('Decoding מזהה medial', decRes && decRes.patternId === 'decoding' && decRes.details.context_value === 'medial');
assert('Decoding details.percent=0.72', decRes && Math.abs(decRes.details.percent - 0.72) < 0.001);

// isolation = לא trigger
setupEpaMock({
  epaByStudent: { 'stu-2': { '3': {} } },
  dominantPatterns: {
    'stu-2:3': { axis: 'context', value: 'isolation', percent: 0.80, count: 10, total: 12 }
  }
});
assert('isolation → לא trigger', Interventions._detectDecoding('stu-2') === null);

// failure axis = לא trigger (decoding דורש context)
setupEpaMock({
  epaByStudent: { 'stu-3': { '3': {} } },
  dominantPatterns: {
    'stu-3:3': { axis: 'failure', value: 'Sound', percent: 0.70, count: 14, total: 20 }
  }
});
assert('axis=failure → לא decoding', Interventions._detectDecoding('stu-3') === null);

// ============================================================================
// BLOCK 6 — _detectFluency
// ============================================================================

section('BLOCK 6 — Fluency detector (P75 class)');
clearMocks();
setupBktMock({
  strands: {
    'stu-1': { 1: { pKnown: 0.7, attempts: 30, correct: 25, wrong: 5,
                     responseTimesMs: [2500, 2800, 3100, 3300, 3500, 3700, 4100, 4400, 4700, 5000] } }
  }
});
// median = 3600, class P75 = 3000 → median > P75 + accuracy=83% > 70% → trigger
const fluRes = Interventions._detectFluency('stu-1', 3000);
assert('Fluency trigger (median=3600 > P75=3000, acc 83%)',
  fluRes && fluRes.patternId === 'fluency' && fluRes.details.median_ms === 3600);

// אם median <= P75 → לא trigger
const fluRes2 = Interventions._detectFluency('stu-1', 5000);
assert('median <= P75 → לא trigger', fluRes2 === null);

// accuracy < 70% → לא trigger
setupBktMock({
  strands: {
    'stu-1': { 1: { pKnown: 0.7, attempts: 30, correct: 15, wrong: 15,
                     responseTimesMs: [2500, 2800, 3100, 3300, 3500, 3700, 4100, 4400, 4700, 5000] } }
  }
});
assert('accuracy=50% < 70% → לא trigger', Interventions._detectFluency('stu-1', 3000) === null);

// פחות מ-5 דגימות → לא trigger
setupBktMock({
  strands: {
    'stu-1': { 1: { pKnown: 0.7, attempts: 4, correct: 4, wrong: 0,
                     responseTimesMs: [2500, 2800, 3100, 3300] } }
  }
});
assert('פחות מ-5 דגימות → לא trigger', Interventions._detectFluency('stu-1', 2000) === null);

// ============================================================================
// BLOCK 7 — _detectLetterCluster
// ============================================================================

section('BLOCK 7 — Letter Cluster detector');
clearMocks();
setupBktMock({
  distributions: {
    'stu-1': {
      mastered: 3, in_progress: 5, weak: 4, untouched: 10,
      by_bucket: { mastered: ['ש', 'ל', 'נ'], in_progress: ['א', 'ב', 'ג', 'ד', 'ה'],
                   weak: ['ז', 'ח', 'ט', 'י'], untouched: [] },
      total: 22
    }
  }
});
const lcRes = Interventions._detectLetterCluster('stu-1');
assert('Letter Cluster מזהה 4 אותיות חלשות', lcRes && lcRes.details.count === 4);
assert('Letter Cluster כולל top-3', lcRes && lcRes.details.weak_letters.length === 3);
assert('Letter Cluster confidence=med (4 weak)', lcRes && lcRes.confidence === 'med');

// weak=2 → לא trigger
setupBktMock({
  distributions: {
    'stu-2': { mastered: 5, in_progress: 5, weak: 2, untouched: 10,
                by_bucket: { mastered: [], in_progress: [], weak: ['ז', 'ח'], untouched: [] }, total: 22 }
  }
});
assert('weak=2 < 3 → לא trigger', Interventions._detectLetterCluster('stu-2') === null);

// ============================================================================
// BLOCK 8 — detectGroupTriggers (class-level)
// ============================================================================

section('BLOCK 8 — detectGroupTriggers (3+ ילדות עם אותו דפוס)');
clearMocks();
// 3 תלמידות עם מ↔ם חלשות
setupBktMock({
  perLetter: {
    'stu-a': { 'מ': { pKnown: 0.20, attempts: 8 }, 'ם': { pKnown: 0.30, attempts: 6 } },
    'stu-b': { 'מ': { pKnown: 0.25, attempts: 7 }, 'ם': { pKnown: 0.15, attempts: 5 } },
    'stu-c': { 'מ': { pKnown: 0.10, attempts: 9 }, 'ם': { pKnown: 0.20, attempts: 8 } },
    'stu-d': { 'מ': { pKnown: 0.85, attempts: 10 }, 'ם': { pKnown: 0.90, attempts: 10 } }  // לא חלשה
  }
});
setupEpaMock({ epaByStudent: {} });
const students = [
  { id: 'stu-a', name: 'מאיה' },
  { id: 'stu-b', name: 'נועה' },
  { id: 'stu-c', name: 'רותם' },
  { id: 'stu-d', name: 'שירה' }
];
const groups = Interventions.detectGroupTriggers(students);
const lkGroup = groups.find(function (g) { return g.patternId === 'letter_knowledge'; });
assert('detectGroupTriggers מזהה Letter Knowledge group', !!lkGroup);
assert('LK group כולל 3 תלמידות', lkGroup && lkGroup.students.length === 3);
assert('שירה לא בקבוצה', lkGroup && !lkGroup.students.some(function (s) { return s.id === 'stu-d'; }));
assert('groupCommonDetails.confused_pair=מ-ם', lkGroup && lkGroup.groupCommonDetails.confused_pair.join('-') === 'מ-ם');

// אם רק 2 תלמידות עם אותו זוג — לא group
setupBktMock({
  perLetter: {
    'stu-a': { 'מ': { pKnown: 0.20, attempts: 8 }, 'ם': { pKnown: 0.30, attempts: 6 } },
    'stu-b': { 'מ': { pKnown: 0.25, attempts: 7 }, 'ם': { pKnown: 0.15, attempts: 5 } }
  }
});
const groups2 = Interventions.detectGroupTriggers([
  { id: 'stu-a' }, { id: 'stu-b' }
]);
assert('2 תלמידות → no LK group', groups2.length === 0);

// ============================================================================
// BLOCK 9 — interpolateScript
// ============================================================================

section('BLOCK 9 — interpolateScript ממלא placeholders');
const lkScript = Interventions.loadScript('letter_knowledge');
const interp = Interventions.interpolateScript(lkScript,
  { confused_pair: ['מ', 'ם'], example_a: 'אֵם · מַיִם', example_b: 'לֶחֶם · יָם', distinction: 'מ פתוחה' }
);
const hookText = interp.stages[0].teacher_say;
assert('interpolate ממלא {letter_a}', hookText.indexOf('מ') >= 0 && hookText.indexOf('{letter_a}') < 0);
assert('interpolate ממלא {letter_b}', hookText.indexOf('ם') >= 0 && hookText.indexOf('{letter_b}') < 0);

const lcScript = Interventions.loadScript('letter_cluster');
const lcInterp = Interventions.interpolateScript(lcScript, {}, { weak_letters: ['ז', 'ח', 'ט'] });
const lcModel = lcInterp.stages[1].teacher_say;
// Letter cluster ה-Model אומר "ר — רֹאשׁ" כי זה דוגמה קבועה, אבל materials & first letter כן ממולאים
const personalized = JSON.stringify(lcInterp);
assert('interpolate ממלא {personalized_letters}', personalized.indexOf('ז · ח · ט') >= 0);
assert('interpolate ממלא {personalized_first_letter}', personalized.indexOf('{personalized_first_letter}') < 0);

// placeholder שלא נמצא — נשאר כפי שהוא
const fluScript = Interventions.loadScript('fluency');
const fluInterp = Interventions.interpolateScript(fluScript, {}, {});
assert('fluency ללא placeholders שעוברים שינוי', JSON.stringify(fluInterp).indexOf('{x_not_existing}') < 0);

// ============================================================================
// BLOCK 10 — recordIntervention + storage
// ============================================================================

section('BLOCK 10 — recordIntervention + getInterventionsFor');
clearLocalStorage();
const ok = Interventions.recordIntervention(['stu-a', 'stu-b', 'stu-c'], 'letter_knowledge', {
  pattern_details: { confused_pair: ['מ', 'ם'] },
  duration_minutes: 12,
  success_check: '4/5',
  teacher_note: 'מאיה התקדמה'
});
assert('recordIntervention מחזיר true', ok === true);

const recsA = Interventions.getInterventionsFor('stu-a');
assert('stu-a קיבלה רשומה', recsA.length === 1);
assert('הרשומה כוללת pattern', recsA[0].pattern === 'letter_knowledge');
assert('group_size=3', recsA[0].group_size === 3);
assert('group_students = 3 IDs', Array.isArray(recsA[0].group_students) && recsA[0].group_students.length === 3);
assert('teacher_note נשמר', recsA[0].teacher_note === 'מאיה התקדמה');

// stu-d שלא היתה בקבוצה — אין רשומה
assert('stu-d (לא בקבוצה) → 0 רשומות', Interventions.getInterventionsFor('stu-d').length === 0);

// reset לתלמידה אחת
Interventions.resetInterventions('stu-a');
assert('resetInterventions(stu-a) ניקה רק אותה', Interventions.getInterventionsFor('stu-a').length === 0);
assert('stu-b עדיין יש רשומה', Interventions.getInterventionsFor('stu-b').length === 1);

// reset הכל
Interventions.resetInterventions();
assert('resetInterventions() ניקה הכל', Interventions.getInterventionsFor('stu-b').length === 0);

// פטרן לא חוקי
assert('recordIntervention עם patternId לא חוקי → false',
  Interventions.recordIntervention(['stu-a'], 'invalid', {}) === false);

// ============================================================================
// BLOCK 11 — T6 detectors (comprehension / wrong_plural / gender_mismatch)
// ============================================================================

section('BLOCK 11 — T6: Comprehension / WrongPlural / GenderMismatch detectors');
clearMocks();

// בלי EPA = אין trigger
assert('comprehension בלי EPA → null', Interventions._detectComprehension('stu-t6') === null);

// Comprehension — unitKeys של characteristic_id (מורפולוגיה/הבנה, לא אות)
setupEpaMock({
  epaByStudent: {
    'stu-t6a': {
      '9': {
        'sep-w3-comp-c1': { failure: { Comprehension: 6 } },
        'sep-w4-comp-c2': { failure: { Comprehension: 4, Sound: 2 } }
      }
    }
  }
});
// Comprehension=10 >= 8, rate=10/12=83% >= 25% → trigger
const compRes = Interventions._detectComprehension('stu-t6a');
assert('Comprehension trigger (10 כשלים, 83%)', compRes && compRes.patternId === 'comprehension');
assert('Comprehension details.value_failures=10', compRes && compRes.details.value_failures === 10);
assert('Comprehension details.error_rate ~ 0.83', compRes && Math.abs(compRes.details.error_rate - 10 / 12) < 0.001);

// פחות מ-8 כשלים → לא trigger
setupEpaMock({
  epaByStudent: {
    'stu-t6b': { '9': { 'sep-w3-comp-c1': { failure: { Comprehension: 5 } } } }
  }
});
assert('Comprehension=5 < 8 → no trigger', Interventions._detectComprehension('stu-t6b') === null);

// 8 כשלים אבל שיעור נמוך → לא trigger
setupEpaMock({
  epaByStudent: {
    'stu-t6c': { '9': { 'sep-w3-comp-c1': { failure: { Comprehension: 8, Sound: 100 } } } }
  }
});
assert('rate=8/108=7% < 25% → no trigger', Interventions._detectComprehension('stu-t6c') === null);

// WrongPlural
setupEpaMock({
  epaByStudent: {
    'stu-t6d': {
      '9': { 'sep-w5-morph-c3': { failure: { WrongPlural: 7, Shape: 2 } } }
    }
  }
});
const wpRes = Interventions._detectWrongPlural('stu-t6d');
assert('WrongPlural trigger (7 כשלים, 78%)', wpRes && wpRes.patternId === 'wrong_plural');
assert('WrongPlural details.failure_value', wpRes && wpRes.details.failure_value === 'WrongPlural');

setupEpaMock({
  epaByStudent: {
    'stu-t6e': { '9': { 'sep-w5-morph-c3': { failure: { WrongPlural: 4 } } } }
  }
});
assert('WrongPlural=4 < 6 → no trigger', Interventions._detectWrongPlural('stu-t6e') === null);

// GenderMismatch
setupEpaMock({
  epaByStudent: {
    'stu-t6f': {
      '9': { 'sep-w6-morph-c4': { failure: { GenderMismatch: 6, Sound: 3 } } }
    }
  }
});
const gmRes = Interventions._detectGenderMismatch('stu-t6f');
assert('GenderMismatch trigger (6 כשלים, 67%)', gmRes && gmRes.patternId === 'gender_mismatch');

setupEpaMock({
  epaByStudent: {
    'stu-t6g': { '9': { 'sep-w6-morph-c4': { failure: { GenderMismatch: 6, Sound: 30 } } } }
  }
});
assert('GenderMismatch rate=6/36=17% < 25% → no trigger', Interventions._detectGenderMismatch('stu-t6g') === null);

// detectForStudent כולל את החדשים
setupEpaMock({
  epaByStudent: {
    'stu-t6h': {
      '9': {
        'sep-w3-comp-c1': { failure: { Comprehension: 12 } },
        'sep-w5-morph-c3': { failure: { WrongPlural: 8 } }
      }
    }
  }
});
setupBktMock({});
const t6Triggers = Interventions.detectForStudent('stu-t6h');
assert('detectForStudent מחזיר comprehension', t6Triggers.some(function (t) { return t.patternId === 'comprehension'; }));
assert('detectForStudent מחזיר wrong_plural', t6Triggers.some(function (t) { return t.patternId === 'wrong_plural'; }));

// ============================================================================
// BLOCK 12 — T6 group triggers (3+ ילדות עם אותו דפוס)
// ============================================================================

section('BLOCK 12 — T6: detectGroupTriggers לדפוסים החדשים');
clearMocks();
setupBktMock({});
setupEpaMock({
  epaByStudent: {
    'stu-g1': { '9': { 'sep-w3-comp-c1': { failure: { Comprehension: 10 } } } },
    'stu-g2': { '9': { 'sep-w4-comp-c2': { failure: { Comprehension: 9, Sound: 1 } } } },
    'stu-g3': { '9': { 'sep-w3-comp-c1': { failure: { Comprehension: 15 } } } },
    'stu-g4': { '9': { 'sep-w3-comp-c1': { failure: { Sound: 12 } } } }  // לא Comprehension
  }
});
const t6Groups = Interventions.detectGroupTriggers([
  { id: 'stu-g1', name: 'מאיה' },
  { id: 'stu-g2', name: 'נועה' },
  { id: 'stu-g3', name: 'רותם' },
  { id: 'stu-g4', name: 'שירה' }
]);
const compGroup = t6Groups.find(function (g) { return g.patternId === 'comprehension'; });
assert('קבוצת comprehension זוהתה', !!compGroup);
assert('קבוצת comprehension = 3 ילדות', compGroup && compGroup.students.length === 3);
assert('שירה (Sound בלבד) לא בקבוצה', compGroup && !compGroup.students.some(function (s) { return s.id === 'stu-g4'; }));

// רק 2 ילדות → אין קבוצה
setupEpaMock({
  epaByStudent: {
    'stu-g1': { '9': { 'sep-w6-morph-c4': { failure: { GenderMismatch: 8 } } } },
    'stu-g2': { '9': { 'sep-w6-morph-c4': { failure: { GenderMismatch: 7 } } } }
  }
});
const t6Groups2 = Interventions.detectGroupTriggers([{ id: 'stu-g1' }, { id: 'stu-g2' }]);
assert('2 ילדות gender_mismatch → אין קבוצה',
  !t6Groups2.some(function (g) { return g.patternId === 'gender_mismatch'; }));

// ============================================================================
// סיכום
// ============================================================================

console.log('\n' + '═'.repeat(60));
console.log('סיכום: ' + passed + '/' + total + ' בדיקות עברו');
if (failures.length > 0) {
  console.log('\n❌ כשלים:');
  failures.forEach(function (f) { console.log('  · ' + f); });
  process.exit(1);
} else {
  console.log('🟢 כל הבדיקות עברו.');
  process.exit(0);
}
