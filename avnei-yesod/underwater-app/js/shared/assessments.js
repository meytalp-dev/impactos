// ============================================================
// shared/assessments.js — ניהול הערכות רשמיות (BOY · MOY · EOY)
// MOY-Lite (סוכן 10 · 28.5.2026) · מסמך-אם: 2026-05-28-MOY-diagnostic-spec.md
// ============================================================
// localStorage נפרד מ-events רגילים (state.assessments → underwater-app:assessments).
// פנדיגוגית — אסור לערבב פריטי הערכה רשמית עם תרגול (זיהום BKT).
// ============================================================

(function(globalRoot) {
  'use strict';

  const KEY = 'underwater-app:assessments';
  const FIVE_WEEKS_MS = 5 * 7 * 24 * 60 * 60 * 1000;

  // ספי ראמ"ה (madrich-mivdak-kriah-grade1.txt) — תוצר רשמי, לא לשנות
  const TASK_THRESHOLDS = Object.freeze({
    task_1: { threshold: 18, max: 22 },   // BOY · קריאת אותיות
    task_2: { threshold: 5,  max: 10 },   // BOY · ידיעת צלילים
    task_3: { threshold: 7,  max: 10 },   // MOY · הבנת טקסט מושמע
    task_4: { threshold: 16, max: 22 },   // MOY · מודעות לשונית
  });

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
      };
    }
    return {
      measured: true,
      latest_status: rec.latest_status || 'unknown',
      attempts: rec.attempts.slice(),
      next_review_due: rec.next_review_due || null,
      last_attempt: rec.attempts[rec.attempts.length - 1],
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

    // Helpers
    statusFor: statusFor,
    enrichResults: enrichResults,

    // Debug
    _load: loadAssessments,
    _save: saveAssessments,
    resetForStudent: resetForStudent,
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
