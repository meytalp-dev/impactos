// helpers.js — shared utilities for Avnei Yesod E2E tests (Agent 28)
//
// localStorage / sessionStorage key reference (verified against source · 29.5.2026):
//   avnei-yesod-students            → student records (array; engine/onboarding-profile.html)
//   avnei-yesod-current-student     → currently active student id (event-logger)
//   underwater-app:assessments      → AvneiAssessments state {boy, moy:{[sid]:{...attempts}}, eoy}
//   avnei-bkt-v1 / avnei-bkt-strand-v1 → BKT state (per_island, per_letter, per_strand)
//   avnei-event-log-v1              → event log array (event-logger.js)
//   teacher_authed (sessionStorage) → PIN gate bypass for teacher-rama
//
// PIN code for teacher pages: 4521
//
// IMPORTANT: addInitScript runs on EVERY page navigation. That's correct for things like
// PIN bypass (sessionStorage needs to be set each navigation), but WRONG for one-shot
// seeds (we don't want to wipe state when the test moves between screens). For one-shot
// seeding, use prepareSession() which does setup once via a lightweight nav + evaluate.

const PIN_CODE = '4521';
const TEACHER_AUTH_KEY = 'teacher_authed';
const STUDENTS_KEY = 'avnei-yesod-students';
const CURRENT_STUDENT_KEY = 'avnei-yesod-current-student';
const ASSESSMENTS_KEY = 'underwater-app:assessments';

// MOY task thresholds (from assessments.js TASK_THRESHOLDS — ראמ"ה official):
//   task_3: threshold 7 / max 10
//   task_4: threshold 16 / max 22 — fail = score < 14
const TASK_4_THRESHOLD = 16;
const TASK_4_MAX = 22;
const TASK_4_FAIL_SCORE = 8; // well under threshold-2 = 14

// Bypass the teacher PIN gate. Uses addInitScript so it re-applies on each navigation
// (sessionStorage is per-tab; this is correct for tests that navigate multiple times).
async function bypassPin(page) {
  await page.addInitScript((authKey) => {
    try { sessionStorage.setItem(authKey, '1'); } catch (e) {}
  }, TEACHER_AUTH_KEY);
}

// One-shot setup: navigate to the origin's root, then write all desired state into
// localStorage and sessionStorage. Pass {students, moyDoubleFail, weakBkt, currentStudent}.
// After this returns, the test can goto() the real URL and the state will already be present.
async function prepareSession(page, {
  students = [],
  currentStudent = null,
  moyDoubleFail = null,        // { studentIds:[], patternId? }
  weakBkt = null,              // { studentId, letters: ['מ','ש',...] }
} = {}) {
  // Navigate to a lightweight page on the same origin so localStorage is accessible.
  await page.goto('/');
  await page.evaluate((payload) => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    // Students
    if (payload.students.length) {
      try {
        const list = payload.students.map((s) => ({
          id: s.id, name: s.name,
          entry_date: 0,
          profile: s.profile || null,
          entry_profile: s.entry_profile || null,
          notes_override_text: '',
          notes_override_profile: null,
        }));
        localStorage.setItem(payload.STUDENTS_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    if (payload.currentStudent) {
      try { localStorage.setItem(payload.CURRENT_STUDENT_KEY, payload.currentStudent); } catch (e) {}
    }

    // MOY double-fail → suggested_intervention=phonological (2 attempts triggers the rule).
    if (payload.moyDoubleFail) {
      try {
        const moy = {};
        payload.moyDoubleFail.studentIds.forEach((sid) => {
          const attempt = {
            date: 0,
            task_3: null,
            task_4: {
              score: payload.TASK_4_FAIL_SCORE,
              threshold: payload.TASK_4_THRESHOLD,
              max: payload.TASK_4_MAX,
              status: 'fail',
            },
            overall_status: 'fail',
          };
          moy[sid] = {
            date: 0,
            attempts: [attempt, { ...attempt, date: 1 }],
            latest_status: 'fail',
            next_review_due: null,
            suggested_intervention: {
              patternId: payload.moyDoubleFail.patternId,
              source: 'moy',
              confidence: 'med',
              match_quality: 'partial',
              from_task: 'task_4',
            },
          };
        });
        localStorage.setItem(payload.ASSESSMENTS_KEY,
          JSON.stringify({ boy: {}, moy, eoy: {} }));
      } catch (e) {}
    }

    // Weak BKT (per_letter on strand 1).
    if (payload.weakBkt && payload.weakBkt.letters && payload.weakBkt.letters.length) {
      try {
        const per_letter = {};
        payload.weakBkt.letters.forEach((l) => {
          per_letter[l] = { pKnown: 0.10, attempts: 5, correct: 0, lastSeenAt: 0 };
        });
        const strand = { [payload.weakBkt.studentId]: { 1: { per_letter, attempts: 5 } } };
        localStorage.setItem('avnei-bkt-strand-v1', JSON.stringify(strand));
      } catch (e) {}
    }
  }, {
    students,
    currentStudent,
    moyDoubleFail: moyDoubleFail ? { ...moyDoubleFail, patternId: moyDoubleFail.patternId || 'phonological' } : null,
    weakBkt,
    STUDENTS_KEY, CURRENT_STUDENT_KEY, ASSESSMENTS_KEY,
    TASK_4_FAIL_SCORE, TASK_4_THRESHOLD, TASK_4_MAX,
  });
}

// Read the full students array out of localStorage.
async function readStudents(page) {
  return page.evaluate((key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }, STUDENTS_KEY);
}

// Read a single value from localStorage (raw string or parsed JSON if isJson=true).
async function readLocal(page, key, isJson = true) {
  return page.evaluate(({ k, j }) => {
    const v = localStorage.getItem(k);
    if (!j) return v;
    try { return v ? JSON.parse(v) : null; } catch (e) { return v; }
  }, { k: key, j: isJson });
}

module.exports = {
  PIN_CODE,
  TEACHER_AUTH_KEY,
  STUDENTS_KEY,
  CURRENT_STUDENT_KEY,
  ASSESSMENTS_KEY,
  TASK_4_THRESHOLD,
  TASK_4_MAX,
  TASK_4_FAIL_SCORE,
  bypassPin,
  prepareSession,
  readStudents,
  readLocal,
};
