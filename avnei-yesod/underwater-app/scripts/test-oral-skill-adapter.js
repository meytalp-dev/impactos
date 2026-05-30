#!/usr/bin/env node
// ============================================================================
// test-oral-skill-adapter.js — אי 14 הבנת הנשמע (סוכן 31 · 29.5.2026)
//
// בודק:
//   1. Constants: SKILL_IDS · LEVELS · MASTERY_THRESHOLD · MIN_ATTEMPTS_FOR_MASTERY
//   2. _validateSkill (חיובי / שלילי)
//   3. _seedCache + getListeningItems (flattening: 1 passage × N questions → N items)
//   4. getRandomBatch (size limit · shuffle)
//   5. getItemsBySkill (filter פר skill)
//   6. recordAttempt (קורא ל-BKT.ingestEvent עם evt תקין)
//   7. getTopWeakSkills (forwards ל-BKT.getWeakestOralSkills כולל includeUntouched)
//   8. getMastery (no data · partial · all mastered)
//
// בנוסף: smoke tests על bkt.js extensions:
//   9. ISLAND_14_ORAL_SKILLS = ['identify-hero','sequence','inference']
//   10. ISLANDS_WITH_SUB_BKT includes 14
//   11. ingestEvent(islandId=14, target_oral_skill='identify-hero', is_correct=true)
//       → getOralSkillState משקף עדכון
//   12. getOralSkillMasteryDistribution — buckets נכונים
//
// הרצה: node scripts/test-oral-skill-adapter.js
// ============================================================================

'use strict';
const path = require('path');
const fs = require('fs');

// ---- localStorage mock (ל-bkt.js) ----
function makeLocalStorageMock() {
  let store = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; }
  };
}

function loadBKT() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'bkt.js');
  delete require.cache[p];
  // bkt.js מסתמך על window.AvneiBKT = ... — נדמה window כ-global.
  global.window = global;
  require(p);
  return global.AvneiBKT;
}

function loadAdapter() {
  const p = path.resolve(__dirname, '..', 'js', 'shared', 'oral-skill-adapter.js');
  delete require.cache[p];
  return require(p);
}

function resetAll() {
  global.localStorage = makeLocalStorageMock();
  global.AvneiBKT = null;
  delete global.window;
}

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); pass++; }
  else { console.error('  ✗ FAIL: ' + msg); fail++; process.exitCode = 1; }
}
function header(t) { console.log('\n=== ' + t + ' ==='); }

// ============================================================================
// Test 1: Constants
// ============================================================================
header('1. Constants + API surface');

resetAll();
const adapter = loadAdapter();

assert(adapter && typeof adapter === 'object',
       'oral-skill-adapter exports an object');
assert(Array.isArray(adapter.SKILL_IDS) && adapter.SKILL_IDS.length === 3,
       'SKILL_IDS exists with 3 entries');
assert(adapter.SKILL_IDS.includes('identify-hero') &&
       adapter.SKILL_IDS.includes('sequence') &&
       adapter.SKILL_IDS.includes('inference'),
       'SKILL_IDS contains identify-hero / sequence / inference');
assert(Array.isArray(adapter.LEVELS) && adapter.LEVELS.join(',') === '1,2,3',
       'LEVELS = [1,2,3]');
assert(adapter.MASTERY_THRESHOLD === 0.70,
       'MASTERY_THRESHOLD = 0.70 (pilot)');
assert(adapter.MIN_ATTEMPTS_FOR_MASTERY === 5,
       'MIN_ATTEMPTS_FOR_MASTERY = 5');
assert(adapter.ISLAND_ID === 14,
       'ISLAND_ID = 14');
['getListeningItems','getRandomBatch','recordAttempt','getTopWeakSkills',
 'getMastery','getMasteryOverall','loadPassages','getItemsBySkill',
 '_clearCache','_seedCache'].forEach(name => {
  assert(typeof adapter[name] === 'function', 'exports ' + name + '()');
});

// ============================================================================
// Test 2: _validateSkill
// ============================================================================
header('2. _validateSkill');
assert(adapter._validateSkill('identify-hero') === true,  'identify-hero is valid');
assert(adapter._validateSkill('sequence') === true,        'sequence is valid');
assert(adapter._validateSkill('inference') === true,       'inference is valid');
assert(adapter._validateSkill('foo') === false,            'foo is invalid');
assert(adapter._validateSkill('') === false,               'empty is invalid');

