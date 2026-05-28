#!/usr/bin/env node
// ============================================================================
// test-intervention-matcher.js — B.8 (Intervention Matcher) · סוכן 17 · 28.5.2026
//
// בודק:
//   - API surface (matchForStudent / matchForGroup / PRIORITY / PATTERN_NAMES_HE)
//   - EPA only → match (source='epa')
//   - MOY only → match (source='moy')
//   - EPA + MOY agree → combined + bumped confidence
//   - EPA + MOY disagree → combined, EPA wins on pattern + confidence
//   - neither → null
//   - priority list מיושמת כשיש מספר EPA triggers
//   - matchForGroup — common pattern על 3 ילדות
//   - matchForGroup — אין match בכלל → null
//   - matchForGroup — empty input → null
//
// הרצה: node scripts/test-intervention-matcher.js (מתיקיית underwater-app)
// יוצא ב-exit 0 אם הכל ירוק, אחרת 1.
// ============================================================================

'use strict';

const path = require('path');

// ----------------------------------------------------------------------------
// Mock environment — להזריק AvneiInterventions ו-AvneiAssessments למודול
// ----------------------------------------------------------------------------

function clearMocks() {
  global.AvneiInterventions = null;
  global.AvneiAssessments = null;
  delete require.cache[require.resolve(
    path.resolve(__dirname, '..', 'js', 'shared', 'intervention-matcher.js')
  )];
}

function setupMocks(opts) {
  opts = opts || {};
  if (opts.interventionsByStudent || opts.interventionsThrow) {
    global.AvneiInterventions = {
      detectForStudent: function (sid /*, ctx */) {
        if (opts.interventionsThrow) throw new Error('mock throw');
        return (opts.interventionsByStudent && opts.interventionsByStudent[sid]) || [];
      }
    };
  } else {
    global.AvneiInterventions = null;
  }

  if (opts.moyByStudent || opts.assessmentsMap !== undefined) {
    global.AvneiAssessments = {
      getMOYStatus: function (sid) {
        const s = (opts.moyByStudent && opts.moyByStudent[sid]) || null;
        if (!s) return { measured: false, suggested_intervention: null };
        return { measured: true, suggested_intervention: s };
      },
      loadInterventionMap: function () {
        return opts.assessmentsMap !== undefined ? opts.assessmentsMap : null;
      }
    };
  } else {
    global.AvneiAssessments = null;
  }
}

