// ============================================================
// shared/assessments.js — ניהול הערכות רשמיות (BOY · MOY · EOY)
// MOY-Lite (סוכן 10 · 28.5.2026) · מסמך-אם: 2026-05-28-MOY-diagnostic-spec.md
// MOY × B.7 link (סוכן 14 · 28.5.2026) · מסמך-אם: moy-intervention-map.json
// ============================================================
// localStorage נפרד מ-events רגילים (state.assessments → underwater-app:assessments).
// פנדיגוגית — אסור לערבב פריטי הערכה רשמית עם תרגול (זיהום BKT).
// ============================================================

(function(globalRoot) {
  'use strict';

  const KEY = 'underwater-app:assessments';
  const FIVE_WEEKS_MS = 5 * 7 * 24 * 60 * 60 * 1000;
  const MAP_RELATIVE_PATH = 'moy-intervention-map.json';

  // ספי ראמ"ה (madrich-mivdak-kriah-grade1.txt) — תוצר רשמי, לא לשנות
  const TASK_THRESHOLDS = Object.freeze({
    task_1: { threshold: 18, max: 22 },   // BOY · קריאת אותיות
    task_2: { threshold: 5,  max: 10 },   // BOY · ידיעת צלילים
    task_3: { threshold: 7,  max: 10 },   // MOY · הבנת טקסט מושמע
    task_4: { threshold: 16, max: 22 },   // MOY · מודעות לשונית
  });

  // ============================================================
  // moy-intervention-map.json — טעינה עם cache
  // ============================================================
  // Hybrid mapping (סוכן 14): C+γ+attempt-2 (אישר מיטל 28.5.2026).
  // Map כתוב ב-`moy-intervention-map.json` ליד הקובץ הזה. נטען sync
  // (XHR בדפדפן · fs ב-Node) ונשמר ב-cache. אם הטעינה נכשלה — נופל
  // ל-DEFAULT_MAP הפנימי (נאמן ל-decisions, חוסך תלות בקובץ).

  let _mapCache = null;

  const DEFAULT_MAP = Object.freeze({
    epa_bkt_pattern_priority: [
      'letter_knowledge', 'letter_cluster', 'decoding', 'fluency', 'phonological'
    ],
    task_to_pattern: {
      task_3: { default_pattern: 'phonological', match_quality: 'partial',
        notice_he: 'MOY משימה 3 (הבנת טקסט מושמע) — נכשלה פעמיים. phonological awareness הוא הקרוב ביותר ב-B.7, אבל יכול להיות גם אוצר מילים — בדקי דפוסי EPA אחרים.' },
      task_4: { default_pattern: 'phonological', match_quality: 'partial',
        notice_he: 'MOY משימה 4 (מודעות לשונית) — נכשלה פעמיים. phonological הוא הבסיס, אבל מודעות לשונית רחבה יותר. בדקי גם מבנה משפט + יחסי מילים.' }
    }
  });

  function loadInterventionMap() {
    if (_mapCache) return _mapCache;

    // דפדפן — sync XHR (פיילוט; לא ל-production)
    if (typeof XMLHttpRequest !== 'undefined') {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', MAP_RELATIVE_PATH, false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          _mapCache = JSON.parse(xhr.responseText);
          return _mapCache;
        }
      } catch (e) { /* fallback */ }
    }

    // Node — fs sync (לבדיקות)
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const file = path.resolve(__dirname || '.', MAP_RELATIVE_PATH);
        if (fs.existsSync(file)) {
          _mapCache = JSON.parse(fs.readFileSync(file, 'utf8'));
          return _mapCache;
        }
      } catch (e) { /* fall through */ }
    }

    _mapCache = DEFAULT_MAP;
    return _mapCache;
  }

  // ============================================================
  // localStorage I/O
  // ============================================================

  function freshState() {
    return { boy: {}, moy: {}, eoy: {} };
  }

  function loadAssessments() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return freshState();
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      return { ...freshState(), ...parsed };
    } catch (e) {
      return freshState();
    }
  }

  function saveAssessments(state) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('AvneiAssessments save failed:', e);
    }
  }

  // ============================================================
  // Status compute helpers
  // ============================================================

  // statusFor(score, threshold, max)
  // pass = score >= threshold
  // near = score >= threshold-2 (אבל לא pass)
  // fail = פחות
  function statusFor(score, threshold) {
    if (typeof score !== 'number' || typeof threshold !== 'number') return 'unknown';
    if (score >= threshold) return 'pass';
    if (score >= threshold - 2) return 'near';
    return 'fail';
  }

  // מקבלת מבנה {task_3: {score}, task_4: {score}} ומחזירה {task_3: {score,threshold,status}, ...}
  // overall = pass אם כל המשימות pass · fail אם אחת fail · אחרת near
  function enrichResults(rawResults) {
    const out = {};
    let anyFail = false, anyNear = false, allPass = true;
    Object.keys(rawResults || {}).forEach(tKey => {
      const r = rawResults[tKey];
      if (!r || typeof r.score !== 'number') return;
      const def = TASK_THRESHOLDS[tKey];
      if (!def) return;
      const status = statusFor(r.score, def.threshold);
      out[tKey] = {
        score: r.score,
        threshold: def.threshold,
        max: def.max,
        status: status,
      };
      if (status === 'fail') { anyFail = true; allPass = false; }
      else if (status === 'near') { anyNear = true; allPass = false; }
    });
    let overall = 'pass';
    if (anyFail) overall = 'fail';
    else if (anyNear) overall = 'near';
    else if (!allPass) overall = 'unknown';
    return { tasks: out, overall: overall };
  }

  // ============================================================
  // MOY × B.7 — Smart hybrid suggestion (סוכן 14)
  // ============================================================
  // Decisions (28.5.2026): C (hybrid) + γ (queue) + after attempt 2 fail.
  // ה-AvneiInterventions נטען רק כשהוא קיים — היעדרו לא שובר את MOY.

  function _getInterventions() {
    return (typeof window !== 'undefined' && window.AvneiInterventions) ||
           (typeof global !== 'undefined' && global.AvneiInterventions) || null;
  }

  // מנסה להוציא pattern מ-EPA/sub-BKT. מחזיר { patternId, details, confidence } או null.
  function _tryEpaBktSuggestion(studentId, priorityList) {
    const interventions = _getInterventions();
    if (!interventions || typeof interventions.detectForStudent !== 'function') return null;
    let triggers;
    try {
      triggers = interventions.detectForStudent(studentId, {});
    } catch (e) { return null; }
    if (!triggers || triggers.length === 0) return null;

    const priority = (priorityList && priorityList.length)
      ? priorityList
      : DEFAULT_MAP.epa_bkt_pattern_priority;

    let best = null;
    let bestIdx = Infinity;
    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];
      const idx = priority.indexOf(t.patternId);
      const score = (idx === -1) ? 999 : idx;
      if (score < bestIdx) { bestIdx = score; best = t; }
    }
    return best;
  }

  // מחזירה את ה-tasks שנכשלו ב-attempt אחרון. (כלי עזר.)
  function _failedTasksInAttempt(attempt) {
    if (!attempt) return [];
    const out = [];
    ['task_3', 'task_4'].forEach(function (k) {
      const t = attempt[k];
      if (t && t.status === 'fail') out.push(k);
    });
    return out;
  }

  // הליבה — מקבלת rec (state.moy[sid]) ומחזירה suggestion או null.
  // ה-rec לא חייב להיות מ-localStorage; כך נחסך double-load ב-recordMOYAttempt.
  function _computeSuggestionFromRec(rec, studentId, taskId) {
    if (!rec || !rec.attempts || rec.attempts.length < 2) return null;
    if (rec.latest_status !== 'fail') return null;

    const lastAttempt = rec.attempts[rec.attempts.length - 1];
    const failedTasks = _failedTasksInAttempt(lastAttempt);
    if (failedTasks.length === 0) return null;

    // אם נתבקש taskId מסוים — חייב להיות בין הנכשלים
    if (taskId && failedTasks.indexOf(taskId) === -1) return null;

    const map = loadInterventionMap() || DEFAULT_MAP;
    const priority = (map.epa_bkt_pattern_priority && map.epa_bkt_pattern_priority.length)
      ? map.epa_bkt_pattern_priority
      : DEFAULT_MAP.epa_bkt_pattern_priority;

    // 1) ניסיון להחזיר pattern מ-EPA/sub-BKT (מדויק)
    const epaPick = _tryEpaBktSuggestion(studentId, priority);
    if (epaPick) {
      return {
        patternId: epaPick.patternId,
        source: 'epa_bkt_pattern',
        match_quality: 'good',
        based_on_failed_tasks: failedTasks.slice(),
        details: epaPick.details || {},
        confidence: epaPick.confidence || 'med',
        generated_at: Date.now()
      };
    }

    // 2) Fallback: phonological עם תווית "התאמה חלקית" + notice מתוך ה-map
    const firstFailed = failedTasks[0];
    const taskDef = (map.task_to_pattern && map.task_to_pattern[firstFailed]) ||
                    DEFAULT_MAP.task_to_pattern[firstFailed];
    let notice;
    if (failedTasks.length > 1) {
      notice = 'MOY משימות 3 ו-4 נכשלו פעמיים. phonological awareness הוא הקרוב ביותר ב-B.7 — בדקי גם דפוסים נוספים ב-EPA.';
    } else {
      notice = (taskDef && taskDef.notice_he) || '';
    }

    return {
      patternId: (taskDef && taskDef.default_pattern) || 'phonological',
      source: 'moy_default_fallback',
      match_quality: (taskDef && taskDef.match_quality) || 'partial',
      based_on_failed_tasks: failedTasks.slice(),
      notice: notice,
      confidence: 'low',
      generated_at: Date.now()
    };
  }

  // Public API — בודק את state ומחשב את ההצעה לפי הכללים שלעיל.
  function getSuggestedInterventionForAssessment(studentId, taskId) {
    if (!studentId) return null;
    const state = loadAssessments();
    const rec = state.moy[studentId];
    return _computeSuggestionFromRec(rec, studentId, taskId);
  }

  // ============================================================
  // MOY API — לפי spec §3 / §6
  // ============================================================

  // recordMOYAttempt(studentId, results, opts?)
  // results = { task_3: { score: 7 }, task_4: { score: 14 } }
  // opts = { date?: number }   // ברירת מחדל Date.now()
  // מחזירה את ה-attempt המעודכן: { date, task_3, task_4, overall_status }
  function recordMOYAttempt(studentId, results, opts) {
    if (!studentId) throw new Error('recordMOYAttempt: studentId required');
    const state = loadAssessments();
    const now = (opts && typeof opts.date === 'number') ? opts.date : Date.now();
    const enriched = enrichResults(results);

    const attempt = {
      date: now,
      task_3: enriched.tasks.task_3 || null,
      task_4: enriched.tasks.task_4 || null,
      overall_status: enriched.overall,
    };

    if (!state.moy[studentId]) {
      state.moy[studentId] = {
        date: now,
        attempts: [],
        latest_status: enriched.overall,
        next_review_due: null,
      };
    }

    const rec = state.moy[studentId];
    rec.attempts.push(attempt);
    rec.latest_status = enriched.overall;
    rec.date = now;

    // חוקי repeat (spec §6 + ראמ"ה שורה 247)
    // fail → next_review_due = +5 שבועות
    // pass/near → ניקוי next_review_due (אם היה תלוי קודם)
    if (enriched.overall === 'fail') {
      rec.next_review_due = now + FIVE_WEEKS_MS;
    } else {
      rec.next_review_due = null;
    }

    // MOY × B.7 link (סוכן 14): חישוב הצעה רק אחרי attempts.length>=2 AND fail.
    // pass/near → ניקוי suggestion קיים (אם היה).
    if (rec.attempts.length >= 2 && enriched.overall === 'fail') {
      const sug = _computeSuggestionFromRec(rec, studentId);
      rec.suggested_intervention = sug || null;
    } else {
      rec.suggested_intervention = null;
    }

    saveAssessments(state);
    return attempt;
  }

  // getMOYStatus(studentId) → { measured: bool, latest_status, attempts[], next_review_due, last_attempt }
  function getMOYStatus(studentId) {
    if (!studentId) return null;
    const state = loadAssessments();
    const rec = state.moy[studentId];
    if (!rec || !rec.attempts || rec.attempts.length === 0) {
      return {
        measured: false,
        latest_status: 'not-measured',
        attempts: [],
        next_review_due: null,
        last_attempt: null,
        suggested_intervention: null,
      };
    }
    return {
      measured: true,
      latest_status: rec.latest_status || 'unknown',
      attempts: rec.attempts.slice(),
      next_review_due: rec.next_review_due || null,
      last_attempt: rec.attempts[rec.attempts.length - 1],
      suggested_intervention: rec.suggested_intervention || null,
    };
  }

  // getDueAssessments(now?) → [{studentId, type, due_date}]
  // מחזיר רק תלמידות שעבר זמן ה-next_review_due (now >= due_date)
  function getDueAssessments(now) {
    const t = (typeof now === 'number') ? now : Date.now();
    const state = loadAssessments();
    const out = [];
    Object.keys(state.moy || {}).forEach(sid => {
      const rec = state.moy[sid];
      if (rec && rec.next_review_due && t >= rec.next_review_due) {
        out.push({ studentId: sid, type: 'moy', due_date: rec.next_review_due });
      }
    });
    return out;
  }

  // resetForStudent(studentId, type?) — Debug / Reset
  function resetForStudent(studentId, type) {
    if (!studentId) return;
    const state = loadAssessments();
    if (type) {
      if (state[type] && state[type][studentId]) {
        delete state[type][studentId];
      }
    } else {
      ['boy', 'moy', 'eoy'].forEach(t => {
        if (state[t] && state[t][studentId]) delete state[t][studentId];
      });
    }
    saveAssessments(state);
  }

  // ============================================================
  // (אופציונלי לעתיד) — BOY/EOY API דומה. לא בסקופ של סוכן 10.
  // המבנה state.boy / state.eoy קיים ב-schema, ימתין למשימה נפרדת.
  // ============================================================

  const api = {
    // localStorage key (חשוף לבדיקות)
    STORAGE_KEY: KEY,
    TASK_THRESHOLDS: TASK_THRESHOLDS,
    FIVE_WEEKS_MS: FIVE_WEEKS_MS,

    // MOY
    recordMOYAttempt: recordMOYAttempt,
    getMOYStatus: getMOYStatus,
    getDueAssessments: getDueAssessments,

    // MOY × B.7 link (סוכן 14)
    getSuggestedInterventionForAssessment: getSuggestedInterventionForAssessment,
    loadInterventionMap: loadInterventionMap,

    // Helpers
    statusFor: statusFor,
    enrichResults: enrichResults,

    // Debug
    _load: loadAssessments,
    _save: saveAssessments,
    resetForStudent: resetForStudent,
    _computeSuggestionFromRec: _computeSuggestionFromRec,
    _clearMapCache: function () { _mapCache = null; },
  };

  // Browser
  if (globalRoot) {
    globalRoot.AvneiAssessments = api;
  }
  // Node (test environment) — אם יש module exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