// ============================================================================
// Test 3: _seedCache + getListeningItems (flattening logic)
// ============================================================================
header('3. _seedCache + getListeningItems');

const sampleData = {
  _meta: { level: 2 },
  passages: [
    {
      item_id: 'isle14-l2-001',
      level: 2,
      passage_text: 'דָּנָה הָלְכָה לַגַּן.',
      questions: [
        { q_id: 'q1', skill: 'identify-hero', question_text: 'לְאָן הָלְכָה?', options: [
          { text: 'לַגַּן', correct: true },
          { text: 'לַחֲנוּת', correct: false },
          { text: 'לַיָּם', correct: false }
        ]},
        { q_id: 'q2', skill: 'sequence', question_text: 'מָה קָרָה רִאשׁוֹן?', options: [
          { text: 'יָצְאָה', correct: true },
          { text: 'אָכְלָה', correct: false },
          { text: 'יָשְׁנָה', correct: false }
        ]},
      ]
    },
    {
      item_id: 'isle14-l2-002',
      level: 2,
      passage_text: 'יוֹאָב בָּנָה מִגְדָּל.',
      questions: [
        { q_id: 'q3', skill: 'inference', question_text: 'אֵיךְ הוּא הִרְגִּישׁ?', options: [
          { text: 'גָּאֶה', correct: true },
          { text: 'עָצוּב', correct: false },
          { text: 'כּוֹעֵס', correct: false }
        ]}
      ]
    }
  ]
};
adapter._clearCache();
adapter._seedCache(2, sampleData);

