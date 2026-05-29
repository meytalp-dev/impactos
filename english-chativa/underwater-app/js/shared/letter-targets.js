// ============================================================================
// shared/letter-targets.js — Teacher Letter Targets (A+B integration)
// סוכן קוד F.21E · 29.5.2026 ערב
//
// מטרה:
//   כשמורה לוחצת ב-F.21E "שלחי לתרגול אישי" (B) או "טיפלתי בכיתה" (A),
//   האות נשמרת ב-localStorage עם TTL. ה-pack engine קורא את הרשימה
//   ומתעדף את הפריטים שמכילים את האותיות הללו, גם אם
//   `allows_weakness_targeting: false` בפאק החודשי.
//
// 2 schemas (localStorage):
//
//   avnei-teacher-letter-targets-v1:
//     { [sid]: { [letter]: { addedAt: ISO, expiresAt: ISO, source } } }
//     משמש להזרקה ל-pack engine. TTL ברירת מחדל: 14 ימים.
//
//   avnei-teacher-letter-freeze-v1:
//     { [sid]: { [letter]: { frozenAt: ISO, expiresAt: ISO, source } } }
//     מסנן את האות מ-Letters Section ב-F.21E. TTL ברירת מחדל: 3 ימים.
//     כל פעולת מורה (גם "שלחי" וגם "טיפלתי") מקפיאה אוטומטית.
//
// API (window.AvneiLetterTargets):
//   addTarget(sid, letter, source?)            → boolean (success)
//   removeTarget(sid, letter)                  → boolean
//   getTargets(sid)                            → array of letters (non-expired)
//   getActiveTargets(sid)                      → array of {letter, addedAt, expiresAt}
//
//   markFrozen(sid, letter, source?)           → boolean
//   removeFrozen(sid, letter)                  → boolean
//   getFrozen(sid)                             → array of letters (non-expired)
//   isFrozen(sid, letter)                      → boolean
//
//   getAllTargetedSids()                       → array of sids עם targets פעילים
//
//   TARGET_DURATION_DAYS                       → 14
//   FREEZE_DURATION_DAYS                       → 3
//   TARGETS_KEY · FREEZE_KEY
//
// תלות: localStorage בלבד. אין תלות ב-AvneiBKT/Pack.
// טסטים: scripts/test-letter-targets.js
// ============================================================================

(function () {
  'use strict';

  const TARGETS_KEY = 'avnei-teacher-letter-targets-v1';
  const FREEZE_KEY  = 'avnei-teacher-letter-freeze-v1';

  const DAY_MS = 24 * 60 * 60 * 1000;
  const TARGET_DURATION_DAYS = 14;
  const FREEZE_DURATION_DAYS = 3;

  // --------------------------------------------------------------------------
  function _getLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    return null;
  }

  function _load(key) {
    const ls = _getLocalStorage();
    if (!ls) return {};
    try {
      const raw = ls.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
  }

  function _save(key, data) {
    const ls = _getLocalStorage();
    if (!ls) return false;
    try { ls.setItem(key, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }

  function _nowIso() {
    return (new Date()).toISOString();
  }

  function _isExpired(entry, nowTs) {
    if (!entry || !entry.expiresAt) return false;
    const exp = Date.parse(entry.expiresAt);
    if (isNaN(exp)) return false;
    const t = (typeof nowTs === 'number') ? nowTs : Date.now();
    return exp <= t;
  }

  function _activeEntries(byLetter, nowTs) {
    const out = {};
    if (!byLetter || typeof byLetter !== 'object') return out;
    Object.keys(byLetter).forEach(function (letter) {
      const entry = byLetter[letter];
      if (entry && !_isExpired(entry, nowTs)) {
        out[letter] = entry;
      }
    });
    return out;
  }

  // --------------------------------------------------------------------------
  // Targets — "שלחי לתרגול אישי" — pack engine reads these
  // --------------------------------------------------------------------------

  function addTarget(sid, letter, source) {
    if (!sid || !letter) return false;
    const all = _load(TARGETS_KEY);
    if (!all[sid]) all[sid] = {};
    const now = Date.now();
    all[sid][letter] = {
      addedAt: _nowIso(),
      expiresAt: (new Date(now + TARGET_DURATION_DAYS * DAY_MS)).toISOString(),
      source: source || 'teacher-send'
    };
    if (!_save(TARGETS_KEY, all)) return false;
    // הקפאה אוטומטית כדי שהאות לא תופיע שוב ב-Letters Section
    markFrozen(sid, letter, 'auto-from-target');
    return true;
  }

  function removeTarget(sid, letter) {
    if (!sid || !letter) return false;
    const all = _load(TARGETS_KEY);
    if (!all[sid] || !all[sid][letter]) return false;
    delete all[sid][letter];
    if (Object.keys(all[sid]).length === 0) delete all[sid];
    return _save(TARGETS_KEY, all);
  }

  function getTargets(sid) {
    if (!sid) return [];
    const all = _load(TARGETS_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active);
  }

  function getActiveTargets(sid) {
    if (!sid) return [];
    const all = _load(TARGETS_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active).map(function (letter) {
      return {
        letter: letter,
        addedAt: active[letter].addedAt,
        expiresAt: active[letter].expiresAt,
        source: active[letter].source
      };
    });
  }

  function getAllTargetedSids() {
    const all = _load(TARGETS_KEY);
    const now = Date.now();
    return Object.keys(all).filter(function (sid) {
      const active = _activeEntries(all[sid], now);
      return Object.keys(active).length > 0;
    });
  }

  // --------------------------------------------------------------------------
  // Freeze — "טיפלתי בכיתה" — F.21E reads these to hide letters
  // --------------------------------------------------------------------------

  function markFrozen(sid, letter, source) {
    if (!sid || !letter) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid]) all[sid] = {};
    const now = Date.now();
    all[sid][letter] = {
      frozenAt: _nowIso(),
      expiresAt: (new Date(now + FREEZE_DURATION_DAYS * DAY_MS)).toISOString(),
      source: source || 'teacher-handled'
    };
    return _save(FREEZE_KEY, all);
  }

  function removeFrozen(sid, letter) {
    if (!sid || !letter) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid] || !all[sid][letter]) return false;
    delete all[sid][letter];
    if (Object.keys(all[sid]).length === 0) delete all[sid];
    return _save(FREEZE_KEY, all);
  }

  function getFrozen(sid) {
    if (!sid) return [];
    const all = _load(FREEZE_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active);
  }

  function isFrozen(sid, letter) {
    if (!sid || !letter) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid] || !all[sid][letter]) return false;
    return !_isExpired(all[sid][letter], Date.now());
  }

  // --------------------------------------------------------------------------
  // export
  // --------------------------------------------------------------------------
  const API = {
    // Targets
    addTarget: addTarget,
    removeTarget: removeTarget,
    getTargets: getTargets,
    getActiveTargets: getActiveTargets,
    getAllTargetedSids: getAllTargetedSids,

    // Freeze
    markFrozen: markFrozen,
    removeFrozen: removeFrozen,
    getFrozen: getFrozen,
    isFrozen: isFrozen,

    // Constants
    TARGETS_KEY: TARGETS_KEY,
    FREEZE_KEY: FREEZE_KEY,
    TARGET_DURATION_DAYS: TARGET_DURATION_DAYS,
    FREEZE_DURATION_DAYS: FREEZE_DURATION_DAYS
  };

  if (typeof window !== 'undefined') {
    window.AvneiLetterTargets = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