function loadMatcher() {
  const modPath = path.resolve(__dirname, '..', 'js', 'shared', 'intervention-matcher.js');
  delete require.cache[modPath];
  return require(modPath);
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

console.log('\n📋 Intervention Matcher (B.8) — Test Suite (סוכן 17)');
console.log('==================================================');

// ----------------------------------------------------------------------------
// בלוק 1 — API surface
// ----------------------------------------------------------------------------
header('1. API surface');
{
  clearMocks();
  setupMocks({});
  const M = loadMatcher();
  assert(typeof M.matchForStudent === 'function', 'matchForStudent() נחשפת');
  assert(typeof M.matchForGroup === 'function', 'matchForGroup() נחשפת');
  assert(Array.isArray(M.PRIORITY) && M.PRIORITY.length === 5, 'PRIORITY = array באורך 5');
  assert(M.PRIORITY[0] === 'letter_knowledge', 'PRIORITY[0] = letter_knowledge (אישרה מיטל)');
  assert(typeof M.PATTERN_NAMES_HE === 'object' && M.PATTERN_NAMES_HE.phonological === 'מודעות פונולוגית',
    'PATTERN_NAMES_HE כולל phonological בעברית');
}

// ----------------------------------------------------------------------------
// בלוק 2 — EPA only
// ----------------------------------------------------------------------------
header('2. matchForStudent — EPA only');
{
  clearMocks();
  setupMocks({
    interventionsByStudent: {
      'stu-a': [{ patternId: 'letter_cluster', details: { count: 5 }, confidence: 'high' }]
    }
  });
  const M = loadMatcher();
  const r = M.matchForStudent('stu-a');
  assert(r !== null, 'EPA only → לא null');
  assert(r.pattern_id === 'letter_cluster', 'pattern_id = letter_cluster');
  assert(r.source === 'epa', "source = 'epa'");
  assert(r.confidence === 'high', 'confidence = high (מהtrigger)');
  assert(typeof r.reason === 'string' && r.reason.indexOf('EPA') >= 0, 'reason מזכיר EPA');
}

// ----------------------------------------------------------------------------
// בלוק 3 — MOY only
// ----------------------------------------------------------------------------
header('3. matchForStudent — MOY only');
{
  clearMocks();
  setupMocks({
    moyByStudent: {
      'stu-b': {
        patternId: 'phonological',
        source: 'moy_default_fallback',
        match_quality: 'partial',
        confidence: 'low',
        notice: 'MOY משימות 3 ו-4 נכשלו — phonological awareness הוא הקרוב ביותר.'
      }
    }
  });
  const M = loadMatcher();
  const r = M.matchForStudent('stu-b');
  assert(r !== null, 'MOY only → לא null');
  assert(r.pattern_id === 'phonological', 'pattern_id = phonological');
  assert(r.source === 'moy', "source = 'moy'");
  assert(r.confidence === 'low', 'confidence = low (מ-MOY)');
  assert(r.reason.indexOf('phonological') >= 0 || r.reason.indexOf('פונולוגית') >= 0 ||
         r.reason.indexOf('MOY') >= 0, 'reason מזכיר MOY/phonological');
}

// ----------------------------------------------------------------------------
// בלוק 4 — EPA + MOY agree → combined + bumped confidence
// ----------------------------------------------------------------------------
header('4. EPA + MOY agree (same patternId) → combined + bump');
{
  clearMocks();
  setupMocks({
    interventionsByStudent: {
      'stu-c': [{ patternId: 'letter_knowledge', details: { confused_pair: ['מ','ם'] }, confidence: 'med' }]
    },
    moyByStudent: {
      'stu-c': { patternId: 'letter_knowledge', source: 'epa_bkt_pattern',
                 match_quality: 'good', confidence: 'med' }
    }
  });
  const M = loadMatcher();
  const r = M.matchForStudent('stu-c');
  assert(r !== null, 'agreement → לא null');
  assert(r.pattern_id === 'letter_knowledge', 'pattern_id = letter_knowledge');
  assert(r.source === 'combined', "source = 'combined' כששניהם קיימים");
  assert(r.confidence === 'high', 'confidence = high (med → bump → high)');
  assert(r.details && r.details.epa && r.details.moy, 'details כולל גם epa וגם moy');
}

// ----------------------------------------------------------------------------
// בלוק 5 — EPA + MOY disagree → combined, EPA wins
// ----------------------------------------------------------------------------
header('5. EPA + MOY disagree → combined, EPA wins on pattern');
{
  clearMocks();
  setupMocks({
    interventionsByStudent: {
      'stu-d': [{ patternId: 'decoding', details: { context_value: 'medial', percent: 0.7 }, confidence: 'med' }]
    },
    moyByStudent: {
      'stu-d': { patternId: 'phonological', source: 'moy_default_fallback',
                 match_quality: 'partial', confidence: 'low' }
    }
  });
  const M = loadMatcher();
  const r = M.matchForStudent('stu-d');
  assert(r !== null, 'disagree → לא null');
  assert(r.pattern_id === 'decoding', 'pattern_id = decoding (EPA wins על MOY)');
  assert(r.source === 'combined', "source = 'combined' (שני סיגנלים נשקלו)");
  assert(r.confidence === 'med', 'confidence = med (של EPA, ללא bump)');
  assert(r.reason.indexOf('גובר') >= 0 || r.reason.indexOf('EPA') >= 0, 'reason מציין שEPA גובר');
}

// ----------------------------------------------------------------------------
// בלוק 6 — neither EPA nor MOY → null
// ----------------------------------------------------------------------------
header('6. matchForStudent — אין EPA ואין MOY → null');
{
  clearMocks();
  setupMocks({});
  const M = loadMatcher();
  assert(M.matchForStudent('stu-x') === null, 'ילדה ללא דאטה → null');
  assert(M.matchForStudent(null) === null, 'studentId נופל → null');
  assert(M.matchForStudent('') === null, 'studentId ריק → null');
}

// ----------------------------------------------------------------------------
// בלוק 7 — Priority list מיושמת על מספר EPA triggers
// ----------------------------------------------------------------------------
header('7. priority — letter_knowledge מנצח את phonological');
{
  clearMocks();
  // שני triggers ב-EPA. priority list קובע ש-letter_knowledge מקדים phonological.
  setupMocks({
    interventionsByStudent: {
      'stu-e': [
        { patternId: 'phonological',     details: { sound_failures: 12 }, confidence: 'high' },
        { patternId: 'letter_knowledge', details: { confused_pair: ['ה','ח'] }, confidence: 'low' }
      ]
    }
  });
  const M = loadMatcher();
  const r = M.matchForStudent('stu-e');
  assert(r !== null, 'יש triggers → match');
  assert(r.pattern_id === 'letter_knowledge',
    'letter_knowledge נבחר על pri ראשון, גם כש-phonological עם confidence גבוה יותר');
  assert(r.source === 'epa', "source = 'epa'");
}

// ----------------------------------------------------------------------------
// בלוק 8 — priority נטען מ-AvneiAssessments.loadInterventionMap אם קיים
// ----------------------------------------------------------------------------
header('8. priority — מ-AvneiAssessments.loadInterventionMap');
{
  clearMocks();
  // map מתחזה — priority מותאמת (decoding ראשון). המאצ'ר ישתמש בו.
  setupMocks({
    interventionsByStudent: {
      'stu-f': [
        { patternId: 'letter_knowledge', details: {}, confidence: 'med' },
        { patternId: 'decoding',         details: {}, confidence: 'med' }
      ]
    },
    assessmentsMap: {
      epa_bkt_pattern_priority: ['decoding', 'letter_knowledge', 'fluency', 'phonological', 'letter_cluster']
    }
  });
  const M = loadMatcher();
  const r = M.matchForStudent('stu-f');
  assert(r !== null, 'match קיים');
  assert(r.pattern_id === 'decoding', 'priority מ-map נטענה — decoding מנצח');
  // וגם נוודא ש-_getActivePriority חוזר עם זה
  const ap = M._getActivePriority();
  assert(Array.isArray(ap) && ap[0] === 'decoding', '_getActivePriority משקף את ה-map');
}

// ----------------------------------------------------------------------------
// בלוק 9 — robustness: AvneiInterventions זורק → נופל ל-MOY
// ----------------------------------------------------------------------------
header('9. robustness — Interventions throw → fall back ל-MOY');
{
  clearMocks();
  setupMocks({
    interventionsThrow: true,
    moyByStudent: {
      'stu-g': { patternId: 'phonological', confidence: 'low',
                 source: 'moy_default_fallback', match_quality: 'partial' }
    }
  });
  // מציבים גם interventionsByStudent כדי שה-mock יוצב
  global.AvneiInterventions = {
    detectForStudent: function () { throw new Error('boom'); }
  };
  const M = loadMatcher();
  const r = M.matchForStudent('stu-g');
  assert(r !== null, 'EPA throw → לא קורס');
  assert(r.source === 'moy', "נופל ל-source='moy'");
  assert(r.pattern_id === 'phonological', 'MOY pattern משמש');
}

// ----------------------------------------------------------------------------
// בלוק 10 — matchForGroup: common pattern על 3 ילדות
// ----------------------------------------------------------------------------
header('10. matchForGroup — דפוס משותף ל-3 ילדות');
{
  clearMocks();
  setupMocks({
    interventionsByStudent: {
      'g1': [{ patternId: 'letter_cluster', details: {}, confidence: 'high' }],
      'g2': [{ patternId: 'letter_cluster', details: {}, confidence: 'med' }],
      'g3': [{ patternId: 'phonological', details: {}, confidence: 'high' }]
    }
  });
  const M = loadMatcher();
  const r = M.matchForGroup(['g1','g2','g3']);
  assert(r !== null, 'group → לא null');
  assert(r.pattern_id === 'letter_cluster', 'pattern_id = letter_cluster (2 ילדות מתוך 3)');
  assert(r.students_matched.length === 2, 'students_matched.length = 2');
  assert(r.common_evidence.total_checked === 3, 'total_checked = 3');
  assert(r.common_evidence.matched_count === 2, 'matched_count = 2');
  assert(r.common_evidence.by_source.epa === 2, "by_source.epa = 2");
}

// ----------------------------------------------------------------------------
// בלוק 11 — matchForGroup: אף אחת בלי match → null
// ----------------------------------------------------------------------------
header('11. matchForGroup — אף אחת לא תואמת → null');
{
  clearMocks();
  setupMocks({});
  const M = loadMatcher();
  assert(M.matchForGroup(['x','y','z']) === null, 'אין שום match → null');
}

// ----------------------------------------------------------------------------
// בלוק 12 — matchForGroup: input לא תקין
// ----------------------------------------------------------------------------
header('12. matchForGroup — input לא תקין');
{
  clearMocks();
  setupMocks({});
  const M = loadMatcher();
  assert(M.matchForGroup([]) === null, 'array ריק → null');
  assert(M.matchForGroup(null) === null, 'null → null');
  assert(M.matchForGroup('not-an-array') === null, "string → null");
}

// ----------------------------------------------------------------------------
// בלוק 13 — matchForGroup: tie על count — priority מכריע
// ----------------------------------------------------------------------------
header('13. matchForGroup — tie על count, priority מכריע');
{
  clearMocks();
  setupMocks({
    interventionsByStudent: {
      's1': [{ patternId: 'letter_knowledge', details: {}, confidence: 'med' }],
      's2': [{ patternId: 'phonological',     details: {}, confidence: 'med' }]
    }
  });
  const M = loadMatcher();
  const r = M.matchForGroup(['s1','s2']);
  assert(r !== null, 'יש match');
  // 1 ילדה לכל דפוס. priority[0]=letter_knowledge → הוא ינצח.
  assert(r.pattern_id === 'letter_knowledge', 'tie על count → priority שובר את השוויון');
  assert(r.students_matched.length === 1, 'רק 1 ילדה תואמת לדפוס שנבחר');
}

// ----------------------------------------------------------------------------
// בלוק 14 — _bumpConfidence
// ----------------------------------------------------------------------------
header('14. _bumpConfidence — bump-up rules');
{
  clearMocks();
  setupMocks({});
  const M = loadMatcher();
  assert(M._bumpConfidence('low') === 'med',  'low → med');
  assert(M._bumpConfidence('med') === 'high', 'med → high');
  assert(M._bumpConfidence('high') === 'high','high → high (תקרה)');
  assert(M._bumpConfidence('bogus') === 'low','ערך לא ידוע → low');
}

// ----------------------------------------------------------------------------
// בלוק 15 — _pickBestByPriority
// ----------------------------------------------------------------------------
header('15. _pickBestByPriority — בחירה מתוך מערך triggers');
{
  clearMocks();
  setupMocks({});
  const M = loadMatcher();
  const priority = ['letter_knowledge','letter_cluster','decoding','fluency','phonological'];
  const triggers = [
    { patternId: 'phonological', confidence: 'high' },
    { patternId: 'decoding', confidence: 'low' },
    { patternId: 'letter_cluster', confidence: 'low' }
  ];
  const best = M._pickBestByPriority(triggers, priority);
  assert(best && best.patternId === 'letter_cluster',
    'letter_cluster (priority idx=1) מנצח את decoding (2) ו-phonological (4)');
  assert(M._pickBestByPriority([], priority) === null, 'array ריק → null');
  assert(M._pickBestByPriority(null, priority) === null, 'null → null');
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
