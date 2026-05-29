// ============================================================================
// shared/f21e-helpers.js — F.21E (Action Dashboard) — local helpers
// סוכן קוד F.21E · 29.5.2026
//
// מטרה:
//   helpers מקומיים ל-teacher-action.html (F.21E). מועברים לקובץ נפרד
//   כדי לאפשר בדיקה ב-Node (scripts/test-f21e-helpers.js). לא מוסיף
//   API ציבורי — נחשף תחת namespace פנימי AvneiF21EHelpers.
//
// API (window.AvneiF21EHelpers):
//   getTopWeakLetters(sid, n=3) → ['מ', 'ש', 'ר']
//     wrapper דק מעל AvneiBKT.getWeakestLetters. מחזיר תווים בלבד
//     (לא objects). אם אין דאטה — []. אם אין בעיות חולשה — [].
//
//   groupLetterOverlap(studentIds[]) → ['מ', 'ש']
//     intersection של top-5 weak letters בין חברי קבוצה. אם הקבוצה
//     ריקה / overlap < 3 → []. משמש לכרטיס קבוצה כדי להחליט אם להציג
//     "אותיות רלוונטיות".
//
//   getGreetingByHour(hour) → 'בוקר טוב' | 'צהריים טובים' | ...
//     ברכה לפי spec §5.2:
//       05:00-11:00 = בוקר טוב
//       11:00-16:00 = צהריים טובים
//       16:00-22:00 = אחר הצהריים
//       אחרת        = היי
//     מקבל hour כמספר (0-23) או אם null — Date().getHours().
//     ל-tests: מקבל hour מפורש כדי לא תלוי בשעת ההרצה.
//
//   buildHeroSentence(state) → string
//     state = { groups, no_group, moy_alerts, completed_week, greeting }
//     מחזיר משפט hero לפי 4 כללי §9.4 + priority MOY≥2.
//
//   isSameCalendarDay(ts1, ts2) → boolean
//   startOfWeekTimestamp(now) → number (ISO start of week, Sunday)
//   getActionLog() → array (טוען מ-localStorage avnei-action-log-v1)
//   appendActionLog(entry) → boolean
//   removeActionLog(entryKey) → boolean
//   countCompletedThisWeek(log, nowTs) → number
//   countCompletedToday(log, nowTs) → number
//   logEntryKey(type, id, taskId?) → string (canonical key)
//
// תלות (קריאה בלבד):
//   window.AvneiBKT — getWeakestLetters · ALL_HEBREW_LETTERS_22
//
// טסטים: scripts/test-f21e-helpers.js
// ============================================================================

