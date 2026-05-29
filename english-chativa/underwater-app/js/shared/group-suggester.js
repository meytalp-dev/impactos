// ============================================================================
// shared/group-suggester.js — B.9 (Morning Group Suggestion Engine)
// סוכן 18 · 28.5.2026
//
// מטרה: בבוקר המורה פותחת את teacher-rama → רואה רשימה של 4-5 קבוצות
//        אופטימליות לפתיחה היום ("4 ילדות phonological · 3 ילדות letter_knowledge").
//        זה החלק שמשלים את שלשת B.7→B.8→B.9: B.7 = scripts, B.8 = match פר ילדה,
//        B.9 = איך מארגנים את היום פר כיתה.
//
// יחידה logic-only — שום DOM/fetch/localStorage. UI ב-teacher-rama.html.
//
// API (window.AvneiGroupSuggester):
//   suggestGroups(studentIds[], options) → [
//     {
//       pattern_id: 'phonological' | ... ,
//       students: [{ studentId, confidence, source }, ...],
//       confidence: 'high' | 'med' | 'low',   // aggregate per group
//       evidence: {
//         matched_count, total_checked,
//         by_source: { epa, moy, combined }
//       }
//     },
//     ...
//   ]
//
//   options ({field: default}):
//     min_group_size: 3        // Tier-2 evidence-based (Vaughn 2003)
//     max_group_size: 5        // IES Foorman 2016 — לא מעל 5
//     max_groups:     5        // עד 5 קבוצות בבוקר (Riverside teacher load)
//     min_confidence: 'med'    // למה: low → not safe to seed Tier-2 group
//
//   DEFAULT_OPTS — לקריאה בלבד.
//
// תלות (קריאה בלבד):
//   window.AvneiInterventionMatcher (B.8) — matchForStudent, _getActivePriority
//
// אלגוריתם:
//   1. פר תלמידה: matchForStudent → match או null
//   2. סנן ילדות עם confidence < min_confidence (per-student filter)
//   3. קבץ matches לפי pattern_id
//   4. פר pattern:
//        - אם count < min → drop
//        - אם count > max → split homogeneously by confidence
//          (אישרה מיטל 28.5: "כל קבוצת-משנה אותו pattern + רמת ביטחון דומה")
//        - אחרת → קבוצה אחת
//   5. סדר קבוצות: גודל desc → confidence desc → priority idx
//   6. cap ל-max_groups
//
// טסטים: scripts/test-group-suggester.js (48 assertions)
// ============================================================================

