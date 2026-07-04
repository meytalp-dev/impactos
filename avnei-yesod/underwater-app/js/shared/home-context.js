// ============================================================
// shared/home-context.js — תרגול בית ("נוני בבית")
// spec: _handoff/2026-07-04-home-practice-spec.md (§5 מכסה · §7 זיהוי context · §8 דאטה)
//
// אחריות המודול:
//   1. זיהוי context (home|school) — חלון-שעות בית-ספרי + override ?context=
//   2. מונה דקות-פעילות יומי (home בלבד) — tick כשהדף גלוי ויש אינטראקציה
//   3. אכיפת מכסה יומית: מסך "זֶהוּ לְהַיּוֹם" (נוני סוגר, בלי "עוד קצת")
//   4. חישובי משימת-היום וסיכום-היום (מוזנים מ-state.events המתויגים)
//
// נטען אוטומטית ע"י event-logger.js (autoload — כל דפי הפעילות) ומפורשות
// ב-map.html וב-parent-today.html. dependency-free: קורא/כותב ישירות
// ל-localStorage (אותו STATE_KEY של state.js; כל הגישות סינכרוניות באותו thread).
// ============================================================

window.AvneiHomeContext = (function () {
  'use strict';

  const STATE_KEY = 'underwater-app:v1';
  const STUDENTS_KEY = 'avnei-yesod-students';
  const CURRENT_STUDENT_KEY = 'avnei-yesod-current-student';
  // override נשמר ל-sessionStorage כדי לשרוד ניווט בין דפים באותו סשן
  const OVERRIDE_KEY = 'avnei-home-context-override';

  // חלון בית-ספרי (ספק §7): א'–ו' 07:45–14:30 = כיתה · כל השאר (כולל שבת) = בית.
  // קונפיגורציה פר-כיתה — כשיהיה ענן (טבלת classes). כרגע קבוע.
  const SCHOOL_DAY_START_MIN = 7 * 60 + 45;
  const SCHOOL_DAY_END_MIN = 14 * 60 + 30;

  // מכסה (ספק §5): ברירת-מחדל 15 ד', המורה מכווננת פר ילד.ה (10–20; clamp רחב 5–30).
  const DEFAULT_CAP_MINUTES = 15;
  const CAP_MIN_MINUTES = 5;
  const CAP_MAX_MINUTES = 30;

  // משימת היום (ספק §4): 10 פריטים בהקשר-בית = המשימה הושלמה.
  const MISSION_TARGET_ITEMS = 10;

  const TICK_SECONDS = 15;              // רזולוציית המונה
  const IDLE_LIMIT_MS = 60 * 1000;      // בלי אינטראקציה דקה — המונה מושהה
  const CAP_OVERLAY_DELAY_MS = 1600;    // גרייס: לא קוטעים פידבק של פריט באמצע

  // ---------- זמן ----------

  function todayKey(d) {
    const t = d || new Date();
    return t.getFullYear() + '-' +
      String(t.getMonth() + 1).padStart(2, '0') + '-' +
      String(t.getDate()).padStart(2, '0');
  }

  // פונקציה טהורה — ניתנת לבדיקה עם תאריך מוזרק
  function computeContextForDate(d) {
    if (d.getDay() === 6) return 'home'; // שבת — תמיד בית
    const mins = d.getHours() * 60 + d.getMinutes();
    return (mins >= SCHOOL_DAY_START_MIN && mins < SCHOOL_DAY_END_MIN) ? 'school' : 'home';
  }

  function getContext() {
    try {
      const p = new URLSearchParams(location.search).get('context');
      if (p === 'home' || p === 'school') {
        sessionStorage.setItem(OVERRIDE_KEY, p);
        return p;
      }
      const saved = sessionStorage.getItem(OVERRIDE_KEY);
      if (saved === 'home' || saved === 'school') return saved;
    } catch (e) { /* sessionStorage חסום — ניפול לחישוב זמן */ }
    return computeContextForDate(new Date());
  }

  // ---------- state (קריאה/כתיבה ישירה — אותו מפתח של state.js) ----------

  function _loadState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function _saveState(s) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // dailyUsage מתאפס אוטומטית כשהתאריך מתחלף (ספק §8.2)
  function _usageOf(s) {
    const t = todayKey();
    if (!s.dailyUsage || s.dailyUsage.date !== t) {
      s.dailyUsage = { date: t, home_active_seconds: 0 };
    }
    return s.dailyUsage;
  }

  function getUsedSeconds() {
    return _usageOf(_loadState()).home_active_seconds || 0;
  }

  function addHomeSeconds(sec) {
    const s = _loadState();
    const u = _usageOf(s);
    u.home_active_seconds = (u.home_active_seconds || 0) + sec;
    s.dailyUsage = u;
    _saveState(s);
    return u.home_active_seconds;
  }

  // ---------- מכסה ----------

  function getCapMinutes() {
    try {
      const sid = localStorage.getItem(CURRENT_STUDENT_KEY);
      const students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
      const rec = Array.isArray(students) ? students.find(x => x && x.id === sid) : null;
      const v = rec ? Number(rec.home_cap_minutes) : NaN;
      if (v >= CAP_MIN_MINUTES && v <= CAP_MAX_MINUTES) return v;
    } catch (e) {}
    return DEFAULT_CAP_MINUTES;
  }

  function isCapReached() {
    return getContext() === 'home' && getUsedSeconds() >= getCapMinutes() * 60;
  }

  // ---------- אירועי היום בהקשר-בית ----------

  function _todayHomeEvents() {
    const s = _loadState();
    const t = todayKey();
    return (s.events || []).filter(e => e && e.context === 'home' && (
      e.calendar_date === t ||
      (!e.calendar_date && e.timestamp && todayKey(new Date(e.timestamp)) === t)
    ));
  }

  // משימת היום = derived (לא נשמר דגל): ≥MISSION_TARGET_ITEMS אירועי-בית היום.
  // עמיד לרענון/ניווט, ולא דורש שהמשחקונים ידעו על "מצב משימה".
  function getMissionProgress() {
    const done = _todayHomeEvents().length;
    return {
      done: Math.min(done, MISSION_TARGET_ITEMS),
      target: MISSION_TARGET_ITEMS,
      completed: done >= MISSION_TARGET_ITEMS,
    };
  }

  // סיכום היום למסך ההורה (ספק §6) — חיובי בלבד: אין נתוני טעויות
  function getTodaySummary() {
    const evts = _todayHomeEvents();
    const letters = [];
    const islands = [];
    evts.forEach(e => {
      if (e.target_letter && letters.indexOf(e.target_letter) === -1) letters.push(e.target_letter);
      if (typeof e.primary_island_id === 'number' && islands.indexOf(e.primary_island_id) === -1) {
        islands.push(e.primary_island_id);
      }
    });
    return {
      items: evts.length,
      letters: letters,
      islands: islands,
      minutes: Math.round(getUsedSeconds() / 60),
      missionCompleted: evts.length >= MISSION_TARGET_ITEMS,
      capMinutes: getCapMinutes(),
    };
  }

  // ---------- מסך "זֶהוּ לְהַיּוֹם" (ספק §5) ----------

  const CAP_OVERLAY_ID = 'avneiHomeCapOverlay';

  function _isParentPage() {
    try { return /parent-today\.html$/i.test(location.pathname); } catch (e) { return false; }
  }

  function showCapOverlay() {
    if (document.getElementById(CAP_OVERLAY_ID) || _isParentPage()) return;
    const el = document.createElement('div');
    el.id = CAP_OVERLAY_ID;
    el.setAttribute('dir', 'rtl');
    el.innerHTML =
      '<style>' +
      '#' + CAP_OVERLAY_ID + '{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
        'background:linear-gradient(180deg,rgba(184,232,224,0.55),rgba(99,216,208,0.65));' +
        'backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);font-family:"Heebo",sans-serif;}' +
      '#' + CAP_OVERLAY_ID + ' .cap-card{background:rgba(255,255,255,0.92);border-radius:28px;padding:32px 36px;' +
        'max-width:440px;width:calc(100% - 48px);text-align:center;box-shadow:0 18px 44px rgba(38,80,92,0.25);}' +
      '#' + CAP_OVERLAY_ID + ' img{width:130px;height:130px;object-fit:contain;margin-bottom:8px;' +
        'animation:avnei-cap-bob 3s ease-in-out infinite;}' +
      '@keyframes avnei-cap-bob{0%,100%{transform:translateY(-5px)}50%{transform:translateY(5px)}}' +
      '#' + CAP_OVERLAY_ID + ' h2{margin:0 0 6px;font-size:32px;font-weight:900;color:#26505C;}' +
      '#' + CAP_OVERLAY_ID + ' p{margin:0 0 20px;font-size:20px;font-weight:600;color:#4D6F78;}' +
      '#' + CAP_OVERLAY_ID + ' .cap-parents{display:inline-flex;align-items:center;justify-content:center;gap:8px;' +
        'min-height:56px;padding:12px 28px;border:none;border-radius:999px;cursor:pointer;' +
        'background:linear-gradient(135deg,#FFD3D8,#FFC8AE);color:#26505C;font-family:inherit;' +
        'font-size:19px;font-weight:800;box-shadow:0 8px 20px rgba(38,80,92,0.18);text-decoration:none;}' +
      '#' + CAP_OVERLAY_ID + ' .cap-parents:active{transform:scale(0.96);}' +
      '</style>' +
      '<div class="cap-card">' +
        '<img src="assets/noni-happy.png" alt="נוני">' +
        '<h2>זֶהוּ לְהַיּוֹם!</h2>' +
        '<p>הָיָה כֵּיף! נִתְרָאֶה מָחָר!</p>' +
        '<a class="cap-parents" href="parent-today.html">הַרְאוּ לְאַבָּא אוֹ לְאִמָּא</a>' +
      '</div>';
    document.body.appendChild(el);
    try { if (window.AvneiAudio) window.AvneiAudio.play('home-cap-done'); } catch (e) {}
  }

  let _capScheduled = false;
  function _scheduleCapOverlay() {
    if (_capScheduled || document.getElementById(CAP_OVERLAY_ID)) return;
    _capScheduled = true;
    setTimeout(showCapOverlay, CAP_OVERLAY_DELAY_MS);
  }

  // ---------- מעקב זמן (heartbeat) ----------

  let _lastInteraction = Date.now();
  let _trackingStarted = false;

  function _startTracking() {
    if (_trackingStarted || getContext() !== 'home' || _isParentPage()) return;
    _trackingStarted = true;
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evName) {
      document.addEventListener(evName, function () { _lastInteraction = Date.now(); },
        { passive: true, capture: true });
    });
    setInterval(function () {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - _lastInteraction > IDLE_LIMIT_MS) return;
      const total = addHomeSeconds(TICK_SECONDS);
      if (total >= getCapMinutes() * 60) _scheduleCapOverlay();
    }, TICK_SECONDS * 1000);
  }

  // ---------- hook על ה-event-logger: מכסה נאכפת אחרי פריט, לא באמצעו ----------

  function _hookLogger() {
    const EL = window.AvneiEventLogger;
    if (!EL || EL.__homeContextPatched || typeof EL.logActivityResult !== 'function') return !!(EL && EL.__homeContextPatched);
    const orig = EL.logActivityResult;
    EL.logActivityResult = function () {
      const evt = orig.apply(this, arguments);
      try {
        if (getContext() === 'home' && isCapReached()) _scheduleCapOverlay();
      } catch (e) {}
      return evt;
    };
    EL.__homeContextPatched = true;
    return true;
  }

  // ---------- init ----------

  if (typeof document !== 'undefined') {
    const boot = function () {
      _startTracking();
      // event-logger עשוי להיטען לפני או אחרי — ננסה כמה פעמים
      if (!_hookLogger()) {
        let tries = 0;
        const t = setInterval(function () {
          if (_hookLogger() || ++tries > 20) clearInterval(t);
        }, 250);
      }
      // אם המכסה כבר מוצתה (כניסה חוזרת) — לחסום מיד
      if (isCapReached()) showCapOverlay();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  return {
    getContext: getContext,
    computeContextForDate: computeContextForDate,
    todayKey: todayKey,
    getUsedSeconds: getUsedSeconds,
    addHomeSeconds: addHomeSeconds,
    getCapMinutes: getCapMinutes,
    isCapReached: isCapReached,
    getMissionProgress: getMissionProgress,
    getTodaySummary: getTodaySummary,
    showCapOverlay: showCapOverlay,
    MISSION_TARGET_ITEMS: MISSION_TARGET_ITEMS,
  };
})();
