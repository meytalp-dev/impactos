// ============================================================
// shared/epa.js — Error Pattern Analysis (ניתוח דפוסי טעויות)
// משימה A.3 · 27.5.2026
// מקור: _handoff/2026-05-26-partners-review-v3.md §4ד + §6
//        _handoff/2026-05-25-architecture-tasks.md משימה 3 (פאזה A, P0/M)
//
// תפקיד: ספירה תיאורית של טעויות פר ילדה × אי × אות, על 3 צירים אורתוגונליים.
// לא מודל סטטיסטי (אין pKnown, אין Bayesian) — counts מצטברים בלבד.
// בניגוד ל-BKT שמתעדכן על כל אירוע (נכון/לא נכון), EPA מתעדכן רק על טעויות.
//
// מבנה state ב-localStorage (key: avnei-epa-v1):
//   state[studentId][islandId][letter][axis][value] = count
//   דוגמה: state['stu-abc']['3']['מ']['failure']['Sound'] = 5
//
// 3 הצירים (§4ד):
//   failure  — מה השתבש בידיעה          | Shape · Sound · Name · Direction
//   context  — באיזו סביבה הופיעה הטעות  | isolation · initial · medial · final · font
//   task     — מה ביקשו ממנה לעשות      | recognition · find · name · write
//
// API לחשיפה כ-window.AvneiEPA — נצרך ע"י B.8 (intervention matcher),
// B.9 (group suggester) ו-21A (מסך מורה בשפת ראמ"ה).
// ============================================================

