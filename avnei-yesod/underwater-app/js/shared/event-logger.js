// ============================================================
// shared/event-logger.js — תיעוד אירועי תרגול ל-localStorage
// כותב events לפי הסכמה של ספק אי 3 (23.5.2026)
// כל event יכול להזין את מודל ה-BKT (primary + secondary islands)
// ============================================================

// Auto-load cloud stack on first page load (1.6.2026).
// This avoids editing all 33 stage-*.html files individually.
// In demo mode (?presentation=1 / ?guest=1), cloud-sync becomes a no-op stub.
(function autoloadCloudStack() {
  if (typeof document === 'undefined') return;
  if (window.AvneiCloudSync) return;  // already loaded

  function loadScript(src, type) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      if (type) s.type = type;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Load order: config → runtime-mode → cloud-client (module) → cloud-sync
  loadScript('js/shared/cloud-config.js')
    .then(() => loadScript('js/shared/runtime-mode.js'))
    .then(() => loadScript('js/shared/cloud-client.js', 'module'))
    .then(() => {
      // Wait briefly for cloud-client (module) to initialize window.AvneiCloudClient
      const start = Date.now();
      return new Promise(resolve => {
        const tick = () => {
          if (window.AvneiCloudClient || Date.now() - start > 3000) resolve();
          else setTimeout(tick, 50);
        };
        tick();
      });
    })
    .then(() => loadScript('js/shared/cloud-sync.js'))
    .catch(err => console.warn('[event-logger] Cloud stack autoload failed:', err));
})();

// Auto-load home-context (4.7.2026 — תרגול בית, spec: _handoff/2026-07-04-home-practice-spec.md).
// אותו pattern כמו ה-cloud stack: טעינה מכאן חוסכת עריכה של 33 דפי stage.
// home-context אחראי על מונה-הדקות והמכסה; event-logger רק מתייג context/calendar_date.
(function autoloadHomeContext() {
  if (typeof document === 'undefined') return;
  if (window.AvneiHomeContext) return;
  const s = document.createElement('script');
  s.src = 'js/shared/home-context.js';
  document.head.appendChild(s);
})();