(function () {
  'use strict';

  const DEFAULT_OPTS = Object.freeze({
    min_group_size: 3,
    max_group_size: 5,
    max_groups:     5,
    min_confidence: 'med'
  });

  const CONF_RANK    = Object.freeze({ low: 0, med: 1, high: 2 });
  const CONF_BY_RANK = Object.freeze(['low', 'med', 'high']);

  // --------------------------------------------------------------------------
  // dependency access (mockable ב-Node לטסטים)
  // --------------------------------------------------------------------------
  function _getMatcher() {
    if (typeof window !== 'undefined' && window.AvneiInterventionMatcher) return window.AvneiInterventionMatcher;
    if (typeof global !== 'undefined' && global.AvneiInterventionMatcher) return global.AvneiInterventionMatcher;
    return null;
  }

  // --------------------------------------------------------------------------
  // helpers
  // --------------------------------------------------------------------------

  // aggregate confidence על קבוצה: all high → high · ≥66% med+ → med · אחרת low
  function _aggregateConfidence(confs) {
    if (!confs || confs.length === 0) return 'low';
    const counts = { high: 0, med: 0, low: 0 };
    for (let i = 0; i < confs.length; i++) {
      const c = confs[i] || 'low';
      counts[c] = (counts[c] || 0) + 1;
    }
    if (counts.high === confs.length) return 'high';
    if (counts.high + counts.med >= confs.length * 0.66) return 'med';
    return 'low';
  }

  // homogeneity-by-confidence split: בוקטים נפרדים פר high/med/low.
  // כל bucket עם count >= minSize יוצא כקבוצה. אם bucket > maxSize →
  // לחיתוך לפרוסות maxSize (כולן אותו confidence — לכן עדיין הומוגני).
  // buckets קטנים מ-minSize נופלים (אישרה מיטל — "לא ייפתחו קבוצה").
  function _splitHomogeneousByConfidence(students, minSize, maxSize) {
    const buckets = { high: [], med: [], low: [] };
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const c = (s && s.confidence in CONF_RANK) ? s.confidence : 'low';
      buckets[c].push(s);
    }
    const out = [];
    const order = ['high', 'med', 'low']; // קבוצות high קודמות (אפיון מיטל)
    for (let i = 0; i < order.length; i++) {
      const arr = buckets[order[i]];
      if (arr.length < minSize) continue;
      for (let j = 0; j < arr.length; j += maxSize) {
        const chunk = arr.slice(j, j + maxSize);
        if (chunk.length >= minSize) out.push(chunk);
      }
    }
    return out;
  }

  function _evidenceBySource(students) {
    const ev = { epa: 0, moy: 0, combined: 0 };
    for (let i = 0; i < students.length; i++) {
      const src = students[i] && students[i].source;
      if (src && ev[src] !== undefined) ev[src]++;
    }
    return ev;
  }

  // --------------------------------------------------------------------------
  // suggestGroups — public
  // --------------------------------------------------------------------------
  function suggestGroups(studentIds, options) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return [];

    const opts = {
      min_group_size: (options && options.min_group_size) || DEFAULT_OPTS.min_group_size,
      max_group_size: (options && options.max_group_size) || DEFAULT_OPTS.max_group_size,
      max_groups:     (options && options.max_groups)     || DEFAULT_OPTS.max_groups,
      min_confidence: (options && options.min_confidence) || DEFAULT_OPTS.min_confidence
    };
    const minSize = opts.min_group_size;
    const maxSize = opts.max_group_size;
    const maxGroups = opts.max_groups;
    const minConfRank = (CONF_RANK[opts.min_confidence] != null) ? CONF_RANK[opts.min_confidence] : 1;

    const Matcher = _getMatcher();
    if (!Matcher || typeof Matcher.matchForStudent !== 'function') return [];

    // 1+2. match per student + filter by min_confidence
    const matches = [];
    for (let i = 0; i < studentIds.length; i++) {
      const sid = studentIds[i];
      if (!sid) continue;
      let m = null;
      try { m = Matcher.matchForStudent(sid); }
      catch (e) { /* swallow — סוכן יחיד שזורק לא יפיל את כל הסוויט */ }
      if (!m || !m.pattern_id) continue;
      const cRank = CONF_RANK[m.confidence];
      if (typeof cRank !== 'number' || cRank < minConfRank) continue;
      matches.push({
        studentId: sid,
        pattern_id: m.pattern_id,
        confidence: m.confidence,
        source: m.source
      });
    }
    if (matches.length === 0) return [];

    // 3. group by pattern_id
    const byPattern = {};
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (!byPattern[m.pattern_id]) byPattern[m.pattern_id] = [];
      byPattern[m.pattern_id].push(m);
    }

    // 4. split / filter
    const allGroups = [];
    const patterns = Object.keys(byPattern);
    for (let i = 0; i < patterns.length; i++) {
      const pid = patterns[i];
      const studentsInPat = byPattern[pid];
      let subgroups;
      if (studentsInPat.length > maxSize) {
        subgroups = _splitHomogeneousByConfidence(studentsInPat, minSize, maxSize);
      } else if (studentsInPat.length >= minSize) {
        subgroups = [studentsInPat];
      } else {
        subgroups = [];
      }
      for (let j = 0; j < subgroups.length; j++) {
        const sub = subgroups[j];
        const confs = sub.map(function (s) { return s.confidence; });
        allGroups.push({
          pattern_id: pid,
          students: sub.map(function (s) {
            return {
              studentId: s.studentId,
              confidence: s.confidence,
              source: s.source
            };
          }),
          confidence: _aggregateConfidence(confs),
          evidence: {
            matched_count: sub.length,
            total_checked: studentIds.length,
            by_source: _evidenceBySource(sub)
          }
        });
      }
    }

    // 5. sort: size desc → confidence desc → priority idx asc
    const priority = (Matcher._getActivePriority && Matcher._getActivePriority()) || [];
    allGroups.sort(function (a, b) {
      if (b.students.length !== a.students.length) {
        return b.students.length - a.students.length;
      }
      const ca = CONF_RANK[a.confidence] || 0;
      const cb = CONF_RANK[b.confidence] || 0;
      if (cb !== ca) return cb - ca;
      const pa = priority.indexOf(a.pattern_id);
      const pb = priority.indexOf(b.pattern_id);
      const pai = (pa === -1) ? 999 : pa;
      const pbi = (pb === -1) ? 999 : pb;
      return pai - pbi;
    });

    // 6. cap
    return allGroups.slice(0, maxGroups);
  }

  // --------------------------------------------------------------------------
  // export
  // --------------------------------------------------------------------------
  const API = {
    suggestGroups: suggestGroups,
    DEFAULT_OPTS: DEFAULT_OPTS,
    // helpers + constants (לטסטים + UI)
    _splitHomogeneousByConfidence: _splitHomogeneousByConfidence,
    _aggregateConfidence: _aggregateConfidence,
    _evidenceBySource: _evidenceBySource,
    CONF_RANK: CONF_RANK,
    CONF_BY_RANK: CONF_BY_RANK
  };

  if (typeof window !== 'undefined') {
    window.AvneiGroupSuggester = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