window.AvneiEPA = (function() {

  const STORAGE_KEY = 'avnei-epa-v1';

  // ---- 3 הצירים וערכיהם החוקיים (partners-review-v3 §4ד) ----
  const AXES = ['failure', 'context', 'task'];

  const FAILURE_VALUES = ['Shape', 'Sound', 'Name', 'Direction'];
  const CONTEXT_VALUES = ['isolation', 'initial', 'medial', 'final', 'font'];
  const TASK_VALUES    = ['recognition', 'find', 'name', 'write'];

  // ---- מיפוי activity_type → ערך ברירת-מחדל פר ציר ----
  // אומת מול ה-PRIMARY_ISLAND ב-event-logger.js (27.5.2026).
  // ניתן לעקוף אירוע ספציפי ע"י evt.failure_type / evt.task_type.

  const ACTIVITY_TO_FAILURE = {
    // משחקוני "צליל בחר תמונה" — טעות = בלבול בין צלילים
    'soundMatch':    'Sound',
    'storm-quest':   'Sound',  // אות ת
    'rescue':        'Sound',  // אות ק
    'trail':         'Sound',  // אות ר
    'house':         'Sound',  // אות ב
    'shell':         'Sound',  // אות מ
    // משחקוני "צורת אות → שם" — טעות = חוסר ידיעת השם
    'letterShapeA':  'Name',
    'letterShapeB':  'Name',
    // משחקון "מצא אות במילה" — טעות = שיום במיקום
    'findLetter':    'Name',
    // משחקון tracing — טעות = כיוון/מראה
    'tracePath':     'Direction',
  };

  const ACTIVITY_TO_TASK = {
    'soundMatch':    'recognition',
    'storm-quest':   'recognition',
    'rescue':        'recognition',
    'trail':         'recognition',
    'house':         'recognition',
    'shell':         'recognition',
    'letterShapeA':  'recognition',
    'letterShapeB':  'recognition',
    'findLetter':    'find',
    'tracePath':     'write',
  };

  // ---- ספי "דפוס דומיננטי" (partners-review-v3 §6) ----
  // 40% = ברירת-מחדל פר ציר (Shape ≥40% · Context medial ≥40% · Task ≥40%).
  // 30% = override ל-Direction (נדיר יותר מטבעו, סף נמוך יותר לפי §6).
  const DEFAULT_DOMINANCE_THRESHOLD = 0.40;
  const VALUE_THRESHOLD_OVERRIDES = {
    failure: {
      Direction: 0.30, // §6 — "בנייה ביד ובחומר: Direction (מראה) ≥30%"
    },
  };

  // מינ' טעויות פר ציר כדי להחזיר דפוס — מונע "100% Shape" על מדגם של 1.
  // עקבי לחלוטין עם הסף ב-event-logger.detectAndRecordFlags (≥3 אירועים).
  const MIN_FAILURES_FOR_PATTERN = 3;

  // ============================================================
  // ניהול state
  // ============================================================
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) { return {}; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('EPA save failed:', e); }
  }

  function emptyLetterRecord() {
    return { failure: {}, context: {}, task: {} };
  }

  // ============================================================
  // גזירת ערכים פר ציר (override > activity mapping > null)
  // ============================================================
  function deriveFailure(evt) {
    if (evt.failure_type && FAILURE_VALUES.includes(evt.failure_type)) {
      return evt.failure_type;
    }
    return ACTIVITY_TO_FAILURE[evt.activity_type] || null;
  }

  function deriveContext(evt) {
    const pos = evt.letter_position;
    if (pos && CONTEXT_VALUES.includes(pos)) return pos;
    return 'isolation'; // ברירת-מחדל בטוחה — רוב המשחקונים הנוכחיים בבידוד
  }

  function deriveTask(evt) {
    if (evt.task_type && TASK_VALUES.includes(evt.task_type)) {
      return evt.task_type;
    }
    return ACTIVITY_TO_TASK[evt.activity_type] || null;
  }

  // ============================================================
  // ingestEvent — נקרא אוטומטית מ-event-logger.js אחרי AvneiBKT.ingestEvent.
  // פעיל רק כש-is_correct === false. הצלחה אינה רושמת ל-EPA.
  // ============================================================
  function ingestEvent(evt) {
    if (!evt || evt.is_correct !== false) return null;

    const studentId = evt.student_id || 'local';
    const islandId  = evt.primary_island_id;
    const letter    = evt.target_letter;

    if (!islandId || !letter) return null;

    const failure = deriveFailure(evt);
    const context = deriveContext(evt);
    const task    = deriveTask(evt);

    // אם אין אפילו ציר אחד שניתן לרשום — דלג
    if (!failure && !context && !task) return null;

    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    if (!state[studentId][islandId]) state[studentId][islandId] = {};
    if (!state[studentId][islandId][letter]) {
      state[studentId][islandId][letter] = emptyLetterRecord();
    }

    const rec = state[studentId][islandId][letter];
    if (failure) rec.failure[failure] = (rec.failure[failure] || 0) + 1;
    if (context) rec.context[context] = (rec.context[context] || 0) + 1;
    if (task)    rec.task[task]       = (rec.task[task]       || 0) + 1;

    saveState(state);
    return { failure, context, task };
  }

  // ============================================================
  // API — query
  // ============================================================
  function getEPA(studentId, islandId) {
    const state = loadState();
    const student = state[studentId] || {};
    if (islandId !== undefined && islandId !== null) {
      return student[islandId] || {};
    }
    return student;
  }

  // משטח state פר-אות לסיכום פר-אי: {failure:{}, context:{}, task:{}}
  function aggregateAcrossLetters(islandRec) {
    const agg = { failure: {}, context: {}, task: {} };
    Object.values(islandRec || {}).forEach(letterRec => {
      AXES.forEach(axis => {
        Object.entries(letterRec[axis] || {}).forEach(([val, count]) => {
          agg[axis][val] = (agg[axis][val] || 0) + count;
        });
      });
    });
    return agg;
  }

  function effectiveThresholdFor(axis, value, override) {
    if (typeof override === 'number') return override;
    const axisOverrides = VALUE_THRESHOLD_OVERRIDES[axis];
    if (axisOverrides && typeof axisOverrides[value] === 'number') {
      return axisOverrides[value];
    }
    return DEFAULT_DOMINANCE_THRESHOLD;
  }

  // מחזיר את הדפוס החזק ביותר באי, או null אם אין דפוס מעל הסף.
  // {axis, value, percent, count, total} — percent בטווח 0..1.
  function getDominantPattern(studentId, islandId, threshold) {
    const state = loadState();
    const islandRec = (state[studentId] || {})[islandId];
    if (!islandRec) return null;

    const agg = aggregateAcrossLetters(islandRec);

    let best = null;
    AXES.forEach(axis => {
      const counts = agg[axis];
      const total = Object.values(counts).reduce((s, c) => s + c, 0);
      if (total < MIN_FAILURES_FOR_PATTERN) return;

      Object.entries(counts).forEach(([value, count]) => {
        const fraction = count / total;
        const t = effectiveThresholdFor(axis, value, threshold);
        if (fraction >= t) {
          if (!best || fraction > best.percent) {
            best = { axis, value, percent: fraction, count, total };
          }
        }
      });
    });

    return best;
  }

  // ============================================================
  // Debug / utilities
  // ============================================================
  function dump() { return loadState(); }

  function reset(studentId) {
    if (!studentId) {
      saveState({});
      return;
    }
    const state = loadState();
    delete state[studentId];
    saveState(state);
  }

  // ============================================================
  // חשיפה
  // ============================================================
  return {
    ingestEvent,
    getEPA,
    getDominantPattern,
    dump,
    reset,

    // קבועים חשופים לבדיקות + ל-UI עתידי
    AXES,
    FAILURE_VALUES,
    CONTEXT_VALUES,
    TASK_VALUES,
    ACTIVITY_TO_FAILURE,
    ACTIVITY_TO_TASK,
    DEFAULT_DOMINANCE_THRESHOLD,
    VALUE_THRESHOLD_OVERRIDES,
    MIN_FAILURES_FOR_PATTERN,
  };
})();
