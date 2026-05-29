// ============================================================
// shared/scaffolding.js — מתרגם supportLevel ל-config של תצוגה
// 1 = עצמאי · 2 = חלקית · 3 = התאמות · 4 = תמיכה מוגברת
//
// חשוב: supportLevel משנה את רמת התמיכה, לא את קושי הפריט.
// הפריטים הם pool אחיד. הקונפיג כאן קובע איך מציגים את אותו פריט.
// ============================================================

window.AvneiScaffolding = (function() {

  // ברירת מחדל לפי activity. activity יכול לדרוס שדות אם צריך.
  function configFor(supportLevel, activity) {
    const lvl = Math.max(1, Math.min(4, supportLevel || 1));

    // ברירת מחדל פר-supportLevel (חל על רוב הפעילויות)
    const base = {
      1: {
        optionsCount: 3,         // 3-4 — activity מחליט סופית
        autoHintDelayMs: null,   // אין רמז אוטומטי
        preFocus: false,
        preAudio: false,
        immediateHint: false,
        noniLead: false,
        hintButtonAvailable: false,
      },
      2: {
        optionsCount: 3,
        autoHintDelayMs: null,
        preFocus: false,
        preAudio: false,
        immediateHint: false,
        noniLead: false,
        hintButtonAvailable: true,  // כפתור רמז זמין
      },
      3: {
        optionsCount: 2,
        autoHintDelayMs: 5000,      // רמז אחרי 5 שניות
        preFocus: true,             // הדגשה עדינה של היעד / מאפיין
        preAudio: false,
        immediateHint: false,
        noniLead: false,
        hintButtonAvailable: true,
      },
      4: {
        optionsCount: 2,
        autoHintDelayMs: 0,         // רמז מיידי
        preFocus: true,
        preAudio: true,             // הקראה לפני אינטראקציה
        immediateHint: true,
        noniLead: true,             // נוני מוביל/ה אל התשובה
        hintButtonAvailable: true,
      },
    }[lvl];

    // התאמות פר-activity
    if (activity === 'soundMatch' && lvl === 1) {
      // sound-match L1 — מותר 3-4 options (קיים היום בפריטים)
      base.optionsCount = 4;
    }

    return { ...base, supportLevel: lvl };
  }

  // קצירת options מ-array לפי הקונפיג. שומר על הנכון, ומסיר distractors דמיוניים מהקצה.
  function trimOptions(options, targetCount) {
    if (!Array.isArray(options)) return [];
    if (options.length <= targetCount) return options;

    // לוודא שהנכון נשאר
    const correct = options.find(o => o.correct === true);
    const distractors = options.filter(o => !o.correct);

    // כמה distractors להשאיר
    const distractorsNeeded = targetCount - (correct ? 1 : 0);
    const trimmed = distractors.slice(0, distractorsNeeded);

    const result = correct ? [correct, ...trimmed] : trimmed;

    // ערבוב כדי שהנכון לא יהיה תמיד ראשון
    return shuffle(result);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { configFor, trimOptions, shuffle };
})();
