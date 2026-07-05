// ============================================================================
// interventions.js — B.7 (Targeted Reading Interventions)
// ============================================================================
//
// המשימה (28.5.2026 · spec: _handoff/2026-05-28-B7-interventions-spec.md):
//   ספק 5 scripts פדגוגיים לקבוצות תמיכה Tier-2 RTI (3-4 ילדות · 10-15 דק' ·
//   4-5 ימים שבועיים). זיהוי אוטומטי מתוך EPA + Sub-BKT — F.21A מציע
//   "פתחי קבוצת תמיכה" כשהוא רואה דפוס משותף ל-3+ ילדות.
//
// T6 · 5.7.2026 (minigame-fit): +3 דפוסים מבנק-השאלות — comprehension /
//   wrong_plural / gender_mismatch (EPA failure=Comprehension/WrongPlural/
//   GenderMismatch). scripts: interventions/comprehension.json ·
//   wrong-plural.json · gender-mismatch.json (טעונים אישור פדגוגי של מיטל).
//
// API (נחשף ב-window.AvneiInterventions):
//   loadScript(patternId)                          → script JSON (cache or load)
//   preloadAll()                                   → Promise<{patternId: script}>
//   detectForStudent(studentId, ctx)               → array of triggers per student
//   detectGroupTriggers(students, opts)            → array of group triggers
//   interpolateScript(script, groupDetails, stuDetails) → script with {placeholders} filled
//   recordIntervention(studentIds, patternId, payload) → boolean (success)
//   getInterventionsFor(studentId)                 → array of records
//   resetInterventions(studentId?)                 → void  (test helper)
//
//   PATTERN_IDS · CONFUSED_PAIRS · STORAGE_KEY · INTERVENTION_DEFAULTS
//
// תלויות:
//   window.AvneiEPA  (A.3)  — failure axis + getDominantPattern
//   window.AvneiBKT  (A.4)  — getLetterState · getStrandState · getLetterMasteryDistribution
//   localStorage  (recordIntervention persistence)
//
// טסטים: scripts/test-interventions.js
// ============================================================================

