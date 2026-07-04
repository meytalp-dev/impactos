// ============================================================
// shared/home-mission.js — "משימת היום" של תרגול הבית
// spec: _handoff/2026-07-04-home-practice-spec.md (§4 + §4.1)
//
// עיקרון §4.1: בבית מחזקים — לא לומדים חדש. ההמלצה נבחרת רק מתוך
// אותיות שכבר יש עליהן ראיות (כלומר נלמדו/תורגלו), בסדר עדיפות:
//   1. חיזוק  — אות חלשה לפי BKT (pKnown<0.40, ≥5 ניסיונות; אותם ספים כמו C.12B)
//   2. שליפה מרווחת — אות שתורגלה אך לא נראתה ≥5 ימים (מפצה על היעדר מודל-שכחה)
//   3. המשך  — האות האחרונה שתורגלה (שטף/ביסוס על מה שטרי)
//   4. null  — אין שום היסטוריה ⇒ אין משימה; אות חדשה נפגשת רק עם המורה בכיתה.
//
// "השלמת משימה" אינה תלויה באי שנבחר — AvneiHomeContext.getMissionProgress()
// סופר 10 אירועי-בית מהיום, מכל משחקון. ההמלצה רק מכוונת לאן ללכת.
// ============================================================

window.AvneiHomeMission = (function () {
  'use strict';

  const STATE_KEY = 'underwater-app:v1';
  const CURRENT_STUDENT_KEY = 'avnei-yesod-current-student';

  const WEAKNESS_THRESHOLD = 0.40;  // כמו C.12B (pack-bkt-bridge)
  const MIN_ATTEMPTS_FOR_WEAK = 5;
  const REVIEW_GAP_DAYS = 5;        // ספק §12.5 — ערך פתיחה, לכיול אחרי ילדים אמיתיים
  const DAY_MS = 24 * 60 * 60 * 1000;

  // אות → אי-התרגול שלה (מקור: LETTERS ב-demo/teacher-curriculum.html, commit 2b094ef —
  // כל 22 האותיות מכוסות). ר = trail-resh (האי החי של ר').
  const LETTER_STAGE = {
    'א': 'stage-3-alef.html',   'ב': 'stage-3-bet.html',   'ג': 'stage-3-gimel.html',
    'ד': 'stage-3-dalet.html',  'ה': 'stage-3-hey.html',   'ו': 'stage-3-vav.html',
    'ז': 'stage-3-zayin.html',  'ח': 'stage-3-het.html',   'ט': 'stage-3-tet.html',
    'י': 'stage-3-yud.html',    'כ': 'stage-3-kaf.html',   'ל': 'stage-3-lamed.html',
    'מ': 'stage-3-mem.html',    'נ': 'stage-3-nun.html',   'ס': 'stage-3-samekh.html',
    'ע': 'stage-3-ayin.html',   'פ': 'stage-3-pey.html',   'צ': 'stage-3-tzadi.html',
    'ק': 'stage-3-kuf.html',    'ר': 'stage-3-trail-resh.html',
    'ש': 'stage-3-shin.html',   'ת': 'stage-3-tav.html',
  };

  function _events() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY)) || {};
      return Array.isArray(s.events) ? s.events : [];
    } catch (e) { return []; }
  }

  // טקסט נוני פר סוג המלצה — מנוקד (טקסט-ילד), לשון רבים
  function _rec(kind, letter) {
    const texts = {
      strengthen: 'בּוֹאוּ נִתְאַמֵּן עוֹד קְצָת עַל הָאוֹת',
      review:     'מִזְּמַן לֹא בִּקַּרְנוּ אֵצֶל הָאוֹת',
      continue:   'בּוֹאוּ נַמְשִׁיךְ לְהִתְאַמֵּן עַל הָאוֹת',
    };
    return {
      kind: kind,
      letter: letter,
      url: LETTER_STAGE[letter],
      noniText: texts[kind] + ' ' + letter + '!',
    };
  }

  function getRecommendation(studentId) {
    let sid = studentId;
    if (!sid) {
      try { sid = localStorage.getItem(CURRENT_STUDENT_KEY) || 'local'; }
      catch (e) { sid = 'local'; }
    }

    // (1) חיזוק — אותיות חלשות מה-BKT (ממוין מהחלשה ביותר)
    try {
      const bkt = window.AvneiBKT;
      if (bkt && typeof bkt.getWeakLetters === 'function') {
        const weak = bkt.getWeakLetters(sid, {
          threshold: WEAKNESS_THRESHOLD,
          minAttempts: MIN_ATTEMPTS_FOR_WEAK,
          max: 3,
        }) || [];
        for (let i = 0; i < weak.length; i++) {
          if (LETTER_STAGE[weak[i]]) return _rec('strengthen', weak[i]);
        }
      }
    } catch (e) { /* BKT לא זמין — ממשיכים לראיות מהאירועים */ }

    // (2)+(3) — מהאירועים: מתי כל אות נראתה לאחרונה
    const lastSeen = {};
    _events().forEach(function (e) {
      if (!e || !e.target_letter || !LETTER_STAGE[e.target_letter]) return;
      const ts = e.timestamp || 0;
      if (!lastSeen[e.target_letter] || ts > lastSeen[e.target_letter]) {
        lastSeen[e.target_letter] = ts;
      }
    });
    const letters = Object.keys(lastSeen);
    if (letters.length === 0) return null; // (4) אין היסטוריה — אין משימה

    const now = Date.now();
    const stale = letters
      .filter(function (l) { return now - lastSeen[l] > REVIEW_GAP_DAYS * DAY_MS; })
      .sort(function (a, b) { return lastSeen[a] - lastSeen[b]; }); // הישנה ביותר תחילה
    if (stale.length) return _rec('review', stale[0]);

    const latest = letters.sort(function (a, b) { return lastSeen[b] - lastSeen[a]; })[0];
    return _rec('continue', latest);
  }

  return {
    getRecommendation: getRecommendation,
    LETTER_STAGE: LETTER_STAGE,
    REVIEW_GAP_DAYS: REVIEW_GAP_DAYS,
    WEAKNESS_THRESHOLD: WEAKNESS_THRESHOLD,
  };
})();
