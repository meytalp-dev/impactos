// ============================================================
// js/read-aloud-logger.js — מיפוי verdict של שטף-קריאה → אירוע-תרגול שמור
// ------------------------------------------------------------
// כלי "נוני מקשיבה" (stage-read-aloud.html) מקבל verdict מהשרת בענן, מציג —
// וכאן הופך אותו ל-event שמור. אי-הקריאה = 15 · סטרנד 4 (קריאה+הבנה).
// brief: _handoff/2026-06-30-read-aloud-save-to-profile-agent-brief.md
//
// 🔴 ניתוק דיוק מ-BKT (3.7.2026): בדיקת הזרקת-טעויות (error_injection_test.py)
// הראתה שכלי ההקראה מפספס ~70% מטעויות-אמת מקצה-לקצה — עיוורון-תנועה מבני
// (המנוע + ההשוואה מסירים ניקוד → 0/4 טעויות-תנועה) + שכבת-השוואה סלחנית
// (REVIEW נספר כ"נכון"; זוגות-בלבול/אם-קריאה בחינם). לכן verdict-הדיוק **אינו
// אמין** כאות-שליטה, ו**אסור שיזין את הפרופיל האורייני (BKT) שהוא מנוע ההצבה** —
// אחרת כל טעות שדולפת מנפחת pKnown לכיוון "שולט/ת" שגוי.
//   ⇒ toEvent משמיט primary_island_id / strand_id → resolveIslandId מחזיר null →
//     event-logger מדלג על AvneiBKT.ingestEvent (בדיוק כמו אירועי island=null
//     היסטוריים). האירוע עדיין נשמר ל-event log + מסונכרן לענן + מזין את
//     שורת-המורָה (#teacherSummary, מסננת לפי activity_type='read_aloud', לא אי).
//   ⇒ דיוק = דגל-למורה בלבד (המורה מכריעה). השטף אמין ואינו מושפע מכך.
//   ⇒ החזרת הזנת-BKT בעתיד (אחרי corpus קול-ילד אמיתי + ניקוד פונמי אקוסטי):
//     להחזיר primary_island_id: READ_ALOUD_ISLAND + strand_id: READ_ALOUD_STRAND.
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

  // האירוע נשמר ל-event log בלבד — לא מזין BKT ולא EPA:
  //   • BKT — משמיטים primary_island_id/strand_id → island=null → מדולג (ראו header 3.7.2026).
  //   • EPA — לא מעבירים target_letter/characteristic_id/failure_type → epa.ingestEvent מדלג.
  // is_correct נשמר לשורת-המורָה (#teacherSummary סופר correct/total) — משטח מודע-מורה,
  // לא הצבה אוטומטית. read_aloud_decision שומר את ה-verdict הגולמי ל-corpus/ניתוח עתידי.
  function toEvent(v) {
    return {
      activity_type:       'read_aloud',
      activity_variant:    v.mode || null,   // 'word' | 'sentence'
      item_id:             v.target || null, // המילה/משפט — לתיעוד
      read_aloud_decision: v.decision || null, // ACCEPT|REVIEW|REJECT — גולמי, ל-corpus עתידי
      // ACCEPT/REVIEW→correct · REJECT→incorrect. לשורת-המורָה בלבד; אינו מזין BKT (אין island).
      is_correct:          v.decision !== 'REJECT',
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