window.AvneiEventLogger = (function() {

  // session_id נוצר פעם אחת בטעינת הדף
  const SESSION_ID = 'sess-' + Date.now();
  const pendingCloudEvents = [];

  function drainPendingCloudEvents() {
    if (!window.AvneiCloudSync || typeof window.AvneiCloudSync.queueEvent !== 'function') return 0;
    let sent = 0;
    while (pendingCloudEvents.length > 0) {
      const item = pendingCloudEvents.shift();
      try {
        window.AvneiCloudSync.queueEvent(item.activity, item.evt, new Date(item.evt.timestamp).toISOString());
        sent++;
      } catch (e) {
        pendingCloudEvents.unshift(item);
        console.warn('Cloud sync queue failed:', e);
        break;
      }
    }
    return sent;
  }

  function scheduleCloudDrain() {
    if (typeof setTimeout !== 'function') return;
    setTimeout(() => {
      if (drainPendingCloudEvents() === 0 && pendingCloudEvents.length > 0) {
        scheduleCloudDrain();
      }
    }, 50);
  }

  function queueCloudEvent(activity, evt) {
    pendingCloudEvents.push({ activity, evt });
    if (drainPendingCloudEvents() === 0) scheduleCloudDrain();
  }

  // 4.7.2026 · תרגול-בית — יום קלנדרי מקומי (YYYY-MM-DD). session_id מתחלף בכל
  // רענון-דף, בעוד ש"סשן" אמיתי במערכת הוא יום (ראו mastery-check.js) — השדה הזה
  // נותן לניתוחים עוגן יציב בלי לנחש מ-timestamp.
  function localDateKey() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // fallback לזיהוי context כשמודול home-context עוד לא נטען (טעינה אסינכרונית):
  // אותו חלון-שעות (א'–ו' 07:45–14:30 = school). מקור-האמת המלא (כולל ?context=
  // override) הוא AvneiHomeContext.getContext() — הכפילות הקטנה כאן מבטיחה שהשדה
  // לעולם אינו null גם באירוע שנרשם מיד עם טעינת הדף.
  function fallbackContext() {
    const d = new Date();
    if (d.getDay() === 6) return 'home';
    const mins = d.getHours() * 60 + d.getMinutes();
    return (mins >= 7 * 60 + 45 && mins < 14 * 60 + 30) ? 'school' : 'home';
  }

  // אי הזיהוי (letter-shape / sound-match / find-letter). משמש רק לטווח דגלי המורה
  // (detectAndRecordFlags) — הדפוסים שם הם ספציפיים לאי 3 (צורת אות מול צליל).
  // אינו מקבע יותר את island_id_current של כל אירוע — ראה resolveIslandId.
  const LETTER_ISLAND_ID = 3;

  // student_id דינמי — נקרא מ-localStorage שנכתב על-ידי student-picker.html.
  // אם אין — נופל ל-'local' (תאימות לאחור + מצב דמו).
  // עודכן 26.5.2026 בעקבות A0.1 — בלי זה אי אפשר לחבר נתונים פר תלמידה.
  const CURRENT_STUDENT_KEY = 'avnei-yesod-current-student';
  function getStudentId() {
    try {
      return localStorage.getItem(CURRENT_STUDENT_KEY) || 'local';
    } catch (e) {
      return 'local';
    }
  }

  // מיפוי activity → primary_island_id (לפי תוצאות שאלה פדגוגית, 23.5.2026)
  // מבוסס על 22-islands-validated + pedagogy-verification (מקורות פנימיים מאומתים)
  const PRIMARY_ISLAND = {
    'letterShapeA': 3,
    'letterShapeB': 3,
    'soundMatch':   3,
    'findLetter':   3,
    'tracePath':    19,
    // משחקונים פר-אות (מ-23.5.2026)
    'storm-quest':  3,   // אות ת
    'rescue':       3,   // אות ק
    'trail':        3,   // אות ר
    'house':        3,   // אות ב
    'shell':        3,   // אות מ
    // אי 1 — מודעות פונולוגית בסיסית (מ-2.6.2026)
    'bubbleRise':   1,
    'choirGame':    1,
    'countBubbles': 1,
    'mergeBubble':  1,
    // אי 2 — מודעות לצליל פותח / השוואת צלילים (מ-2.6.2026)
    'fish-schools':  2,
    'twin-seaweeds': 2,
    'whispers':      2,
    // אי 3 — מנגנונים גנריים נוספים (sort/memory) המשמשים רק את stage-3-* (29.6.2026)
    'sort-by-letter': 3,
    'memory-pair':    3,
  };

  // הערה (29.6.2026): מנגנוני אי 4/5/14 (cv-*, word-*, oral) מעבירים
  // primary_island_id ו-secondary_island_ids מפורשות ב-result, ולכן אינם
  // חייבים להופיע במפה הזו. resolveIslandId מכבד תחילה את הערך המפורש,
  // וזו הסיבה שכל איים עתידיים יכולים פשוט להעביר island_id בלי לגעת בקובץ הזה.

  const SECONDARY_ISLANDS = {
    'letterShapeA': [],
    'letterShapeB': [],
    'soundMatch':   [2],   // first-sound awareness
    'findLetter':   [5],   // exposure to written word
    'tracePath':    [3],   // letter recognition reinforcement
    'storm-quest':  [2],   // hunt-for-sound
    'rescue':       [2],   // first-sound awareness in distractor pods
    'trail':        [2],   // identify target letter among distractors
    'house':        [],
    'shell':        [],
    // אי 1 — left as [] until pedagogical review confirms secondary contributions
    'bubbleRise':   [],
    'choirGame':    [],
    'countBubbles': [],
    'mergeBubble':  [],
    // אי 2 — same, pending review
    'fish-schools':  [],
    'twin-seaweeds': [],
    'whispers':      [],
  };

  // ============================================================
  // ISLAND_TO_STRAND — מיפוי 22 איים ל-5 סטרנדים (E.17, 28.5.2026)
  // ============================================================
  // מקור: architecture-mvp.md §1 (טבלת 5 הסטרנדים → איים שייכים).
  // strand_id: 1=פונולוגיה+דקודינג, 2=מורפולוגיה, 3=שפה דבורה+אוצר,
  //            4=קריאה+הבנת הנקרא, 5=כתיבה.
  // נצרך ל-checkRamaTaskStatus (F.21A) ול-data-export (E.18).
  const ISLAND_TO_STRAND = Object.freeze({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1,   // סטרנד 1
    9: 2, 10: 2, 11: 2,                                // סטרנד 2
    12: 3, 13: 3, 14: 3,                               // סטרנד 3
    15: 4, 16: 4, 17: 4, 18: 4,                        // סטרנד 4
    19: 5, 20: 5, 21: 5, 22: 5,                        // סטרנד 5
  });

  // resolveIslandId — מקור-האמת לזיהוי האי של אירוע, בסדר עדיפות:
  //   1) result.primary_island_id / result.island_id  (מפורש מהמשחקון — future-proof)
  //   2) PRIMARY_ISLAND[activity]                      (מפה ל-legacy: אי 1/2/3)
  //   3) null                                          (לא ידוע — BKT יתעלם)
  // עד 29.6.2026 השדה היה מקובע ל-3, כך שאירועי אי 4/5/14 (cv-*, word-*, oral)
  // קיבלו island=null/strand=null ונשרו מ-BKT. עכשיו הם נשמרים נכון.
  function resolveIslandId(result) {
    if (typeof result.primary_island_id === 'number') return result.primary_island_id;
    if (typeof result.island_id === 'number') return result.island_id;
    const mapped = PRIMARY_ISLAND[result.activity_type];
    return (typeof mapped === 'number') ? mapped : null;
  }

  // result = {
  //   activity_type, activity_variant, item_id, target_letter,
  //   supportLevel, is_correct, attempts, response_time_ms,
  //   hint_used, auto_hint_triggered, noni_guidance_used,
  //   // אופציונלי (מומלץ למשחקונים מחוץ לאי 3 / איים עתידיים):
  //   primary_island_id | island_id, secondary_island_ids, strand_id
  // }
  function logActivityResult(result) {
    const activity = result.activity_type;
    const islandId = resolveIslandId(result);
    const evt = {
      student_id:           getStudentId(),
      session_id:           SESSION_ID,
      // island_id_current — האי בפועל של האירוע (לא מקובע 3 יותר).
      island_id_current:    islandId,
      activity_type:        activity,
      activity_variant:     result.activity_variant || null,
      item_id:              result.item_id || null,
      // 3.7.2026 · read-aloud — verdict גולמי (ACCEPT|REVIEW|REJECT) לתיעוד/corpus.
      // דיוק ההקראה אינו אמין ואינו מזין BKT (ראו read-aloud-logger.js); נשמר רק
      // כראיה גולמית לניתוח עתידי. אירועים אחרים בלי השדה → null (ללא שינוי התנהגות).
      read_aloud_decision:  result.read_aloud_decision || null,
      target_letter:        result.target_letter || null,
      // 3.7.2026 · אי 4 per_cv — קבוצת-הצליל (a/e/i/o/shwa) לזיהוי צירוף ה-CV.
      // ingestIsland4Event ב-bkt.js דורש אותה (key="<letter>_<group>"); בלעדיה
      // ה-BKT פר-צירוף מדלג. תוספתי: אירועים בלי השדה → null (ללא שינוי התנהגות).
      target_phoneme_group: result.target_phoneme_group || null,
      // 30.6.2026 · minigame-fit G4 — מפתח-יחידה לא-מבוסס-אות ל-EPA.
      // לשאלות מורפולוגיה/הבנה (בלי אות-יעד) epa.js ממפתח תחת characteristic_id.
      // תוספתי: אירועים ישנים בלי השדה → null (אפס שינוי התנהגות).
      characteristic_id:    result.characteristic_id || null,
      // 29.6.2026 · minigame-fit G1 — העברת טעות ה-EPA הספציפית של המסיח שנלחץ.
      // epa.js קורא את שלושת השדות (deriveFailure/deriveContext/deriveTask); קודם הם
      // נשמטו מ-evt → EPA תמיד נפל ל-mapping הגס לפי activity_type. בלי זה אף משחקון
      // אינו יכול לדווח EPA פר-מסיח. תוספתי: אירועים ישנים בלי השדות → null (ללא שינוי התנהגות).
      failure_type:         result.failure_type || null,
      task_type:            result.task_type || null,
      letter_position:      result.letter_position || null,
      supportLevel:         result.supportLevel || 1,
      primary_island_id:    islandId,
      secondary_island_ids: Array.isArray(result.secondary_island_ids)
                              ? result.secondary_island_ids
                              : (SECONDARY_ISLANDS[activity] || []),
      // E.17 (28.5.2026) — 3 שדות לתיוג ראמ"ה/סטרנד:
      //   strand_id — מיפוי אוטומטי מהאי שהתקבל (אפשר override מפורש דרך result.strand_id)
      //   rama_task_alignment / peima_target — מועברים מהפריט דרך result
      // אירועים ישנים בלי השדות → null (backwards-compat).
      strand_id:            (typeof result.strand_id === 'number')
                              ? result.strand_id
                              : (islandId != null ? (ISLAND_TO_STRAND[islandId] || null) : null),
      rama_task_alignment:  (typeof result.rama_task_alignment === 'number') ? result.rama_task_alignment : null,
      peima_target:         (typeof result.peima_target === 'number') ? result.peima_target : null,
      is_correct:           result.is_correct === true,
      trial_type:           result.trial_type || 'independent_first_attempt',
      attempts:             typeof result.attempts === 'number' ? result.attempts : 0,
      response_time_ms:     typeof result.response_time_ms === 'number' ? result.response_time_ms : null,
      hint_used:            result.hint_used === true,
      auto_hint_triggered:  result.auto_hint_triggered === true,
      noni_guidance_used:   result.noni_guidance_used === true,
      // 4.7.2026 · תרגול-בית (spec §8.1) — תיוג הקשר + יום קלנדרי. ה-BKT סופר
      // ראיות-בית כרגיל (אין weighting); ההפרדה חיה ברמת דוח/דגל "שווה מבט" בלבד.
      // אירועים ישנים בלי השדות → undefined (ללא שינוי התנהגות).
      context:              (window.AvneiHomeContext
                              ? window.AvneiHomeContext.getContext()
                              : fallbackContext()),
      calendar_date:        localDateKey(),
      timestamp:            Date.now(),
    };
    appendEvent(evt);  // מ-state.js

    // עדכון BKT אוטומטי — מעדכן p(שולטת) פר-תלמיד.ה × פר-אי
    if (window.AvneiBKT) {
      try {
        AvneiBKT.ingestEvent(evt);
      } catch (e) {
        console.warn('BKT update failed:', e);
      }
    }

    // עדכון EPA אוטומטי (משימה A.3 · 27.5.2026) — סופר טעויות על 3 צירים.
    // פעיל רק על is_correct=false. שכבה נפרדת מ-BKT, לא תלויה בו.
    if (window.AvneiEPA) {
      try {
        AvneiEPA.ingestEvent(evt);
      } catch (e) {
        console.warn('EPA update failed:', e);
      }
    }

    // Cloud sync (1.6.2026) — additive · cloud mode only · no-op in demo.
    // AvneiCloudSync queues the event to localStorage, then pushes to Supabase
    // in background (5s interval + on reconnect). Failures don't block the UI.
    queueCloudEvent(activity, evt);

    return evt;
  }

  // ===== Teacher flags engine =====
  // נקרא בסוף סשן/סוף אות. סורק events אחרונים ומוסיף flags לפי דפוסים.
  function detectAndRecordFlags(targetLetter) {
    const events = getEvents();
    // הדגלים האלה הם דפוסי אי-הזיהוי (צורת אות, מציאת אות בתוך מילה) → אי 3 בלבד.
    const recent = events.filter(e =>
      e.target_letter === targetLetter && e.island_id_current === LETTER_ISLAND_ID
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
    ISLAND_TO_STRAND,
    _flushPendingCloudEventsForTest: drainPendingCloudEvents,
  };
})();
