// ============================================================================
// shared/oral-skill-adapter.js — Oral-skill adapter לאי 14 (הבנת הנשמע)
// סוכן 31 · 29.5.2026
//
// מטרה:
//   אי 14 = שלוש sub-skills פדגוגיות בהבנת הנשמע:
//     identify-hero · sequence · inference
//   ה-adapter הזה:
//     1. טוען passages מ-data/island-14-listening/passages-level-{1,2,3}.json
//     2. נותן API ל-mechanic-listen-mcq / mechanic-story-sequence
//     3. מתעד events דרך AvneiBKT.ingestEvent (sub-BKT פר skill)
//     4. נחשב כ-_ORAL_SKILL_ADAPTER ב-skill-units.js (oral-skill type)
//
// API חיצוני (window.AvneiOralSkillAdapter):
//   loadPassages(level)        → Promise<{passages: [...]}>
//   getListeningItems(level)   → Promise<flattened items> (1 passage × 1 question)
//   getRandomBatch(level, n)   → Promise<n items>
//   getTopWeakSkills(sid, n=3) → array של {skill, displayHe, pKnown, ...}
//   recordAttempt(sid, ctx)    → void · רושם event ל-BKT
//   getMastery(sid, level)     → {met:bool, accuracy:0..1, mastered_skills:[...]}
//   getMasteryOverall(sid)     → mastery כולל לאי 14 (כל ה-skills)
//   SKILL_IDS · LEVELS · MASTERY_THRESHOLD · MIN_ATTEMPTS_FOR_MASTERY
//
// תלות:
//   window.AvneiBKT — getOralSkillState · ingestEvent · ISLAND_14_ORAL_SKILLS
//   fetch() — לטעינת JSON
//
// טסטים: scripts/test-oral-skill-adapter.js
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------------------
  const SKILL_IDS = Object.freeze(['identify-hero', 'sequence', 'inference']);
  const LEVELS = Object.freeze([1, 2, 3]);
  const ISLAND_ID = 14;

  // Mastery: 70%+ accuracy בכל skill עם מינימום ניסיונות.
  // (החלטת מיטל · 29.5.2026 — pilot threshold.)
  const MASTERY_THRESHOLD = 0.70;
  const MIN_ATTEMPTS_FOR_MASTERY = 5;

  const SKILL_DISPLAY_HE = Object.freeze({
    'identify-hero': 'זיהוי גיבור ופרטים',
    'sequence':      'רצף אירועים',
    'inference':     'הסקת מסקנות',
  });

  // Base path — יחסית ל-stage-14-*.html ב-underwater-app/.
  const DATA_PATH_PREFIX = 'data/island-14-listening/passages-level-';
  const DATA_PATH_SUFFIX = '.json';

  // --------------------------------------------------------------------------
  // Cache — חוסך fetch חוזר באותו דף
  // --------------------------------------------------------------------------
  const _cache = new Map(); // level → {passages:[...], _meta:{...}}

  function _validateLevel(level) {
    if (!LEVELS.includes(level)) {
      throw new Error('oral-skill-adapter: invalid level ' + level + ' (must be 1/2/3)');
    }
  }

  function _validateSkill(skill) {
    return SKILL_IDS.includes(skill);
  }

  // --------------------------------------------------------------------------
  // Loaders
  // --------------------------------------------------------------------------
  function loadPassages(level) {
    _validateLevel(level);
    if (_cache.has(level)) return Promise.resolve(_cache.get(level));

    const url = DATA_PATH_PREFIX + level + DATA_PATH_SUFFIX;
    return fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('oral-skill-adapter: failed to load ' + url + ' (' + r.status + ')');
        return r.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.passages)) {
          throw new Error('oral-skill-adapter: malformed JSON at ' + url);
        }
        _cache.set(level, data);
        return data;
      });
  }

  // getListeningItems — מחזיר flattened items (1 passage × 1 question לכל item),
  // כדי שה-mechanic לא יצטרך לטפל ב-nested questions[].
  // לדוגמה: passage עם 3 שאלות → 3 items עם אותו passage_text שונים ב-question_text/q_id/skill.
  function getListeningItems(level) {
    return loadPassages(level).then(data => {
      const items = [];
      data.passages.forEach(p => {
        if (!p || !Array.isArray(p.questions)) return;
        p.questions.forEach(q => {
          if (!q || !q.q_id || !_validateSkill(q.skill)) return;
          if (!Array.isArray(q.options)) return;
          items.push({
            item_id: p.item_id,
            q_id: q.q_id,
            level: p.level,
            passage_text: p.passage_text,
            question_text: q.question_text,
            skill: q.skill,
            options: q.options,
            // MP3 מוקלט מראש (DNA אודיו) — המכניקות נופלות ל-Web Speech כשחסר.
            passage_audio_key: p.passage_audio_key || null,
            question_audio_key: q.question_audio_key || null,
          });
        });
      });
      return items;
    });
  }

  // getRandomBatch — n items אקראיים מהרמה, ללא חזרות.
  function getRandomBatch(level, n) {
    const count = (typeof n === 'number' && n > 0) ? n : 5;
    return getListeningItems(level).then(items => {
      const shuffled = items.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }
      return shuffled.slice(0, Math.min(count, shuffled.length));
    });
  }

  // getItemsBySkill — items של skill מסויים, לפי intervention (אי 14 כ-תרגול ל-MOY 3).
  function getItemsBySkill(level, skill) {
    if (!_validateSkill(skill)) return Promise.resolve([]);
    return getListeningItems(level).then(items => items.filter(it => it.skill === skill));
  }

  // --------------------------------------------------------------------------
  // BKT integration
  // --------------------------------------------------------------------------

  // Resolve AvneiBKT via window OR global (Node-testable).
  function _getBKT() {
    if (typeof window !== 'undefined' && window.AvneiBKT) return window.AvneiBKT;
    if (typeof global !== 'undefined' && global.AvneiBKT) return global.AvneiBKT;
    return null;
  }

  // recordAttempt — קולט תוצאה של ניסיון יחיד ושולח ל-AvneiBKT.
  // ctx = {q_id, item_id, skill, is_correct, response_time_ms, level, session_id?}
  function recordAttempt(studentId, ctx) {
    if (!studentId || !ctx || !_validateSkill(ctx.skill)) return null;
    const BKT = _getBKT();
    if (!BKT) return null;
    return BKT.ingestEvent({
      student_id: studentId,
      primary_island_id: ISLAND_ID,
      target_oral_skill: ctx.skill,
      is_correct: ctx.is_correct === true,
      response_time_ms: typeof ctx.response_time_ms === 'number' ? ctx.response_time_ms : null,
      session_id: ctx.session_id || ('isle14-' + Date.now()),
      // metadata לדיבאג עתידי / event-logger
      item_id: ctx.item_id,
      q_id: ctx.q_id,
      level: ctx.level,
    });
  }

  // --------------------------------------------------------------------------
  // Weakness discovery — top-N skills חלשים
  // (משמש intervention-matcher: ילדה שנכשלת ב-MOY task 3 → אי 14, skill חלש קודם)
  // --------------------------------------------------------------------------
  function getTopWeakSkills(studentId, n) {
    const limit = (typeof n === 'number' && n > 0) ? n : 3;
    if (!studentId) return [];
    const BKT = _getBKT();
    if (!BKT || typeof BKT.getWeakestOralSkills !== 'function') return [];
    return BKT.getWeakestOralSkills(studentId, limit, { includeUntouched: true });
  }

  // --------------------------------------------------------------------------
  // Mastery
  // --------------------------------------------------------------------------

  // getMastery — האם ילדה שולטת ברמה? mastery = כל 3 ה-skills 70%+ עם 5+ ניסיונות.
  // אם רמה ספציפית מבוקשת, ה-API זהה (mastery של אי 14 לא מפצל פר רמה — רק פר skill).
  function getMastery(studentId, level) {
    if (level !== undefined) _validateLevel(level);
    const dist = _getDistribution(studentId);
    if (!dist) return { met: false, accuracy: null, mastered_skills: [], reason: 'no-data' };

    const mastered_skills = [];
    let totalAttempts = 0;
    let totalCorrect = 0;
    let allPass = true;

    SKILL_IDS.forEach(skill => {
      const ss = _getSkillStateSafe(studentId, skill);
      if (!ss) { allPass = false; return; }
      totalAttempts += ss.attempts || 0;
      totalCorrect += ss.correct || 0;
      const acc = (ss.attempts >= MIN_ATTEMPTS_FOR_MASTERY && ss.attempts > 0)
        ? (ss.correct / ss.attempts) : 0;
      if (ss.attempts >= MIN_ATTEMPTS_FOR_MASTERY && acc >= MASTERY_THRESHOLD) {
        mastered_skills.push(skill);
      } else {
        allPass = false;
      }
    });

    const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) : null;
    return {
      met: allPass,
      accuracy,
      mastered_skills,
      total_attempts: totalAttempts,
      distribution: dist,
    };
  }

  function getMasteryOverall(studentId) {
    return getMastery(studentId);
  }

  function _getDistribution(studentId) {
    const BKT = _getBKT();
    if (!BKT || typeof BKT.getOralSkillMasteryDistribution !== 'function') return null;
    return BKT.getOralSkillMasteryDistribution(studentId);
  }

  function _getSkillStateSafe(studentId, skill) {
    const BKT = _getBKT();
    if (!BKT || typeof BKT.getOralSkillState !== 'function') return null;
    return BKT.getOralSkillState(studentId, skill);
  }

  // --------------------------------------------------------------------------
  // Helpers לטסטים — מאפשרים inject של BKT mock
  // --------------------------------------------------------------------------
  function _clearCache() { _cache.clear(); }
  function _seedCache(level, data) { _cache.set(level, data); }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------
  const API = {
    // Constants
    SKILL_IDS,
    SKILL_DISPLAY_HE,
    LEVELS,
    ISLAND_ID,
    MASTERY_THRESHOLD,
    MIN_ATTEMPTS_FOR_MASTERY,

    // Loaders
    loadPassages,
    getListeningItems,
    getRandomBatch,
    getItemsBySkill,

    // BKT integration
    recordAttempt,
    getTopWeakSkills,

    // Mastery
    getMastery,
    getMasteryOverall,

    // Testing utilities
    _clearCache,
    _seedCache,
    _validateSkill,
  };

  if (typeof window !== 'undefined') {
    window.AvneiOralSkillAdapter = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
