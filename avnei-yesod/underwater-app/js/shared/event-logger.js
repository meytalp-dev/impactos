// ============================================================
// shared/event-logger.js — תיעוד אירועי תרגול ל-localStorage
// כותב events לפי הסכמה של ספק אי 3 (23.5.2026)
// כל event יכול להזין את מודל ה-BKT (primary + secondary islands)
// ============================================================

window.AvneiEventLogger = (function() {

  // session_id נוצר פעם אחת בטעינת הדף
  const SESSION_ID = 'sess-' + Date.now();
  const STUDENT_ID = 'local';  // ב-pilot להחליף ל-real ID
  const ISLAND_ID_CURRENT = 3;

  // מיפוי activity → primary_island_id (לפי תוצאות שאלה פדגוגית, 23.5.2026)
  // מבוסס על 22-islands-validated + pedagogy-verification (מקורות פנימיים מאומתים)
  const PRIMARY_ISLAND = {
    'letterShapeA': 3,
    'letterShapeB': 3,
    'soundMatch':   3,
    'findLetter':   3,
    'tracePath':    19,
  };

  const SECONDARY_ISLANDS = {
    'letterShapeA': [],
    'letterShapeB': [],
    'soundMatch':   [2],   // first-sound awareness
    'findLetter':   [5],   // exposure to written word
    'tracePath':    [3],   // letter recognition reinforcement
  };

  // result = {
  //   activity_type, activity_variant, item_id, target_letter,
  //   supportLevel, is_correct, attempts, response_time_ms,
  //   hint_used, auto_hint_triggered, noni_guidance_used
  // }
  function logActivityResult(result) {
    const activity = result.activity_type;
    const evt = {
      student_id:           STUDENT_ID,
      session_id:           SESSION_ID,
      island_id_current:    ISLAND_ID_CURRENT,
      activity_type:        activity,
      activity_variant:     result.activity_variant || null,
      item_id:              result.item_id || null,
      target_letter:        result.target_letter || null,
      supportLevel:         result.supportLevel || 1,
      primary_island_id:    PRIMARY_ISLAND[activity] || null,
      secondary_island_ids: SECONDARY_ISLANDS[activity] || [],
      is_correct:           result.is_correct === true,
      attempts:             typeof result.attempts === 'number' ? result.attempts : 0,
      response_time_ms:     typeof result.response_time_ms === 'number' ? result.response_time_ms : null,
      hint_used:            result.hint_used === true,
      auto_hint_triggered:  result.auto_hint_triggered === true,
      noni_guidance_used:   result.noni_guidance_used === true,
      timestamp:            Date.now(),
    };
    appendEvent(evt);  // מ-state.js
    return evt;
  }

  // ===== Teacher flags engine =====
  // נקרא בסוף סשן/סוף אות. סורק events אחרונים ומוסיף flags לפי דפוסים.
  function detectAndRecordFlags(targetLetter) {
    const events = getEvents();
    const recent = events.filter(e =>
      e.target_letter === targetLetter && e.island_id_current === ISLAND_ID_CURRENT
    );

    // דפוס 1: זמן תגובה חציוני > 5 שניות למרות דיוק גבוה
    const correctEvents = recent.filter(e => e.is_correct && e.response_time_ms);
    if (correctEvents.length >= 3) {
      const times = correctEvents.map(e => e.response_time_ms).sort((a,b) => a-b);
      const median = times[Math.floor(times.length / 2)];
      if (median > 5000) {
        appendTeacherFlag({
          type: 'slow_response',
          target_letter: targetLetter,
          evidence_count: correctEvents.length,
          note_template: `זמן תגובה חציוני ${Math.round(median/1000)}שנ' למרות דיוק טוב — שווה לבדוק שטף`,
        });
      }
    }

    // דפוס 2: שימוש חוזר ברמז
    const hintEvents = recent.filter(e => e.hint_used);
    if (hintEvents.length >= 3) {
      appendTeacherFlag({
        type: 'repeated_hint',
        target_letter: targetLetter,
        evidence_count: hintEvents.length,
        note_template: `שימוש ברמז ב-${hintEvents.length} פריטים`,
      });
    }

    // דפוס 3: פער בין letter-shape A ל-letter-shape B
    const shapeA = recent.filter(e => e.activity_type === 'letterShapeA');
    const shapeB = recent.filter(e => e.activity_type === 'letterShapeB');
    if (shapeA.length > 0 && shapeB.length > 0) {
      const aCorrect = shapeA.filter(e => e.is_correct).length / shapeA.length;
      const bCorrect = shapeB.filter(e => e.is_correct).length / shapeB.length;
      if (aCorrect - bCorrect >= 0.5) {
        appendTeacherFlag({
          type: 'shape_vs_sound_gap',
          target_letter: targetLetter,
          evidence_count: shapeA.length + shapeB.length,
          note_template: 'מזהה צורה כשהשם נשמע, אבל מתקשה להתאים שם לצורה',
        });
      }
    }

    // דפוס 4: קושי ב-find-letter למרות הצלחה ב-letter-shape
    const findEvents = recent.filter(e => e.activity_type === 'findLetter');
    if (shapeA.length > 0 && findEvents.length > 0) {
      const aCorrect = shapeA.filter(e => e.is_correct).length / shapeA.length;
      const fCorrect = findEvents.filter(e => e.is_correct).length / findEvents.length;
      if (aCorrect >= 0.8 && fCorrect <= 0.4) {
        appendTeacherFlag({
          type: 'find_letter_struggle',
          target_letter: targetLetter,
          evidence_count: findEvents.length,
          note_template: 'מזהה אות בודדת אבל מתקשה לאתר אותה בתוך מילה',
        });
      }
    }

    // דפוס 5: שתי נפילות רצופות ב-supportLevel 4
    const l4Events = recent.filter(e => e.supportLevel === 4);
    if (l4Events.length >= 2) {
      const lastTwo = l4Events.slice(-2);
      if (lastTwo.every(e => !e.is_correct || e.attempts >= 2)) {
        appendTeacherFlag({
          type: 'level4_drops',
          target_letter: targetLetter,
          evidence_count: 2,
          note_template: 'קושי גם בתמיכה מוגברת — תשומת לב מורה',
        });
      }
    }
  }

  return {
    logActivityResult,
    detectAndRecordFlags,
    SESSION_ID,
    PRIMARY_ISLAND,
    SECONDARY_ISLANDS,
  };
})();
