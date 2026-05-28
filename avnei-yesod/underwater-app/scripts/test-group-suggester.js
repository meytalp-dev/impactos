#!/usr/bin/env node
// ============================================================================
// test-group-suggester.js — B.9 (Morning Group Suggestion Engine)
// סוכן 18 · 28.5.2026
//
// בודק:
//   - API surface + defaults
//   - empty / null / invalid input → []
//   - 10 students → 2-3 groups (העדפת מיטל)
//   - min_group_size: ילדות בודדות ב-pattern → נופלות
//   - max_group_size split: 6 high → 5+1 → 1 group (drop leftover)
//   - 5 high + 4 med → 2 groups homogeneous by confidence
//   - all empty → []
//   - min_confidence: low → no group; with min_confidence='low' → 1 group
//   - max_groups cap
//   - sort: גודל desc → confidence desc → priority idx asc
//   - evidence shape + by_source counts
//   - _splitHomogeneousByConfidence helper
//   - _aggregateConfidence helper (כל הענפים)
//   - matcher throws → לא קורס (per-student isolation)
//   - matcher missing → []
//   - tie-breaker priority
//
// הרצה: node scripts/test-group-suggester.js (מתיקיית underwater-app)
// יוצא ב-exit 0 אם הכל ירוק, אחרת 1.
// ============================================================================

'use strict';

const path = require('path');

// ----------------------------------------------------------------------------
// Mock environment — להזריק AvneiInterventionMatcher
// ----------------------------------------------------------------------------

function clearMocks() {
  global.AvneiInterventionMatcher = null;
  delete require.cache[require.resolve(
    path.resolve(__dirname, '..', 'js', 'shared', 'group-suggester.js')
  )];
}

function setupMatcher(matchByStudent, opts) {
  opts = opts || {};
  global.AvneiInterventionMatcher = {
    matchForStudent: function (sid) {
      if (opts.throw) throw new Error('mock throw');
      return matchByStudent && matchByStudent[sid] ? matchByStudent[sid] : null;
    },
    _getActivePriority: function () {
      return opts.priority || ['letter_knowledge','letter_cluster','decoding','fluency','phonological'];
    }
  };
}

function loadSuggester() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'group-suggester.js');
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

console.log('\n📋 Group Suggester (B.9) — Test Suite (סוכן 18)');
console.log('==================================================');

// ----------------------------------------------------------------------------
// בלוק 1 — API surface + defaults
// ----------------------------------------------------------------------------
header('1. API surface + defaults');
{
  clearMocks(); setupMatcher({});
  const S = loadSuggester();
  assert(typeof S.suggestGroups === 'function', 'suggestGroups() נחשפת');
  assert(typeof S.DEFAULT_OPTS === 'object', 'DEFAULT_OPTS נחשף');
  assert(S.DEFAULT_OPTS.min_group_size === 3, 'default min_group_size = 3 (IES Foorman 2016)');
  assert(S.DEFAULT_OPTS.max_group_size === 5, 'default max_group_size = 5');
  assert(S.DEFAULT_OPTS.max_groups === 5, 'default max_groups = 5');
  assert(S.DEFAULT_OPTS.min_confidence === 'med', 'default min_confidence = med');
  assert(typeof S._splitHomogeneousByConfidence === 'function', '_splitHomogeneousByConfidence helper נחשף');
  assert(typeof S._aggregateConfidence === 'function', '_aggregateConfidence helper נחשף');
}

// ----------------------------------------------------------------------------
// בלוק 2 — Empty / invalid input
// ----------------------------------------------------------------------------
header('2. Empty / invalid input → []');
{
  clearMocks(); setupMatcher({});
  const S = loadSuggester();
  assert(Array.isArray(S.suggestGroups([])) && S.suggestGroups([]).length === 0, 'array ריק → []');
  assert(Array.isArray(S.suggestGroups(null)) && S.suggestGroups(null).length === 0, 'null → []');
  assert(Array.isArray(S.suggestGroups(undefined)) && S.suggestGroups(undefined).length === 0, 'undefined → []');
  assert(Array.isArray(S.suggestGroups('not-array')) && S.suggestGroups('not-array').length === 0, 'string → []');
}