(function () {
  'use strict';

  const ACTION_LOG_KEY = 'avnei-action-log-v1';

  // --------------------------------------------------------------------------
  // dependency access (mockable ב-Node לטסטים)
  // --------------------------------------------------------------------------
  function _getBKT() {
    if (typeof window !== 'undefined' && window.AvneiBKT) return window.AvneiBKT;
    if (typeof global !== 'undefined' && global.AvneiBKT) return global.AvneiBKT;
    return null;
  }

  function _getLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    return null;
  }

  // --------------------------------------------------------------------------
  // getTopWeakLetters — wrapper מעל AvneiBKT.getWeakestLetters שמחזיר תווים
  // --------------------------------------------------------------------------
  function getTopWeakLetters(sid, n) {
    const limit = (typeof n === 'number' && n > 0) ? n : 3;
    if (!sid) return [];
    const BKT = _getBKT();
    if (!BKT || typeof BKT.getWeakestLetters !== 'function') return [];
    let weakest;
    try { weakest = BKT.getWeakestLetters(sid, limit); }
    catch (e) { return []; }
    if (!Array.isArray(weakest) || weakest.length === 0) return [];
    return weakest
      .map(function (entry) { return entry && entry.letter ? entry.letter : null; })
      .filter(Boolean);
  }

  // --------------------------------------------------------------------------
  // groupLetterOverlap — intersection של top-5 לכל חבר.ת קבוצה
  // --------------------------------------------------------------------------
  function groupLetterOverlap(studentIds) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) return [];
    const lists = studentIds.map(function (sid) { return getTopWeakLetters(sid, 5); });
    if (lists.some(function (l) { return l.length === 0; })) return [];
    // intersect
    const first = lists[0];
    const others = lists.slice(1);
    const out = first.filter(function (letter) {
      return others.every(function (l) { return l.indexOf(letter) !== -1; });
    });
    return out.length >= 3 ? out : [];
  }

  // --------------------------------------------------------------------------
  // getGreetingByHour — לפי §5.2 table
  // --------------------------------------------------------------------------
  function getGreetingByHour(hour) {
    const h = (typeof hour === 'number')
      ? hour
      : (typeof Date !== 'undefined' ? new Date().getHours() : 8);
    if (h >= 5 && h < 11) return 'בוקר טוב';
    if (h >= 11 && h < 16) return 'צהריים טובים';
    if (h >= 16 && h < 22) return 'אחר הצהריים';
    return 'היי';
  }

  // --------------------------------------------------------------------------
  // buildHeroSentence — לפי 4 חוקי §9.4 + priority MOY≥2
  //   state = { groups, no_group, moy_alerts, completed_week, greeting }
  // --------------------------------------------------------------------------
  function buildHeroSentence(state) {
    const s = state || {};
    const greeting = s.greeting || 'היי';
    const groups = s.groups || 0;
    const noGroup = s.no_group || 0;
    const moyAlerts = s.moy_alerts || 0;

    // Priority: MOY >= 2 מקדים את שאר המצבים
    if (moyAlerts >= 2) {
      return greeting + ', יש כמה התראות אמצע שנה — כדאי לסדר אותן לפני השיעור.';
    }

    if (groups >= 1 && moyAlerts <= 1) {
      const part1 = greeting + ', היום כדאי להתחיל מ־' + groups +
                    (groups === 1 ? ' קבוצה קצרה' : ' קבוצות קצרות');
      if (noGroup >= 1) {
        return part1 + ' ולתת מענה ל־' + noGroup +
               (noGroup === 1 ? ' תלמיד.ה ללא קבוצה.' : ' תלמידים ללא קבוצה.');
      }
      return part1 + '.';
    }

    if (groups === 0 && noGroup >= 1) {
      return greeting + ', אין קבוצות דחופות. כדאי לתת מענה אישי ל־' + noGroup +
             (noGroup === 1 ? ' תלמיד.ה.' : ' תלמידים.');
    }

    if (groups === 0 && noGroup === 0 && moyAlerts === 0) {
      return greeting + ', הכל יציב היום. אפשר לחזק תרגול לפי האותיות.';
    }

    // fallback (לדוגמה: groups=0, noGroup=0, moyAlerts=1)
    return greeting + ', התחילי את היום בעיון בכרטיסים שלמטה.';
  }

  // --------------------------------------------------------------------------
  // Execution Log — UI flag בלבד · לא משפיע על B.9
  // schema: { type: 'group'|'individual'|'moy', key: string, completedAt: ISO }
  // --------------------------------------------------------------------------
  function isSameCalendarDay(ts1, ts2) {
    if (!ts1 || !ts2) return false;
    const a = new Date(ts1);
    const b = new Date(ts2);
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth() &&
           a.getDate()     === b.getDate();
  }

  // start of week = Sunday 00:00 (תרבות ישראלית)
  function startOfWeekTimestamp(nowTs) {
    const now = new Date(typeof nowTs === 'number' ? nowTs : Date.now());
    const day = now.getDay(); // 0=Sun..6=Sat
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
    return d.getTime();
  }

  function getActionLog() {
    const ls = _getLocalStorage();
    if (!ls) return [];
    try {
      const raw = ls.getItem(ACTION_LOG_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function _saveActionLog(arr) {
    const ls = _getLocalStorage();
    if (!ls) return false;
    try { ls.setItem(ACTION_LOG_KEY, JSON.stringify(arr)); return true; }
    catch (e) { return false; }
  }

  function logEntryKey(type, id, taskId) {
    if (!type || !id) return '';
    if (taskId) return type + ':' + id + ':' + taskId;
    return type + ':' + id;
  }

  function appendActionLog(entry) {
    if (!entry || !entry.type || !entry.key) return false;
    const log = getActionLog();
    // dedupe by key+type+sameDay: לא להוסיף שוב באותו יום (idempotent)
    const completedAt = entry.completedAt || (new Date()).toISOString();
    const sameKeyToday = log.some(function (e) {
      return e.type === entry.type && e.key === entry.key &&
             isSameCalendarDay(Date.parse(e.completedAt), Date.parse(completedAt));
    });
    if (sameKeyToday) return false;
    log.push({ type: entry.type, key: entry.key, completedAt: completedAt });
    return _saveActionLog(log);
  }

  function removeActionLog(type, key) {
    if (!type || !key) return false;
    const log = getActionLog();
    const filtered = log.filter(function (e) {
      return !(e.type === type && e.key === key);
    });
    if (filtered.length === log.length) return false;
    return _saveActionLog(filtered);
  }

  function countCompletedToday(log, nowTs) {
    const t = (typeof nowTs === 'number') ? nowTs : Date.now();
    if (!Array.isArray(log)) return 0;
    return log.filter(function (e) {
      return isSameCalendarDay(Date.parse(e.completedAt), t);
    }).length;
  }

  function countCompletedThisWeek(log, nowTs) {
    const t = (typeof nowTs === 'number') ? nowTs : Date.now();
    const weekStart = startOfWeekTimestamp(t);
    if (!Array.isArray(log)) return 0;
    return log.filter(function (e) {
      const ts = Date.parse(e.completedAt);
      return ts >= weekStart && ts <= t;
    }).length;
  }

  // statusForEntry — מחזיר 'today' | 'week' | 'none'
  function statusForEntry(type, key, log, nowTs) {
    const t = (typeof nowTs === 'number') ? nowTs : Date.now();
    const weekStart = startOfWeekTimestamp(t);
    const matches = (log || []).filter(function (e) {
      return e.type === type && e.key === key;
    });
    if (matches.length === 0) return 'none';
    const todayMatch = matches.some(function (e) {
      return isSameCalendarDay(Date.parse(e.completedAt), t);
    });
    if (todayMatch) return 'today';
    const weekMatch = matches.some(function (e) {
      const ts = Date.parse(e.completedAt);
      return ts >= weekStart && ts <= t;
    });
    if (weekMatch) return 'week';
    return 'none';
  }

  // --------------------------------------------------------------------------
  // pattern translations — שפה פשוטה, לא טכנית (spec §1.4)
  // --------------------------------------------------------------------------
  const PATTERN_TO_SIMPLE_HE = Object.freeze({
    phonological:     'תרגול צלילים',
    letter_knowledge: 'זיהוי אותיות מתבלבלות',
    decoding:         'פענוח בהקשר',
    fluency:          'שטף קריאה',
    letter_cluster:   'חיזוק אותיות חלשות'
  });

  function patternToSimpleHe(patternId) {
    return PATTERN_TO_SIMPLE_HE[patternId] || patternId || '';
  }

  // "למה עכשיו?" — תרגום evidence.by_source לשפה פשוטה
  function reasonByEvidence(evidence) {
    if (!evidence || !evidence.by_source) return 'יש סימן עקבי שכדאי לפעול עכשיו.';
    const bs = evidence.by_source;
    const epa = bs.epa || 0;
    const moy = bs.moy || 0;
    const combined = bs.combined || 0;
    if (combined > 0 && epa + moy === 0) {
      return 'יש סימן הן מהפעילות היומית והן מאמצע שנה.';
    }
    if (combined > 0) {
      return 'יש סימן מצטבר — מתרגול היומיומי ומאמצע שנה.';
    }
    if (epa > 0 && moy === 0) {
      return 'יש סימן חוזר בפעילות היומית של התלמידים.';
    }
    if (moy > 0 && epa === 0) {
      return 'התראה הגיעה מהבדיקה של אמצע שנה.';
    }
    return 'יש סימן עקבי שכדאי לפעול עכשיו.';
  }

  // moyStatus → simple Hebrew label
  function moyAlertSimpleHe(moyStatus) {
    if (!moyStatus) return '';
    if (moyStatus.next_review_due && Date.now() < moyStatus.next_review_due) {
      return 'מחכה לבדיקה חוזרת';
    }
    if (moyStatus.latest_status === 'fail') {
      return 'נכשל.ה במשימה האחרונה';
    }
    if (moyStatus.suggested_intervention) {
      return 'מומלץ לפתוח תרגול ממוקד';
    }
    if (moyStatus.latest_status === 'near') {
      return 'קרוב.ה למעבר';
    }
    return 'דורש.ת תשומת לב';
  }

  // --------------------------------------------------------------------------
  // export
  // --------------------------------------------------------------------------
  const API = {
    // Constants
    ACTION_LOG_KEY: ACTION_LOG_KEY,
    PATTERN_TO_SIMPLE_HE: PATTERN_TO_SIMPLE_HE,

    // Letters
    getTopWeakLetters: getTopWeakLetters,
    groupLetterOverlap: groupLetterOverlap,

    // Hero
    getGreetingByHour: getGreetingByHour,
    buildHeroSentence: buildHeroSentence,

    // Execution log
    isSameCalendarDay: isSameCalendarDay,
    startOfWeekTimestamp: startOfWeekTimestamp,
    getActionLog: getActionLog,
    appendActionLog: appendActionLog,
    removeActionLog: removeActionLog,
    countCompletedToday: countCompletedToday,
    countCompletedThisWeek: countCompletedThisWeek,
    statusForEntry: statusForEntry,
    logEntryKey: logEntryKey,

    // Translations
    patternToSimpleHe: patternToSimpleHe,
    reasonByEvidence: reasonByEvidence,
    moyAlertSimpleHe: moyAlertSimpleHe
  };

  if (typeof window !== 'undefined') {
    window.AvneiF21EHelpers = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