(function () {
  'use strict';

  // ==========================================================================
  // קבועים
  // ==========================================================================

  const PATTERN_IDS = Object.freeze([
    'phonological',
    'letter_knowledge',
    'decoding',
    'fluency',
    'letter_cluster',
    // T6 · 5.7.2026 — דפוסי EPA מבנק-השאלות (minigame-fit G2/G3):
    'comprehension',
    'wrong_plural',
    'gender_mismatch'
  ]);

  const STORAGE_KEY = 'avnei-interventions-v1';

  // ספים לזיהוי דפוסים — מבוססים על spec §5 (B.7) + §6 (EPA dominance).
  // ניתנים לכיול בפיילוט — לא בסקופ B.7.
  const INTERVENTION_DEFAULTS = Object.freeze({
    minGroupSize: 3,                       // §2 — 3-4 ילדות
    maxGroupSize: 4,
    // Phonological
    phonologicalMinSoundFailures: 10,      // §3.1
    phonologicalMinErrorRate: 0.30,        // §3.1
    // Letter knowledge
    letterKnowledgeMaxPKnown: 0.40,        // §3.2 — sub-BKT < 0.40
    letterKnowledgeMinAttempts: 3,         // אמינות מינ' לכל אות בזוג
    // Decoding (context)
    decodingMinContextPercent: 0.65,       // §3.3
    // Fluency
    fluencyMinAccuracy: 0.70,              // §3.4
    fluencyMinSamples: 5,                  // לפחות 5 ניסיונות לחישוב median
    fluencyPercentile: 0.75,               // P75 בכיתה
    // Letter cluster
    letterClusterMinWeak: 3,               // §3.5 — 3+ אותיות weak
    // T6 · 5.7.2026 — דפוסי EPA failure מבנק-השאלות (Comprehension/WrongPlural/GenderMismatch).
    // ספים בסגנון phonological: מינימום כשלים מצטבר + חלק מכלל הכשלים.
    // הבנה נמדדת בנפח שאלות גדול יותר → סף גבוה מעט. ניתן לכיול בפיילוט.
    comprehensionMinFailures: 8,
    comprehensionMinErrorRate: 0.25,
    wrongPluralMinFailures: 6,
    wrongPluralMinErrorRate: 0.25,
    genderMismatchMinFailures: 6,
    genderMismatchMinErrorRate: 0.25
  });

  // CONFUSED_PAIRS — זוגות אותיות מתבלבלות (פדגוגית-ידועות).
  // המקור: מורי ספרות ובלשנות בכיתה א'. רשימה סגורה, ניתנת לכיול בפיילוט.
  const CONFUSED_PAIRS = Object.freeze([
    { pair: ['מ', 'ם'], example_a: 'אֵם · מַיִם · מָה',     example_b: 'לֶחֶם · יָם · עוֹלָם',
      distinction: 'מ פתוחה למטה · ם סגורה תָּמִיד בסוֹף מילה' },
    { pair: ['נ', 'ן'], example_a: 'נֵר · נָחָש · נַעַל',   example_b: 'בֵּן · יָוֵן · מָגֵן',
      distinction: 'נ יוֹשבת קצרה · ן מאריכה למטה בסוֹף מילה' },
    { pair: ['כ', 'ך'], example_a: 'כֶּלֶב · כּוֹכָב · כַּד', example_b: 'מֶלֶךְ · אָבִיךְ · אֵיךְ',
      distinction: 'כ עגולה קצרה · ך מאריכה למטה בסוֹף מילה' },
    { pair: ['פ', 'ף'], example_a: 'פֶּה · פִּיל · פֶּרַח',   example_b: 'אַף · סוֹף · נוֹף',
      distinction: 'פ פתוחה למעלה · ף מאריכה למטה בסוֹף מילה' },
    { pair: ['צ', 'ץ'], example_a: 'צִפּוֹר · צֵל · צַד',     example_b: 'עֵץ · קֵץ · אֶרֶץ',
      distinction: 'צ פנים · ץ מאריכה למטה בסוֹף מילה' },
    { pair: ['ב', 'פ'], example_a: 'בַּיִת · בָּנָה · בָּא',    example_b: 'פֶּה · פִּיל · פֶּרַח',
      distinction: 'ב = בית קטן · פ = פה פתוח' },
    { pair: ['ה', 'ח'], example_a: 'הַר · הוּא · הַיוֹם',    example_b: 'חַי · חַם · חָתוּל',
      distinction: 'ה רגל קצרה לא נוגעת · ח רגל מקושטת נוגעת' },
    { pair: ['ד', 'ר'], example_a: 'דָּג · דֶּלֶת · דּוֹב',   example_b: 'רֹאשׁ · רֵיחַ · רֶגֶל',
      distinction: 'ד פינה ברורה · ר עגולה למעלה' },
    { pair: ['ז', 'ו'], example_a: 'זְמַן · זָהָב · זָנָב',  example_b: 'וֶרֶד · וָאוֹמַר · וּכְבָר',
      distinction: 'ז בעלת כובע למעלה · ו ישרה' }
  ]);

  // נתיב יחסי לדפדפן · נתיב מוחלט ל-Node (לטסטים)
  const INTERVENTIONS_RELATIVE_PATH = 'interventions/';

  // ==========================================================================
  // טעינת script (cache + sync XHR בדפדפן · fs ב-Node)
  // ==========================================================================

  const _cache = {};

  function _setScriptCache(patternId, script) {
    _cache[patternId] = script;
  }

  function _clearCache() {
    for (const k of Object.keys(_cache)) delete _cache[k];
  }

  function loadScript(patternId) {
    if (!patternId || PATTERN_IDS.indexOf(patternId) === -1) return null;
    if (_cache[patternId]) return _cache[patternId];

    // החלפת underscore ב-dash לשמות קבצים: letter_knowledge → letter-knowledge.json
    const fileBase = patternId.replace(/_/g, '-');

    // דפדפן — sync XHR (פיילוט; לא ל-production)
    if (typeof XMLHttpRequest !== 'undefined') {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', INTERVENTIONS_RELATIVE_PATH + fileBase + '.json', false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          _cache[patternId] = JSON.parse(xhr.responseText);
          return _cache[patternId];
        }
      } catch (e) { /* fallback */ }
    }

    // Node — fs sync
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const file = path.resolve(
          __dirname || '.',
          '..', '..', 'interventions',
          fileBase + '.json'
        );
        if (fs.existsSync(file)) {
          _cache[patternId] = JSON.parse(fs.readFileSync(file, 'utf8'));
          return _cache[patternId];
        }
      } catch (e) { /* fall through */ }
    }

    return null;
  }

  function preloadAll() {
    if (typeof fetch === 'undefined') {
      // Node או דפדפן ישן — sync
      const out = {};
      PATTERN_IDS.forEach(function (id) { out[id] = loadScript(id); });
      return Promise.resolve(out);
    }
    return Promise.all(PATTERN_IDS.map(function (id) {
      if (_cache[id]) return Promise.resolve([id, _cache[id]]);
      const fileBase = id.replace(/_/g, '-');
      return fetch(INTERVENTIONS_RELATIVE_PATH + fileBase + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (script) {
          if (script) _cache[id] = script;
          return [id, script];
        })
        .catch(function () { return [id, null]; });
    })).then(function (pairs) {
      const out = {};
      pairs.forEach(function (p) { out[p[0]] = p[1]; });
      return out;
    });
  }

  // ==========================================================================
  // עזרים סטטיסטיים
  // ==========================================================================

  function _median(arr) {
    if (!arr || arr.length === 0) return null;
    const sorted = arr.slice().sort(function (a, b) { return a - b; });
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function _percentile(arr, p) {
    if (!arr || arr.length === 0) return null;
    const sorted = arr.slice().sort(function (a, b) { return a - b; });
    const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
    return sorted[idx];
  }

  function _aggregateConfidence(confs) {
    if (!confs || confs.length === 0) return 'low';
    // אם כל הילדות עם 'high' → high; אם רובן med+ → med; אחרת low
    const counts = { high: 0, med: 0, low: 0 };
    confs.forEach(function (c) { counts[c || 'low']++; });
    if (counts.high === confs.length) return 'high';
    if (counts.high + counts.med >= confs.length * 0.66) return 'med';
    return 'low';
  }

  function _getBKT() {
    return (typeof window !== 'undefined' && window.AvneiBKT) ||
           (typeof global !== 'undefined' && global.AvneiBKT) || null;
  }

  function _getEPA() {
    return (typeof window !== 'undefined' && window.AvneiEPA) ||
           (typeof global !== 'undefined' && global.AvneiEPA) || null;
  }

  // ==========================================================================
  // זיהוי דפוסים פר-ילדה
  // ==========================================================================

  // Phonological — EPA failure='Sound' מצטבר.
  // ספים: sound_failures >= 10 AND sound_failures / total_failures >= 30%.
  // (פירשנו "error_rate" כיחס בין כשלי Sound לסך הכשלים — לפי spec §6 ב-EPA.)
  function _detectPhonological(studentId) {
    const EPA = _getEPA();
    if (!EPA || !EPA.getEPA) return null;
    const studentEpa = EPA.getEPA(studentId);
    if (!studentEpa || Object.keys(studentEpa).length === 0) return null;

    let soundCount = 0;
    let totalFailureCount = 0;
    Object.keys(studentEpa).forEach(function (islandId) {
      const islandRec = studentEpa[islandId] || {};
      Object.keys(islandRec).forEach(function (letter) {
        const letterRec = islandRec[letter] || {};
        const failureCounts = letterRec.failure || {};
        Object.keys(failureCounts).forEach(function (val) {
          const c = failureCounts[val] || 0;
          totalFailureCount += c;
          if (val === 'Sound') soundCount += c;
        });
      });
    });

    if (soundCount < INTERVENTION_DEFAULTS.phonologicalMinSoundFailures) return null;
    if (totalFailureCount === 0) return null;
    const errorRate = soundCount / totalFailureCount;
    if (errorRate < INTERVENTION_DEFAULTS.phonologicalMinErrorRate) return null;

    return {
      patternId: 'phonological',
      details: {
        sound_failures: soundCount,
        total_failures: totalFailureCount,
        error_rate: errorRate
      },
      confidence: soundCount >= 30 ? 'high' : (soundCount >= 15 ? 'med' : 'low')
    };
  }

  // Letter Knowledge — איתור זוגות אותיות מתבלבלות.
  // פר זוג ב-CONFUSED_PAIRS: שתי האותיות עם pKnown < 0.40 + attempts >= 3.
  // מחזיר מערך — ילדה יכולה להיתקל ביותר מזוג אחד.
  function _detectLetterKnowledge(studentId) {
    const BKT = _getBKT();
    if (!BKT || !BKT.getLetterState) return [];

    const results = [];
    for (let i = 0; i < CONFUSED_PAIRS.length; i++) {
      const cp = CONFUSED_PAIRS[i];
      const a = cp.pair[0];
      const b = cp.pair[1];
      const sa = BKT.getLetterState(studentId, a);
      const sb = BKT.getLetterState(studentId, b);
      if (!sa || !sb) continue;
      if ((sa.attempts || 0) < INTERVENTION_DEFAULTS.letterKnowledgeMinAttempts) continue;
      if ((sb.attempts || 0) < INTERVENTION_DEFAULTS.letterKnowledgeMinAttempts) continue;
      if (sa.pKnown < INTERVENTION_DEFAULTS.letterKnowledgeMaxPKnown &&
          sb.pKnown < INTERVENTION_DEFAULTS.letterKnowledgeMaxPKnown) {
        results.push({
          patternId: 'letter_knowledge',
          details: {
            confused_pair: cp.pair,
            example_a: cp.example_a,
            example_b: cp.example_b,
            distinction: cp.distinction,
            p_a: sa.pKnown,
            p_b: sb.pKnown,
            attempts_a: sa.attempts,
            attempts_b: sb.attempts
          },
          confidence: (sa.attempts >= 10 && sb.attempts >= 10) ? 'high' : 'med'
        });
      }
    }
    return results;
  }

  // Decoding (context) — EPA dominant pattern על ציר context.
  // עובר על כל איי הילדה, מחפש axis=context עם percent >= 65%.
  function _detectDecoding(studentId) {
    const EPA = _getEPA();
    if (!EPA || !EPA.getEPA || !EPA.getDominantPattern) return null;
    const studentEpa = EPA.getEPA(studentId);
    if (!studentEpa) return null;

    const minPercent = INTERVENTION_DEFAULTS.decodingMinContextPercent;
    let best = null;
    Object.keys(studentEpa).forEach(function (islandId) {
      const dom = EPA.getDominantPattern(studentId, islandId, minPercent);
      if (!dom) return;
      if (dom.axis !== 'context') return;
      if (dom.percent < minPercent) return;
      if (dom.value === 'isolation') return;  // בידוד אינו "דפוס פענוח" משמעותי
      if (!best || dom.percent > best.percent) {
        best = {
          context_value: dom.value,
          percent: dom.percent,
          count: dom.count,
          total: dom.total,
          island_id: Number(islandId)
        };
      }
    });
    if (!best) return null;

    return {
      patternId: 'decoding',
      details: best,
      confidence: best.count >= 10 ? 'high' : (best.count >= 5 ? 'med' : 'low')
    };
  }

  // Fluency — מצריך classP75 (חישוב class-level).
  // אם median ילדה > P75 בכיתה AND accuracy >= 70% → trigger.
  function _detectFluency(studentId, classP75) {
    if (typeof classP75 !== 'number' || classP75 <= 0) return null;
    const BKT = _getBKT();
    if (!BKT || !BKT.getStrandState) return null;
    const strand = BKT.getStrandState(studentId, 1);
    if (!strand) return null;
    const times = strand.responseTimesMs || [];
    if (times.length < INTERVENTION_DEFAULTS.fluencyMinSamples) return null;

    const med = _median(times);
    if (med === null) return null;
    const attempts = strand.attempts || 0;
    if (attempts === 0) return null;
    const accuracy = (strand.correct || 0) / attempts;
    if (accuracy < INTERVENTION_DEFAULTS.fluencyMinAccuracy) return null;
    if (med <= classP75) return null;

    return {
      patternId: 'fluency',
      details: {
        median_ms: med,
        class_p75_ms: classP75,
        accuracy: accuracy,
        attempts: attempts
      },
      confidence: attempts >= 30 ? 'high' : (attempts >= 15 ? 'med' : 'low')
    };
  }

  // Letter cluster — getLetterMasteryDistribution() עם weak >= 3.
  function _detectLetterCluster(studentId) {
    const BKT = _getBKT();
    if (!BKT || !BKT.getLetterMasteryDistribution) return null;
    const dist = BKT.getLetterMasteryDistribution(studentId);
    if (!dist || (dist.weak || 0) < INTERVENTION_DEFAULTS.letterClusterMinWeak) return null;

    const weakLetters = (dist.by_bucket && dist.by_bucket.weak) || [];
    return {
      patternId: 'letter_cluster',
      details: {
        weak_letters: weakLetters.slice(0, 3),
        all_weak_letters: weakLetters,
        count: dist.weak
      },
      confidence: dist.weak >= 5 ? 'high' : 'med'
    };
  }

  // T6 · 5.7.2026 — גלאי גנרי לערך failure בודד ב-EPA (באותו מבנה כמו phonological).
  // סופר את כשלי ה-value המבוקש על פני כל האיים וכל ה-unitKeys (אות או characteristic_id),
  // ומפעיל trigger כשיש גם מינימום כשלים וגם חלק מספיק מכלל הכשלים.
  function _detectFailureValue(studentId, failureValue, patternId, minCount, minRate) {
    const EPA = _getEPA();
    if (!EPA || !EPA.getEPA) return null;
    const studentEpa = EPA.getEPA(studentId);
    if (!studentEpa || Object.keys(studentEpa).length === 0) return null;

    let valueCount = 0;
    let totalFailureCount = 0;
    Object.keys(studentEpa).forEach(function (islandId) {
      const islandRec = studentEpa[islandId] || {};
      Object.keys(islandRec).forEach(function (unitKey) {
        const unitRec = islandRec[unitKey] || {};
        const failureCounts = unitRec.failure || {};
        Object.keys(failureCounts).forEach(function (val) {
          const c = failureCounts[val] || 0;
          totalFailureCount += c;
          if (val === failureValue) valueCount += c;
        });
      });
    });

    if (valueCount < minCount) return null;
    if (totalFailureCount === 0) return null;
    const errorRate = valueCount / totalFailureCount;
    if (errorRate < minRate) return null;

    return {
      patternId: patternId,
      details: {
        failure_value: failureValue,
        value_failures: valueCount,
        total_failures: totalFailureCount,
        error_rate: errorRate
      },
      confidence: valueCount >= minCount * 3 ? 'high'
        : (valueCount >= minCount * 1.5 ? 'med' : 'low')
    };
  }

  function _detectComprehension(studentId) {
    return _detectFailureValue(studentId, 'Comprehension', 'comprehension',
      INTERVENTION_DEFAULTS.comprehensionMinFailures,
      INTERVENTION_DEFAULTS.comprehensionMinErrorRate);
  }

  function _detectWrongPlural(studentId) {
    return _detectFailureValue(studentId, 'WrongPlural', 'wrong_plural',
      INTERVENTION_DEFAULTS.wrongPluralMinFailures,
      INTERVENTION_DEFAULTS.wrongPluralMinErrorRate);
  }

  function _detectGenderMismatch(studentId) {
    return _detectFailureValue(studentId, 'GenderMismatch', 'gender_mismatch',
      INTERVENTION_DEFAULTS.genderMismatchMinFailures,
      INTERVENTION_DEFAULTS.genderMismatchMinErrorRate);
  }

  // ==========================================================================
  // detectForStudent — מחזיר מערך של כל triggers שמתאימים לילדה
  // ==========================================================================
  function detectForStudent(studentId, ctx) {
    ctx = ctx || {};
    const out = [];

    const phon = _detectPhonological(studentId);
    if (phon) out.push(phon);

    const lk = _detectLetterKnowledge(studentId);
    if (lk && lk.length > 0) lk.forEach(function (t) { out.push(t); });

    const dec = _detectDecoding(studentId);
    if (dec) out.push(dec);

    if (typeof ctx.classP75 === 'number') {
      const flu = _detectFluency(studentId, ctx.classP75);
      if (flu) out.push(flu);
    }

    const lc = _detectLetterCluster(studentId);
    if (lc) out.push(lc);

    // T6 — דפוסי EPA failure מבנק-השאלות
    const comp = _detectComprehension(studentId);
    if (comp) out.push(comp);

    const wp = _detectWrongPlural(studentId);
    if (wp) out.push(wp);

    const gm = _detectGenderMismatch(studentId);
    if (gm) out.push(gm);

    return out;
  }

  // ==========================================================================
  // detectGroupTriggers — class-level. מאחד triggers ל-groups של 3+ ילדות.
  // ==========================================================================
  function _computeClassP75ResponseTime(students) {
    const BKT = _getBKT();
    if (!BKT || !BKT.getStrandState) return null;
    const medians = [];
    students.forEach(function (stu) {
      const strand = BKT.getStrandState(stu.id, 1);
      if (!strand) return;
      const times = strand.responseTimesMs || [];
      if (times.length < INTERVENTION_DEFAULTS.fluencyMinSamples) return;
      const med = _median(times);
      if (med !== null) medians.push(med);
    });
    if (medians.length < 2) return null;  // כיתה קטנה מדי
    return _percentile(medians, INTERVENTION_DEFAULTS.fluencyPercentile);
  }

  function detectGroupTriggers(students, opts) {
    opts = opts || {};
    const minGroupSize = opts.minGroupSize || INTERVENTION_DEFAULTS.minGroupSize;
    if (!students || students.length === 0) return [];

    const classP75 = _computeClassP75ResponseTime(students);
    const perStudent = students.map(function (stu) {
      return {
        studentId: stu.id,
        studentName: stu.name || stu.id,
        triggers: detectForStudent(stu.id, { classP75: classP75 })
      };
    });

    const groups = [];

    // ===== Phonological — bucket יחיד =====
    (function () {
      const matched = perStudent.filter(function (s) {
        return s.triggers.some(function (t) { return t.patternId === 'phonological'; });
      });
      if (matched.length >= minGroupSize) {
        const studentEntries = matched.map(function (s) {
          const t = s.triggers.find(function (tt) { return tt.patternId === 'phonological'; });
          return { id: s.studentId, name: s.studentName, details: t.details, confidence: t.confidence };
        });
        groups.push({
          patternId: 'phonological',
          students: studentEntries,
          groupCommonDetails: {},
          confidence: _aggregateConfidence(studentEntries.map(function (e) { return e.confidence; }))
        });
      }
    })();

    // ===== Letter Knowledge — bucket פר זוג אותיות =====
    (function () {
      const byPair = {};
      perStudent.forEach(function (s) {
        s.triggers.filter(function (t) { return t.patternId === 'letter_knowledge'; })
                  .forEach(function (t) {
          const key = t.details.confused_pair.join('-');
          if (!byPair[key]) {
            byPair[key] = {
              pair: t.details.confused_pair,
              example_a: t.details.example_a,
              example_b: t.details.example_b,
              distinction: t.details.distinction,
              students: []
            };
          }
          byPair[key].students.push({
            id: s.studentId,
            name: s.studentName,
            details: t.details,
            confidence: t.confidence
          });
        });
      });
      Object.keys(byPair).forEach(function (key) {
        const b = byPair[key];
        if (b.students.length >= minGroupSize) {
          groups.push({
            patternId: 'letter_knowledge',
            students: b.students,
            groupCommonDetails: {
              confused_pair: b.pair,
              example_a: b.example_a,
              example_b: b.example_b,
              distinction: b.distinction
            },
            confidence: _aggregateConfidence(b.students.map(function (e) { return e.confidence; }))
          });
        }
      });
    })();

    // ===== Decoding — bucket פר context value =====
    (function () {
      const byContext = {};
      perStudent.forEach(function (s) {
        const t = s.triggers.find(function (tt) { return tt.patternId === 'decoding'; });
        if (!t) return;
        const key = t.details.context_value;
        if (!byContext[key]) {
          byContext[key] = { contextValue: key, students: [] };
        }
        byContext[key].students.push({
          id: s.studentId,
          name: s.studentName,
          details: t.details,
          confidence: t.confidence
        });
      });
      Object.keys(byContext).forEach(function (key) {
        const b = byContext[key];
        if (b.students.length >= minGroupSize) {
          groups.push({
            patternId: 'decoding',
            students: b.students,
            groupCommonDetails: { context_value: b.contextValue },
            confidence: _aggregateConfidence(b.students.map(function (e) { return e.confidence; }))
          });
        }
      });
    })();

    // ===== Fluency — bucket יחיד =====
    (function () {
      const matched = perStudent.filter(function (s) {
        return s.triggers.some(function (t) { return t.patternId === 'fluency'; });
      });
      if (matched.length >= minGroupSize) {
        const studentEntries = matched.map(function (s) {
          const t = s.triggers.find(function (tt) { return tt.patternId === 'fluency'; });
          return { id: s.studentId, name: s.studentName, details: t.details, confidence: t.confidence };
        });
        groups.push({
          patternId: 'fluency',
          students: studentEntries,
          groupCommonDetails: { class_p75_ms: classP75 },
          confidence: _aggregateConfidence(studentEntries.map(function (e) { return e.confidence; }))
        });
      }
    })();

    // ===== Letter Cluster — bucket יחיד (כל ילדה עם אותיות משלה) =====
    (function () {
      const matched = perStudent.filter(function (s) {
        return s.triggers.some(function (t) { return t.patternId === 'letter_cluster'; });
      });
      if (matched.length >= minGroupSize) {
        const studentEntries = matched.map(function (s) {
          const t = s.triggers.find(function (tt) { return tt.patternId === 'letter_cluster'; });
          return { id: s.studentId, name: s.studentName, details: t.details, confidence: t.confidence };
        });
        groups.push({
          patternId: 'letter_cluster',
          students: studentEntries,
          groupCommonDetails: {},
          confidence: _aggregateConfidence(studentEntries.map(function (e) { return e.confidence; }))
        });
      }
    })();

    // ===== T6: Comprehension / WrongPlural / GenderMismatch — bucket יחיד פר דפוס =====
    ['comprehension', 'wrong_plural', 'gender_mismatch'].forEach(function (pid) {
      const matched = perStudent.filter(function (s) {
        return s.triggers.some(function (t) { return t.patternId === pid; });
      });
      if (matched.length >= minGroupSize) {
        const studentEntries = matched.map(function (s) {
          const t = s.triggers.find(function (tt) { return tt.patternId === pid; });
          return { id: s.studentId, name: s.studentName, details: t.details, confidence: t.confidence };
        });
        groups.push({
          patternId: pid,
          students: studentEntries,
          groupCommonDetails: {},
          confidence: _aggregateConfidence(studentEntries.map(function (e) { return e.confidence; }))
        });
      }
    });

    return groups;
  }

  // ==========================================================================
  // interpolateScript — מילוי placeholders ב-script
  // ==========================================================================
  function interpolateScript(script, groupCommonDetails, studentDetails) {
    if (!script) return null;
    const merged = Object.assign({}, groupCommonDetails || {}, studentDetails || {});

    // Letter Knowledge — confused_pair[0..1] → letter_a/letter_b
    if (merged.confused_pair && Array.isArray(merged.confused_pair)) {
      merged.letter_a = merged.confused_pair[0];
      merged.letter_b = merged.confused_pair[1];
    }

    // Letter cluster — weak_letters[0..2] → personalized_letters + first
    if (merged.weak_letters && Array.isArray(merged.weak_letters) && merged.weak_letters.length > 0) {
      const w = merged.weak_letters.slice(0, 3);
      merged.personalized_letters = w.join(' · ');
      merged.personalized_first_letter = w[0];
    }

    // Decoding — target_letter ברירת מחדל "ל" אם לא סופק (מומלץ למיטל לעדכן UI)
    if (!merged.target_letter) {
      merged.target_letter = 'ל';
    }

    // Deep clone + replace ב-{placeholders}
    const cloned = JSON.parse(JSON.stringify(script));
    function replaceIn(node) {
      if (!node || typeof node !== 'object') return;
      Object.keys(node).forEach(function (k) {
        const v = node[k];
        if (typeof v === 'string') {
          node[k] = v.replace(/\{(\w+)\}/g, function (match, name) {
            return (name in merged && merged[name] !== undefined && merged[name] !== null)
              ? String(merged[name])
              : match;  // השאר {name} אם לא ניתן למילוי
          });
        } else if (Array.isArray(v)) {
          v.forEach(function (item) {
            if (typeof item === 'string') {
              const idx = v.indexOf(item);
              v[idx] = item.replace(/\{(\w+)\}/g, function (match, name) {
                return (name in merged && merged[name] !== undefined && merged[name] !== null)
                  ? String(merged[name])
                  : match;
              });
            } else if (item && typeof item === 'object') {
              replaceIn(item);
            }
          });
        } else if (v && typeof v === 'object') {
          replaceIn(v);
        }
      });
    }
    replaceIn(cloned);
    return cloned;
  }

  // ==========================================================================
  // recordIntervention + storage
  // ==========================================================================
  function _loadInterventionState() {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function _saveInterventionState(state) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) { return false; }
  }

  function recordIntervention(studentIds, patternId, payload) {
    if (!studentIds || !studentIds.length) return false;
    if (PATTERN_IDS.indexOf(patternId) === -1) return false;

    const state = _loadInterventionState();
    const record = Object.assign({
      date: Date.now(),
      pattern: patternId,
      pattern_details: {},
      group_size: studentIds.length,
      group_students: studentIds.slice(),
      duration_minutes: null,
      success_check: null,
      teacher_note: ''
    }, payload || {});

    studentIds.forEach(function (sid) {
      if (!state[sid]) state[sid] = [];
      state[sid].push(record);
    });
    return _saveInterventionState(state);
  }

  function getInterventionsFor(studentId) {
    const state = _loadInterventionState();
    return (state[studentId] || []).slice();
  }

  function resetInterventions(studentId) {
    if (!studentId) {
      _saveInterventionState({});
      return;
    }
    const state = _loadInterventionState();
    delete state[studentId];
    _saveInterventionState(state);
  }

  // ==========================================================================
  // ייצוא ל-window + Node
  // ==========================================================================
  const API = {
    // public
    loadScript: loadScript,
    preloadAll: preloadAll,
    detectForStudent: detectForStudent,
    detectGroupTriggers: detectGroupTriggers,
    interpolateScript: interpolateScript,
    recordIntervention: recordIntervention,
    getInterventionsFor: getInterventionsFor,
    resetInterventions: resetInterventions,

    // constants
    PATTERN_IDS: PATTERN_IDS,
    CONFUSED_PAIRS: CONFUSED_PAIRS,
    STORAGE_KEY: STORAGE_KEY,
    INTERVENTION_DEFAULTS: INTERVENTION_DEFAULTS,

    // test helpers (not public API)
    _setScriptCache: _setScriptCache,
    _clearCache: _clearCache,
    _detectPhonological: _detectPhonological,
    _detectLetterKnowledge: _detectLetterKnowledge,
    _detectDecoding: _detectDecoding,
    _detectFluency: _detectFluency,
    _detectLetterCluster: _detectLetterCluster,
    _detectFailureValue: _detectFailureValue,
    _detectComprehension: _detectComprehension,
    _detectWrongPlural: _detectWrongPlural,
    _detectGenderMismatch: _detectGenderMismatch,
    _computeClassP75ResponseTime: _computeClassP75ResponseTime,
    _median: _median,
    _percentile: _percentile
  };

  if (typeof window !== 'undefined') {
    window.AvneiInterventions = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