// ----------------------------------------------------------------------------
// בלוק 3 — 10 students → 2-3 groups (העדפת מיטל)
// ----------------------------------------------------------------------------
header('3. 10 students → 3 קבוצות (phonological/letter_knowledge/letter_cluster)');
{
  clearMocks();
  setupMatcher({
    s1: { pattern_id: 'phonological',     confidence: 'high', source: 'epa' },
    s2: { pattern_id: 'phonological',     confidence: 'high', source: 'epa' },
    s3: { pattern_id: 'phonological',     confidence: 'high', source: 'epa' },
    s4: { pattern_id: 'letter_knowledge', confidence: 'med',  source: 'epa' },
    s5: { pattern_id: 'letter_knowledge', confidence: 'med',  source: 'epa' },
    s6: { pattern_id: 'letter_knowledge', confidence: 'med',  source: 'epa' },
    s7: { pattern_id: 'letter_cluster',   confidence: 'med',  source: 'moy' },
    s8: { pattern_id: 'letter_cluster',   confidence: 'med',  source: 'moy' },
    s9: { pattern_id: 'letter_cluster',   confidence: 'med',  source: 'moy' },
    s10: { pattern_id: 'fluency',          confidence: 'low',  source: 'epa' }
  });
  const S = loadSuggester();
  const r = S.suggestGroups(['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10']);
  assert(r.length === 3, '3 קבוצות (fluency=low ניפלה ב-min_confidence)');
  assert(r.every(function (g) { return g.students.length >= 3; }), 'כל הקבוצות ≥ 3 ילדות');
  assert(r.every(function (g) { return g.students.length <= 5; }), 'כל הקבוצות ≤ 5 ילדות');
  const patterns = r.map(function (g) { return g.pattern_id; });
  assert(patterns.indexOf('phonological') >= 0, 'phonological group present');
  assert(patterns.indexOf('letter_knowledge') >= 0, 'letter_knowledge group present');
  assert(patterns.indexOf('letter_cluster') >= 0, 'letter_cluster group present');
  assert(patterns.indexOf('fluency') === -1, 'fluency נופלת (confidence=low < med)');
}

// ----------------------------------------------------------------------------
// בלוק 4 — min_group_size respected
// ----------------------------------------------------------------------------
header('4. min_group_size — pattern עם 2 ילדות נופל');
{
  clearMocks();
  setupMatcher({
    a: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    b: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    c: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    d: { pattern_id: 'fluency',      confidence: 'high', source: 'epa' },
    e: { pattern_id: 'fluency',      confidence: 'high', source: 'epa' }
  });
  const S = loadSuggester();
  const r = S.suggestGroups(['a','b','c','d','e']);
  assert(r.length === 1, 'רק phonological חוזרת (fluency = 2 < min=3)');
  assert(r[0].pattern_id === 'phonological', 'pattern_id = phonological');
  assert(r[0].students.length === 3, '3 ילדות');
}

// ----------------------------------------------------------------------------
// בלוק 5 — max_group_size split (6 high → 5+1 → רק 5)
// ----------------------------------------------------------------------------
header('5. max_group_size split — 6 high → 1 קבוצה של 5 (leftover 1 נופל)');
{
  clearMocks();
  const m = {};
  for (let i = 1; i <= 6; i++) {
    m['x' + i] = { pattern_id: 'phonological', confidence: 'high', source: 'epa' };
  }
  setupMatcher(m);
  const S = loadSuggester();
  const r = S.suggestGroups(Object.keys(m));
  assert(r.length === 1, '6 high → 1 group של 5 (leftover 1 < min)');
  assert(r[0].students.length === 5, '5 ילדות בקבוצה');
  assert(r[0].confidence === 'high', 'confidence = high');
}

// ----------------------------------------------------------------------------
// בלוק 6 — split homogeneous: 5 high + 4 med → 2 groups
// ----------------------------------------------------------------------------
header('6. split homogeneous — 5 high + 4 med → 2 קבוצות');
{
  clearMocks();
  const m = {};
  for (let i = 1; i <= 5; i++) m['h' + i] = { pattern_id: 'letter_knowledge', confidence: 'high', source: 'epa' };
  for (let i = 1; i <= 4; i++) m['m' + i] = { pattern_id: 'letter_knowledge', confidence: 'med',  source: 'epa' };
  setupMatcher(m);
  const S = loadSuggester();
  const r = S.suggestGroups(Object.keys(m));
  assert(r.length === 2, '2 קבוצות');
  // הקבוצה הגדולה ראשונה (sort size desc)
  assert(r[0].students.length === 5, 'קבוצה ראשונה = 5');
  assert(r[0].confidence === 'high', 'confidence ראשון = high');
  assert(r[1].students.length === 4, 'קבוצה שנייה = 4');
  assert(r[1].confidence === 'med', 'confidence שני = med');
  // כל קבוצה הומוגנית
  assert(r[0].students.every(function (s) { return s.confidence === 'high'; }), 'קבוצה 1 כולה high');
  assert(r[1].students.every(function (s) { return s.confidence === 'med'; }), 'קבוצה 2 כולה med');
}

