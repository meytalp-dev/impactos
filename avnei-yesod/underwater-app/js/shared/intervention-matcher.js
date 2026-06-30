// ============================================================================
// shared/intervention-matcher.js — B.8 (Intervention Matcher)
// סוכן 17 · 28.5.2026
//
// מטרה: מנוע התאמת אינטרבנציה לתלמידה לפי EPA pattern + MOY suggestion.
//        זה החלק החסר בין "אני יודעת שיש בעיה" (EPA/MOY) ל-"אני יודעת איזה
//        intervention" (B.7). היחידה הזו לא מזהה דפוסים מאפס — היא צורכת את
//        AvneiInterventions.detectForStudent (שכבר ממפה EPA→B.7) ואת
//        AvneiAssessments.getMOYStatus(sid).suggested_intervention (MOY layer),
//        בוחרת אחת לפי priority list מ-moy-intervention-map, ומשלבת.
//
// API (נחשף ב-window.AvneiInterventionMatcher):
//   matchForStudent(studentId) → {
//     pattern_id: 'phonological' | 'letter_knowledge' | 'decoding' |
//                 'fluency' | 'letter_cluster',
//     confidence: 'high' | 'med' | 'low',
//     source: 'epa' | 'moy' | 'combined',
//     reason: string,           // הסבר עברי קצר למורה
//     details: { epa?, moy? }   // לדיבאג + UI עתידי
//   } | null
//
//   matchForGroup(studentIds[]) → {
//     pattern_id,
//     students_matched: [{ studentId, source, confidence }, ...],
//     common_evidence: {
//       total_checked,
//       matched_count,
//       by_source: { epa, moy, combined }
//     }
//   } | null
//
//   PRIORITY  — רשימת priority פעילה (לדיבאג + טסטים)
//   PATTERN_NAMES_HE — שמות עבריים פר patternId (לדיבאג)
//
// תלויות (קריאה בלבד):
//   window.AvneiInterventions  (B.7)  — detectForStudent
//   window.AvneiAssessments    (סוכן 14) — getMOYStatus · loadInterventionMap
//
// עקרונות:
//   - מקור יחיד לאמת על "EPA pattern → B.7 pattern": interventions.js (לא
//     מכפילים מיפוי כאן).
//   - "preference: EPA על MOY" (לפי הוראת מיטל) — כש-EPA + MOY קיימים שניהם
//     אבל מסכימים על דפוסים שונים, EPA מנצח. ה-source נשאר 'combined' (שני
//     הסיגנלים נשקלו), confidence נופל ל-EPA. אם הם מסכימים — bump-up confidence.
//   - fluency דורש classP75 שאין למאצ'ר. ולכן יופיע רק אם הוקלט כבר ב-MOY/EPA
//     בהקשר אחר. זה בסדר — fluency הוא קטגוריה אחרונה ב-priority list.
//   - logic only: שום DOM, שום fetch, שום localStorage I/O ישיר (קוראים דרך
//     ה-API של ה-modules התלויים).
//
// טסטים: scripts/test-intervention-matcher.js
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // קבועים
  // --------------------------------------------------------------------------

  // priority ברירת-מחדל — תואם moy-intervention-map.json (אישרה מיטל 28.5).
  // אם AvneiAssessments.loadInterventionMap זמין ויש בו epa_bkt_pattern_priority
  // נשתמש במקור-של-אמת ההוא. כאן רק fallback.
  const DEFAULT_PRIORITY = Object.freeze([
    'letter_knowledge',
    'letter_cluster',
    // T6 (30.6.2026) — דפוסים ספציפיים ופעולתיים, אחרי האותיות אך לפני הרחבים יותר.
    'morphology',
    'comprehension',
    'decoding',
    'fluency',
    'phonological'
  ]);

  const PATTERN_NAMES_HE = Object.freeze({
    phonological:    'מודעות פונולוגית',
    letter_knowledge:'ידיעת אותיות',
    decoding:        'פענוח בהקשר',
    fluency:         'שטף קריאה',
    letter_cluster:  'חיזוק אותיות חלשות',
    morphology:      'מורפולוגיה (רבים · זכר-נקבה)',
    comprehension:   'הבנת הנקרא'
  });

  const CONF_RANK = Object.freeze({ low: 0, med: 1, high: 2 });
  const CONF_BY_RANK = Object.freeze(['low', 'med', 'high']);

  // --------------------------------------------------------------------------
  // גישה ל-modules תלויים (טסטים יכולים להזריק mocks ב-global/window)
  // --------------------------------------------------------------------------

  function _getInterventions() {
    if (typeof window !== 'undefined' && window.AvneiInterventions) return window.AvneiInterventions;
    if (typeof global !== 'undefined' && global.AvneiInterventions) return global.AvneiInterventions;
    return null;
  }

  function _getAssessments() {
    if (typeof window !== 'undefined' && window.AvneiAssessments) return window.AvneiAssessments;
    if (typeof global !== 'undefined' && global.AvneiAssessments) return global.AvneiAssessments;
    return null;
  }

  // --------------------------------------------------------------------------
  // עזרים
  // --------------------------------------------------------------------------

  function _patternHe(patternId) {
    return PATTERN_NAMES_HE[patternId] || patternId;
  }

  function _bumpConfidence(conf) {
    const r = CONF_RANK[conf];
    if (typeof r !== 'number') return 'low';
    const next = Math.min(r + 1, 2);
    return CONF_BY_RANK[next];
  }

  // בוחר trigger עדיף מתוך epaTriggers לפי priority list.
  // priority הוא array — מי שמופיע מוקדם יותר עדיף.
  // tie-breaker: confidence (high > med > low). אחר-כך: סדר הופעה.
  function _pickBestByPriority(triggers, priority) {
    if (!triggers || triggers.length === 0) return null;
    let best = null;
    let bestIdx = Infinity;
    let bestConfRank = -1;
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];
      if (!t || !t.patternId) continue;
      const idx = priority.indexOf(t.patternId);
      const pIdx = (idx === -1) ? 999 : idx;
      const confRank = CONF_RANK[t.confidence];
      const cRank = (typeof confRank === 'number') ? confRank : 0;
      if (pIdx < bestIdx || (pIdx === bestIdx && cRank > bestConfRank)) {
        best = t;
        bestIdx = pIdx;
        bestConfRank = cRank;
      }
    }
    return best;
  }

  function _getActivePriority() {
    const A = _getAssessments();
    if (A && typeof A.loadInterventionMap === 'function') {
      try {
        const map = A.loadInterventionMap();
        if (map && Array.isArray(map.epa_bkt_pattern_priority) &&
            map.epa_bkt_pattern_priority.length > 0) {
          return map.epa_bkt_pattern_priority;
        }
      } catch (e) { /* fall through */ }
    }
    return DEFAULT_PRIORITY;
  }

  // --------------------------------------------------------------------------
  // matchForStudent — ליבת ההחלטה פר ילדה
  // --------------------------------------------------------------------------

  function matchForStudent(studentId) {
    if (!studentId) return null;

    const Interventions = _getInterventions();
    const Assessments = _getAssessments();
    const priority = _getActivePriority();

    // 1. EPA-based triggers (interventions.js כבר ממפה EPA→B.7 patterns)
    let epaTriggers = [];
    if (Interventions && typeof Interventions.detectForStudent === 'function') {
      try {
        const t = Interventions.detectForStudent(studentId, {});
        if (Array.isArray(t)) epaTriggers = t;
      } catch (e) { /* swallow — מאצ'ר מותר להמשיך גם בלי EPA */ }
    }
    const bestEpa = _pickBestByPriority(epaTriggers, priority);

    // 2. MOY suggestion
    let moySug = null;
    if (Assessments && typeof Assessments.getMOYStatus === 'function') {
      try {
        const m = Assessments.getMOYStatus(studentId);
        if (m && m.suggested_intervention) moySug = m.suggested_intervention;
      } catch (e) { /* fall through */ }
    }

    // 3. אין כלום → null
    if (!bestEpa && !moySug) return null;

    // 4. EPA + MOY → combined (EPA wins on conflict, bump on agreement)
    if (bestEpa && moySug) {
      const epaPid = bestEpa.patternId;
      const moyPid = moySug.patternId;
      let confidence, reason;
      if (epaPid === moyPid) {
        confidence = _bumpConfidence(bestEpa.confidence || 'low');
        reason = 'EPA + MOY מצביעים על ' + _patternHe(epaPid) + ' — סיגנל משולב';
      } else {
        confidence = bestEpa.confidence || 'low';
        reason = 'EPA מצביע על ' + _patternHe(epaPid) +
                 ' (גובר על MOY שמציע ' + _patternHe(moyPid) + ')';
      }
      return {
        pattern_id: epaPid,
        confidence: confidence,
        source: 'combined',
        reason: reason,
        details: {
          epa: { patternId: epaPid, confidence: bestEpa.confidence, details: bestEpa.details },
          moy: { patternId: moyPid, source: moySug.source, match_quality: moySug.match_quality }
        }
      };
    }

    // 5. EPA only
    if (bestEpa) {
      return {
        pattern_id: bestEpa.patternId,
        confidence: bestEpa.confidence || 'low',
        source: 'epa',
        reason: 'EPA מצביע על ' + _patternHe(bestEpa.patternId),
        details: { epa: { patternId: bestEpa.patternId, confidence: bestEpa.confidence, details: bestEpa.details } }
      };
    }

    // 6. MOY only
    return {
      pattern_id: moySug.patternId,
      confidence: moySug.confidence || 'low',
      source: 'moy',
      reason: moySug.notice || ('MOY מציע ' + _patternHe(moySug.patternId) +
              ' (התאמה ' + (moySug.match_quality || 'partial') + ')'),
      details: { moy: { patternId: moySug.patternId, source: moySug.source, match_quality: moySug.match_quality } }
    };
  }

  // --------------------------------------------------------------------------
  // matchForGroup — מאחד matches פר ילדה לדפוס משותף לקבוצה
  // --------------------------------------------------------------------------

  function matchForGroup(studentIds) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return null;

    const perStudent = [];
    const sourceCountsByPattern = {};
    for (let i = 0; i < studentIds.length; i++) {
      const sid = studentIds[i];
      const m = matchForStudent(sid);
      if (!m) continue;
      perStudent.push({
        studentId: sid,
        pattern_id: m.pattern_id,
        source: m.source,
        confidence: m.confidence
      });
      if (!sourceCountsByPattern[m.pattern_id]) {
        sourceCountsByPattern[m.pattern_id] = { count: 0, epa: 0, moy: 0, combined: 0 };
      }
      const bucket = sourceCountsByPattern[m.pattern_id];
      bucket.count++;
      bucket[m.source] = (bucket[m.source] || 0) + 1;
    }

    if (perStudent.length === 0) return null;

    // בוחרים את הדפוס עם הכי הרבה ילדות. tie-breaker: priority list.
    const priority = _getActivePriority();
    const keys = Object.keys(sourceCountsByPattern);
    let bestPattern = null;
    let bestCount = -1;
    let bestPrioIdx = Infinity;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const c = sourceCountsByPattern[k].count;
      const pIdx = priority.indexOf(k);
      const idx = (pIdx === -1) ? 999 : pIdx;
      if (c > bestCount || (c === bestCount && idx < bestPrioIdx)) {
        bestPattern = k;
        bestCount = c;
        bestPrioIdx = idx;
      }
    }

    const matchedStudents = perStudent.filter(function (p) { return p.pattern_id === bestPattern; });
    const bucket = sourceCountsByPattern[bestPattern];

    return {
      pattern_id: bestPattern,
      students_matched: matchedStudents.map(function (p) {
        return { studentId: p.studentId, source: p.source, confidence: p.confidence };
      }),
      common_evidence: {
        total_checked: studentIds.length,
        matched_count: matchedStudents.length,
        by_source: {
          epa: bucket.epa || 0,
          moy: bucket.moy || 0,
          combined: bucket.combined || 0
        }
      }
    };
  }

  // --------------------------------------------------------------------------
  // ייצוא ל-window + Node
  // --------------------------------------------------------------------------

  const API = {
    matchForStudent: matchForStudent,
    matchForGroup: matchForGroup,
    // helpers + constants (לטסטים + UI עתידי)
    PRIORITY: DEFAULT_PRIORITY,
    PATTERN_NAMES_HE: PATTERN_NAMES_HE,
    _pickBestByPriority: _pickBestByPriority,
    _bumpConfidence: _bumpConfidence,
    _getActivePriority: _getActivePriority
  };

  if (typeof window !== 'undefined') {
    window.AvneiInterventionMatcher = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
