// ============================================================
// js/read-aloud-logger.js — מיפוי verdict של שטף-קריאה → אירוע-תרגול שמור
// ------------------------------------------------------------
// כלי "נוני מקשיבה" (stage-read-aloud.html) מקבל verdict מהשרת בענן, מציג —
// וכאן הופך אותו ל-event שמזין את הפרופיל האורייני (BKT) של התלמיד/ה.
// אי-הקריאה = 15 · סטרנד 4 (קריאה+הבנה) — נבחר ע"י מיטל 1.7.2026.
// brief: _handoff/2026-06-30-read-aloud-save-to-profile-agent-brief.md
//
// פרטיות: נשמרת רק **התוצאה** (decision + מילה), לא אודיו גולמי.
// ============================================================
(function () {
  'use strict';

  var READ_ALOUD_ISLAND = 15;   // סטרנד 4 (קריאה+הבנה) — ISLAND_TO_STRAND[15] = 4
  var READ_ALOUD_STRAND = 4;

  var CURRENT_STUDENT_KEY = 'avnei-yesod-current-student';
  var DEMO_PARAMS = ['presentation', 'guest', 'skip-picker'];

  function activeStudentId() {
    try { return localStorage.getItem(CURRENT_STUDENT_KEY); }
    catch (e) { return null; }
  }

  // זיהוי מצב-דמו עמיד: מעדיף את AvneiRuntimeMode, ונופל לזיהוי מה-URL אם שכבת
  // הענן עוד לא סיימה autoload (ה-verdict מגיע שניות אחרי טעינה, אז נדיר; בכל זאת בטוח).
  function isDemoMode() {
    var mode = window.AvneiRuntimeMode;
    if (mode) return mode.isDemo;
    try {
      var p = new URLSearchParams(location.search);
      return DEMO_PARAMS.some(function (k) { return p.has(k); });
    } catch (e) { return false; }
  }

  // מתי מותר לשמור:
  //   • מצב-דמו (guest/presentation) → כן; זהות 'local' לגיטימית, נשמר ל-localStorage בלבד.
  //   • מצב-ענן → רק אם נבחר/ה תלמיד/ה אמיתי/ת (לא ה-fallback 'local'), אחרת מפתח-זבל.
  function canSave() {
    if (isDemoMode()) return true;
    var sid = activeStudentId();
    return !!sid && sid !== 'local';
  }

  // miscues של קריאה (החלפה/השמטה/תנועה) לא ממפים נקי לערכי-failure של EPA (brief §1),
  // לכן **לא** מעבירים target_letter / characteristic_id / failure_type: epa.ingestEvent
  // לא ימצא unitKey וידלג. ה-BKT עדיין מתעדכן מ-primary_island_id. תוצאה = correct/incorrect
  // בלבד — כפי שאישרה מיטל. את זהות המילה שומרים ב-item_id (עובר דרך event-logger, לא מזין EPA).
  function toEvent(v) {
    // ACCEPT → correct · REVIEW → correct רך (נספר לטובת שליטה) · REJECT → incorrect.
    var isCorrect = v.decision !== 'REJECT';
    return {
      activity_type:     'read_aloud',
      activity_variant:  v.mode || null,   // 'word' | 'sentence'
      primary_island_id: READ_ALOUD_ISLAND,
      strand_id:         READ_ALOUD_STRAND,
      item_id:           v.target || null, // המילה/משפט — לתיעוד, אינו מזין EPA
      is_correct:        isCorrect,
    };
  }

  function saveVerdict(v) {
    if (!v || !v.decision) return null;
    if (!window.AvneiEventLogger) return null;
    if (!canSave()) return null;           // בלי זהות → לא יוצרים פרופיל-זבל
    try {
      return window.AvneiEventLogger.logActivityResult(toEvent(v));
    } catch (e) {
      if (window.console) console.warn('[read-aloud-logger] save failed:', e);
      return null;
    }
  }

  window.AvneiReadAloudSave = {
    saveVerdict: saveVerdict,
    toEvent: toEvent,      // חשוף לבדיקות
    canSave: canSave,
    ISLAND_ID: READ_ALOUD_ISLAND,
    STRAND_ID: READ_ALOUD_STRAND,
  };
})();