// ----------------------------------------------------------------------------
// בלוק 7 — אין match בכלל → []
// ----------------------------------------------------------------------------
header('7. אין match לאף ילדה → []');
{
  clearMocks(); setupMatcher({});
  const S = loadSuggester();
  const r = S.suggestGroups(['x','y','z']);
  assert(r.length === 0, 'no matches → []');
}

// ----------------------------------------------------------------------------
// בלוק 8 — min_confidence filter
// ----------------------------------------------------------------------------
header('8. min_confidence — low נופלות במצב ברירת-מחדל');
{
  clearMocks();
  setupMatcher({
    a: { pattern_id: 'phonological', confidence: 'low', source: 'epa' },
    b: { pattern_id: 'phonological', confidence: 'low', source: 'epa' },
    c: { pattern_id: 'phonological', confidence: 'low', source: 'epa' }
  });
  const S = loadSuggester();
  const r1 = S.suggestGroups(['a','b','c']);
  assert(r1.length === 0, 'all low + default min_confidence=med → []');
  const r2 = S.suggestGroups(['a','b','c'], { min_confidence: 'low' });
  assert(r2.length === 1, 'min_confidence=low → קבוצה חוזרת');
  assert(r2[0].pattern_id === 'phonological', 'pattern_id = phonological');
}

// ----------------------------------------------------------------------------
// בלוק 9 — max_groups cap
// ----------------------------------------------------------------------------
header('9. max_groups cap');
{
  clearMocks();
  const m = {};
  ['phonological','letter_knowledge','decoding','fluency','letter_cluster'].forEach(function (p) {
    for (let k = 1; k <= 3; k++) m[p + '_' + k] = { pattern_id: p, confidence: 'high', source: 'epa' };
  });
  setupMatcher(m);
  const S = loadSuggester();
  const r = S.suggestGroups(Object.keys(m), { max_groups: 2 });
  assert(r.length === 2, 'max_groups=2 → רק 2 קבוצות חוזרות');
  // default max_groups=5 → 5 קבוצות
  const rDefault = S.suggestGroups(Object.keys(m));
  assert(rDefault.length === 5, 'default max_groups=5 → 5 קבוצות');
}

// ----------------------------------------------------------------------------
// בלוק 10 — Sort: size desc → confidence desc
// ----------------------------------------------------------------------------
header('10. Sort — גדולה ראשונה, אחר-כך confidence');
{
  clearMocks();
  setupMatcher({
    a1: { pattern_id: 'phonological', confidence: 'med',  source: 'epa' },
    a2: { pattern_id: 'phonological', confidence: 'med',  source: 'epa' },
    a3: { pattern_id: 'phonological', confidence: 'med',  source: 'epa' },
    b1: { pattern_id: 'fluency',      confidence: 'high', source: 'epa' },
    b2: { pattern_id: 'fluency',      confidence: 'high', source: 'epa' },
    b3: { pattern_id: 'fluency',      confidence: 'high', source: 'epa' },
    b4: { pattern_id: 'fluency',      confidence: 'high', source: 'epa' }
  });
  const S = loadSuggester();
  const r = S.suggestGroups(['a1','a2','a3','b1','b2','b3','b4']);
  assert(r.length === 2, '2 קבוצות');
  assert(r[0].pattern_id === 'fluency', 'fluency (4 ילדות) ראשונה');
  assert(r[1].pattern_id === 'phonological', 'phonological (3 ילדות) שנייה');
}