(async () => {
  const items = await adapter.getListeningItems(2);
  assert(Array.isArray(items),                            'getListeningItems returns array');
  assert(items.length === 3,                              'flattens 2 passages × (2+1) questions → 3 items');
  assert(items[0].item_id === 'isle14-l2-001' && items[0].q_id === 'q1',
                                                          'item 0 = (isle14-l2-001, q1)');
  assert(items[0].skill === 'identify-hero',              'item 0 skill = identify-hero');
  assert(items[0].passage_text.includes('דָּנָה'),         'item 0 passage_text preserved');
  assert(items[2].item_id === 'isle14-l2-002' && items[2].q_id === 'q3',
                                                          'item 2 = (isle14-l2-002, q3)');
  assert(items[2].skill === 'inference',                  'item 2 skill = inference');

  // ============================================================================
  // Test 4: getRandomBatch
  // ============================================================================
  header('4. getRandomBatch');
  const batch3 = await adapter.getRandomBatch(2, 3);
  assert(batch3.length === 3,                             'returns 3 items when requested 3');
  const batch10 = await adapter.getRandomBatch(2, 10);
  assert(batch10.length === 3,                            'returns 3 items when requested 10 (only 3 available)');
  const batch1 = await adapter.getRandomBatch(2, 1);
  assert(batch1.length === 1,                             'returns 1 item when requested 1');

  // ============================================================================
  // Test 5: getItemsBySkill
  // ============================================================================
  header('5. getItemsBySkill');
  const heroItems = await adapter.getItemsBySkill(2, 'identify-hero');
  assert(heroItems.length === 1 && heroItems[0].skill === 'identify-hero',
                                                          'identify-hero → 1 item');
  const seqItems = await adapter.getItemsBySkill(2, 'sequence');
  assert(seqItems.length === 1 && seqItems[0].skill === 'sequence',
                                                          'sequence → 1 item');
  const fooItems = await adapter.getItemsBySkill(2, 'foo');
  assert(fooItems.length === 0,                           'invalid skill → empty');

  // ============================================================================
  // Test 6: recordAttempt (calls BKT.ingestEvent with correct shape)
  // ============================================================================
  header('6. recordAttempt');
  let lastEvent = null;
  global.AvneiBKT = {
    ingestEvent: function (evt) { lastEvent = evt; return { pKnown_skill: 0.5 }; }
  };
  const result = adapter.recordAttempt('local', {
    item_id: 'isle14-l2-001', q_id: 'q1', skill: 'identify-hero',
    level: 2, is_correct: true, response_time_ms: 1234,
  });
  assert(result && result.pKnown_skill === 0.5,           'recordAttempt returns BKT result');
  assert(lastEvent && lastEvent.primary_island_id === 14, 'event primary_island_id = 14');
  assert(lastEvent.target_oral_skill === 'identify-hero', 'event target_oral_skill = skill');
  assert(lastEvent.is_correct === true,                   'event is_correct passed');
  assert(lastEvent.response_time_ms === 1234,             'event response_time_ms passed');
  assert(lastEvent.student_id === 'local',                'event student_id passed');
  assert(typeof lastEvent.session_id === 'string' && lastEvent.session_id.startsWith('isle14-'),
                                                          'event session_id auto-generated');

  const nullResult = adapter.recordAttempt('local', { skill: 'foo' });
  assert(nullResult === null,                             'invalid skill → null');

  // ============================================================================
  // Test 7: getTopWeakSkills (forwards to BKT)
  // ============================================================================
  header('7. getTopWeakSkills');
  let lastWeakCall = null;
  global.AvneiBKT.getWeakestOralSkills = function (sid, n, opts) {
    lastWeakCall = { sid, n, opts };
    return [{ skill: 'inference', pKnown: 0.30, attempts: 5 }];
  };
  const weak = adapter.getTopWeakSkills('alice', 2);
  assert(lastWeakCall && lastWeakCall.sid === 'alice',     'forwards sid');
  assert(lastWeakCall.n === 2,                             'forwards limit');
  assert(lastWeakCall.opts && lastWeakCall.opts.includeUntouched === true,
                                                           'sets includeUntouched=true');
  assert(weak.length === 1 && weak[0].skill === 'inference', 'returns BKT result as-is');

  // ============================================================================
  // Test 8: getMastery
  // ============================================================================
  header('8. getMastery');
  // No data
  global.AvneiBKT.getOralSkillMasteryDistribution = () => null;
  global.AvneiBKT.getOralSkillState = () => null;
  const noData = adapter.getMastery('alice');
  assert(noData.met === false && noData.reason === 'no-data',
                                                           'no data → met=false, reason=no-data');

  // All 3 mastered
  global.AvneiBKT.getOralSkillMasteryDistribution = () => ({
    mastered: 3, in_progress: 0, weak: 0, untouched: 0,
    by_bucket: { mastered: ['identify-hero','sequence','inference'], in_progress: [], weak: [], untouched: [] },
    total: 3,
  });
  global.AvneiBKT.getOralSkillState = (sid, skill) => ({
    skill, pKnown: 0.92, attempts: 10, correct: 8, wrong: 2, accuracy: 0.8,
    median_response_time_ms: 5000, mastered: true, masteryAchievedAt: 1000,
  });
  const mastered = adapter.getMastery('alice');
  assert(mastered.met === true,                            'all 3 skills mastered → met=true');
  assert(mastered.mastered_skills.length === 3,            'all 3 in mastered_skills');
  assert(mastered.total_attempts === 30,                   'aggregates attempts (3 skills × 10)');

  // Partial mastery (1/3 skill above threshold)
  global.AvneiBKT.getOralSkillState = (sid, skill) => {
    if (skill === 'identify-hero') return { skill, pKnown: 0.92, attempts: 10, correct: 8 };
    return { skill, pKnown: 0.40, attempts: 6, correct: 2 };
  };
  const partial = adapter.getMastery('alice');
  assert(partial.met === false,                            'partial → met=false');
  assert(partial.mastered_skills.length === 1 &&
         partial.mastered_skills[0] === 'identify-hero',   'only identify-hero in mastered_skills');

  // ============================================================================
  // Test 9-12: BKT extensions (smoke tests)
  // ============================================================================
  header('9-12. bkt.js extensions for island 14');
  global.AvneiBKT = null;
  global.localStorage = makeLocalStorageMock();
  const BKT = loadBKT();
  assert(BKT && typeof BKT === 'object',                   'BKT loads');
  assert(Array.isArray(BKT.ISLAND_14_ORAL_SKILLS) &&
         BKT.ISLAND_14_ORAL_SKILLS.length === 3,           'ISLAND_14_ORAL_SKILLS has 3 entries');
  assert(BKT.ISLANDS_WITH_SUB_BKT.includes(14),            'ISLANDS_WITH_SUB_BKT includes 14');
  assert(typeof BKT.getOralSkillState === 'function',      'exports getOralSkillState');
  assert(typeof BKT.getWeakestOralSkills === 'function',   'exports getWeakestOralSkills');
  assert(typeof BKT.getOralSkillMasteryDistribution === 'function',
                                                           'exports getOralSkillMasteryDistribution');

  // ingestEvent for island 14
  const r = BKT.ingestEvent({
    student_id: 'kid1',
    primary_island_id: 14,
    target_oral_skill: 'identify-hero',
    is_correct: true,
    response_time_ms: 2000,
    session_id: 'sess1',
  });
  assert(r && r.oral_skill === 'identify-hero',            'ingestEvent returns oral_skill');
  assert(typeof r.pKnown_skill === 'number',               'returns pKnown_skill');

  // getOralSkillState after one correct attempt
  const ss = BKT.getOralSkillState('kid1', 'identify-hero');
  assert(ss && ss.skill === 'identify-hero',               'getOralSkillState returns skill');
  assert(ss.attempts === 1 && ss.correct === 1 && ss.wrong === 0,
                                                           'attempts=1, correct=1 after 1 correct event');
  assert(ss.pKnown > BKT.PARAMS_PER_ISLAND[14].pL0,        'pKnown grew above pL0 after correct answer');

  // Distribution after one untouched + one touched skill
  const dist = BKT.getOralSkillMasteryDistribution('kid1');
  assert(dist.total === 3,                                 'distribution.total = 3');
  assert(dist.untouched >= 2,                              '≥ 2 skills untouched (only identify-hero touched once)');

  // getWeakestOralSkills with includeUntouched
  const weakOrals = BKT.getWeakestOralSkills('kid1', 3, { includeUntouched: true });
  assert(Array.isArray(weakOrals) && weakOrals.length >= 1,
                                                           'getWeakestOralSkills returns array with includeUntouched');

  // Invalid skill returns null
  assert(BKT.getOralSkillState('kid1', 'foo') === null,    'invalid skill → null');

  // Reject ingestEvent without target_oral_skill
  const badR = BKT.ingestEvent({
    student_id: 'kid1', primary_island_id: 14, is_correct: true, session_id: 'sess2',
  });
  assert(badR === null,                                    'island 14 event without target_oral_skill returns null');

  // ============================================================================
  // Test 13: JSON data files load + validate
  // ============================================================================
  header('13. JSON data files structure');
  const dataDir = path.resolve(__dirname, '..', 'data', 'island-14-listening');
  [1,2,3].forEach(level => {
    const filePath = path.join(dataDir, 'passages-level-' + level + '.json');
    const exists = fs.existsSync(filePath);
    assert(exists, 'passages-level-' + level + '.json exists');
    if (!exists) return;
    let parsed;
    try { parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch (e) { assert(false, 'level ' + level + ': JSON parses (' + e.message + ')'); return; }
    assert(parsed && parsed._meta && parsed._meta.level === level,
           'level ' + level + ': _meta.level matches');
    assert(Array.isArray(parsed.passages) && parsed.passages.length > 0,
           'level ' + level + ': has at least 1 passage');
    parsed.passages.forEach((p, i) => {
      const tag = 'level ' + level + ' passage[' + i + ']';
      assert(typeof p.item_id === 'string' && p.item_id.startsWith('isle14-l' + level),
             tag + ' item_id format');
      assert(typeof p.passage_text === 'string' && p.passage_text.length > 0,
             tag + ' has passage_text');
      assert(Array.isArray(p.questions) && p.questions.length > 0,
             tag + ' has ≥ 1 question');
      p.questions.forEach((q, j) => {
        const qtag = tag + ' q[' + j + ']';
        assert(typeof q.q_id === 'string',                qtag + ' has q_id');
        assert(['identify-hero','sequence','inference'].includes(q.skill),
                                                          qtag + ' has valid skill');
        assert(Array.isArray(q.options) && q.options.length >= 3,
                                                          qtag + ' has ≥ 3 options');
        const correctCount = q.options.filter(o => o.correct === true).length;
        assert(correctCount === 1,                        qtag + ' has exactly 1 correct option');
      });
    });
  });

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n=========================================');
  console.log('Total: ' + (pass + fail) + ' · pass=' + pass + ' · fail=' + fail);
  console.log('=========================================');
  process.exit(fail > 0 ? 1 : 0);
})();