// ----------------------------------------------------------------------------
// בלוק 11 — evidence shape + by_source counts
// ----------------------------------------------------------------------------
header('11. evidence shape + by_source');
{
  clearMocks();
  setupMatcher({
    s1: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    s2: { pattern_id: 'phonological', confidence: 'high', source: 'moy' },
    s3: { pattern_id: 'phonological', confidence: 'med',  source: 'combined' }
  });
  const S = loadSuggester();
  const r = S.suggestGroups(['s1','s2','s3']);
  assert(r.length === 1, '1 group');
  const g = r[0];
  assert(g.evidence.matched_count === 3, 'matched_count = 3');
  assert(g.evidence.total_checked === 3, 'total_checked = 3');
  assert(g.evidence.by_source.epa === 1, 'by_source.epa = 1');
  assert(g.evidence.by_source.moy === 1, 'by_source.moy = 1');
  assert(g.evidence.by_source.combined === 1, 'by_source.combined = 1');
  // student record shape
  assert(g.students[0].studentId && g.students[0].confidence && g.students[0].source,
    'student record כולל studentId/confidence/source');
}

// ----------------------------------------------------------------------------
// בלוק 12 — _splitHomogeneousByConfidence helper
// ----------------------------------------------------------------------------
header('12. _splitHomogeneousByConfidence — helper');
{
  clearMocks(); setupMatcher({});
  const S = loadSuggester();
  const students = [
    { confidence: 'high' }, { confidence: 'high' }, { confidence: 'high' },
    { confidence: 'med' }, { confidence: 'med' }, { confidence: 'med' }, { confidence: 'med' },
    { confidence: 'low' }
  ];
  const split = S._splitHomogeneousByConfidence(students, 3, 5);
  assert(split.length === 2, '2 buckets (high=3, med=4; low=1 נופל)');
  assert(split[0].length === 3 && split[0].every(function (s) { return s.confidence === 'high'; }),
    'bucket ראשון = 3 high');
  assert(split[1].length === 4 && split[1].every(function (s) { return s.confidence === 'med'; }),
    'bucket שני = 4 med');

  // 11 high עם maxSize=5 → 5+5+1 → רק 2 פרוסות
  const big = [];
  for (let i = 0; i < 11; i++) big.push({ confidence: 'high' });
  const split2 = S._splitHomogeneousByConfidence(big, 3, 5);
  assert(split2.length === 2, '11 high → 2 פרוסות (5+5; leftover 1 נופל)');
  assert(split2[0].length === 5 && split2[1].length === 5, 'שתיהן 5');
}

// ----------------------------------------------------------------------------
// בלוק 13 — _aggregateConfidence helper (כל הענפים)
// ----------------------------------------------------------------------------
header('13. _aggregateConfidence — all branches');
{
  clearMocks(); setupMatcher({});
  const S = loadSuggester();
  assert(S._aggregateConfidence(['high','high','high']) === 'high', 'all high → high');
  assert(S._aggregateConfidence(['high','med','med']) === 'med', '1 high + 2 med (66% med+) → med');
  assert(S._aggregateConfidence(['low','low','low']) === 'low', 'all low → low');
  assert(S._aggregateConfidence(['high','low','low']) === 'low', '1 high + 2 low → low (לא 66%)');
  assert(S._aggregateConfidence([]) === 'low', 'empty → low');
  assert(S._aggregateConfidence(null) === 'low', 'null → low');
}

// ----------------------------------------------------------------------------
// בלוק 14 — Single matched student → no group
// ----------------------------------------------------------------------------
header('14. ילדה בודדת → אין קבוצה');
{
  clearMocks();
  setupMatcher({ a: { pattern_id: 'fluency', confidence: 'high', source: 'epa' } });
  const S = loadSuggester();
  const r = S.suggestGroups(['a']);
  assert(r.length === 0, '1 student < min_group_size=3 → []');
}

// ----------------------------------------------------------------------------
// בלוק 15 — Matcher missing → []
// ----------------------------------------------------------------------------
header('15. AvneiInterventionMatcher חסר → []');
{
  clearMocks();
  global.AvneiInterventionMatcher = null;
  const S = loadSuggester();
  const r = S.suggestGroups(['a','b','c']);
  assert(Array.isArray(r) && r.length === 0, 'no matcher → []');
}

// ----------------------------------------------------------------------------
// בלוק 16 — Matcher זורק → לא קורס (per-student isolation)
// ----------------------------------------------------------------------------
header('16. Matcher זורק → suggester לא קורס');
{
  clearMocks();
  setupMatcher({}, { throw: true });
  const S = loadSuggester();
  let r;
  let threw = false;
  try { r = S.suggestGroups(['a','b','c']); }
  catch (e) { threw = true; }
  assert(!threw, 'suggestGroups לא זורק כש-matcher זורק');
  assert(Array.isArray(r) && r.length === 0, 'תוצאה = [] (כל ה-matches נופלות)');
}

// ----------------------------------------------------------------------------
// בלוק 17 — Tie-breaker: priority list (size + confidence שווים)
// ----------------------------------------------------------------------------
header('17. Tie-breaker — priority list מכריע');
{
  clearMocks();
  setupMatcher({
    a1: { pattern_id: 'phonological',     confidence: 'high', source: 'epa' },
    a2: { pattern_id: 'phonological',     confidence: 'high', source: 'epa' },
    a3: { pattern_id: 'phonological',     confidence: 'high', source: 'epa' },
    b1: { pattern_id: 'letter_knowledge', confidence: 'high', source: 'epa' },
    b2: { pattern_id: 'letter_knowledge', confidence: 'high', source: 'epa' },
    b3: { pattern_id: 'letter_knowledge', confidence: 'high', source: 'epa' }
  });
  const S = loadSuggester();
  const r = S.suggestGroups(['a1','a2','a3','b1','b2','b3']);
  assert(r.length === 2, '2 קבוצות');
  // tie על size=3 ו-confidence=high → priority מכריע (letter_knowledge=0, phonological=4)
  assert(r[0].pattern_id === 'letter_knowledge', 'letter_knowledge (priority idx=0) ראשונה');
  assert(r[1].pattern_id === 'phonological',     'phonological (priority idx=4) שנייה');
}

// ----------------------------------------------------------------------------
// בלוק 18 — null מ-matcher לא נכלל
// ----------------------------------------------------------------------------
header('18. null match per student → אותה ילדה לא נכללת');
{
  clearMocks();
  setupMatcher({
    a: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    b: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    c: { pattern_id: 'phonological', confidence: 'high', source: 'epa' },
    d: null,  // null - לא נכללת
    e: { pattern_id: 'phonological', confidence: 'high', source: 'epa' }
  });
  const S = loadSuggester();
  const r = S.suggestGroups(['a','b','c','d','e']);
  assert(r.length === 1, '1 קבוצה');
  assert(r[0].students.length === 4, '4 ילדות (d לא נכללת)');
  assert(r[0].students.every(function (s) { return s.studentId !== 'd'; }), 'd לא בקבוצה');
}

// ----------------------------------------------------------------------------
// בלוק 19 — sub-buckets בתוך split: 8 high → 5+3
// ----------------------------------------------------------------------------
header('19. split — 8 high → 5+3 (שני sub-groups)');
{
  clearMocks();
  const m = {};
  for (let i = 1; i <= 8; i++) m['k' + i] = { pattern_id: 'letter_cluster', confidence: 'high', source: 'epa' };
  setupMatcher(m);
  const S = loadSuggester();
  const r = S.suggestGroups(Object.keys(m));
  assert(r.length === 2, '8 high → 2 קבוצות');
  assert(r[0].students.length === 5, 'ראשונה = 5');
  assert(r[1].students.length === 3, 'שנייה = 3');
  assert(r[0].confidence === 'high' && r[1].confidence === 'high', 'שתיהן high');
}

// ----------------------------------------------------------------------------
// בלוק 20 — by_source עם source לא מוכר
// ----------------------------------------------------------------------------
header('20. by_source — source לא מוכר נופל בשקט');
{
  clearMocks(); setupMatcher({});
  const S = loadSuggester();
  const ev = S._evidenceBySource([
    { source: 'epa' }, { source: 'moy' },
    { source: 'unknown_source' }, { source: undefined }
  ]);
  assert(ev.epa === 1, 'epa = 1');
  assert(ev.moy === 1, 'moy = 1');
  assert(ev.combined === 0, 'combined = 0');
  // אין מפתחות זרים
  const keys = Object.keys(ev).sort().join(',');
  assert(keys === 'combined,epa,moy', 'מפתחות = epa/moy/combined בלבד');
}

// ----------------------------------------------------------------------------
// סיכום
// ----------------------------------------------------------------------------
console.log('\n=========================================');
console.log('סה"כ ✓ ' + pass + ' · ✗ ' + fail);
if (fail > 0) {
  console.error('❌ FAILED — exit 1');
  process.exit(1);
} else {
  console.log('✅ PASS');
}
