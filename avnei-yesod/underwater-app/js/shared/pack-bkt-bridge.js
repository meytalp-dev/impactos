// ============================================================================
// pack-bkt-bridge.js — C.12 (Pack × BKT Integration)
// ============================================================================
//
// המשימה (28.5.2026 · spec: _handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md §4):
//   חיבור פאק חודשי (curriculum/packs/grade1-tashpaz/<month>-<year>.json)
//   למצב BKT/Sub-BKT של תלמידה → בחירת Tier אוטומטית (1-4).
//   המורה רואה ב-teacher-rama ויכולה להחליף ידנית (override ב-localStorage).
//
// API (נחשף ב-window.AvneiPackBridge):
//   loadPack(packId)                          → pack object (cache or load)
//   loadCurrentPack(date)                     → pack של החודש הנוכחי (או null)
//   selectTierForStudent(studentId, packId)   → { tier, reason, source, confidence, pKnown? }
//   getItemsForStudent(studentId, packId)     → array of items מהטיר המתאים
//   overrideTier(studentId, packId, tier)     → boolean (success)
//   clearOverride(studentId, packId)          → boolean
//   TIER_THRESHOLDS                            → קבועי גבולות (קריאה בלבד)
//   STRAND_NAMES                               → מיפוי 1-5 לשם בעברית
//
// תלויות:
//   window.AvneiBKT (A.1/A.4) — getStudentStrands · getLetterMasteryDistribution
//   localStorage  (override persistence)
//
// טסטים: scripts/test-pack-bridge.js
// ============================================================================

(function () {
  'use strict';

  // ==========================================================================
  // קבועים
  // ==========================================================================

  // TIER_THRESHOLDS — ניתנים לכיול בפיילוט (לא בסקופ סוכן 8)
  const TIER_THRESHOLDS = Object.freeze({
    T1_MAX: 0.30,   // p<0.30 → Tier 1 (פערים משמעותיים)
    T2_MAX: 0.60,   // 0.30-0.60 → Tier 2 (שליטה חלקית)
    T3_MAX: 0.85    // 0.60-0.85 → Tier 3 (שליטה טובה) · ≥0.85 → Tier 4
  });

  // ספים ל-confidence (letters mode)
  const CONFIDENCE_LETTERS_MIN_ATTEMPTS = 5;   // לפחות 5 ניסיונות פר אות
  // ספים ל-confidence (strand mode)
  const CONFIDENCE_STRAND_COLD_ATTEMPTS = 10;  // <10 → cold-start
  const CONFIDENCE_STRAND_HIGH_ATTEMPTS = 30;  // ≥30 → high

  // STRAND_NAMES — שמות 5 הסטרנדים בעברית
  // מקור: architecture-mvp.md (5 סטרנדים BKT)
  const STRAND_NAMES = Object.freeze({
    1: 'פונולוגיה',
    2: 'מורפולוגיה',
    3: 'שפה דבורה',
    4: 'קריאה והבנה',
    5: 'כתיבה'
  });

  const OVERRIDE_KEY = 'pack-overrides';
  // schema: { [studentId]: { [packId]: { tier, date, author } } }

  // נתיב יחסי לדפדפן · נתיב מוחלט ל-Node (לטסטים)
  const PACKS_RELATIVE_PATH = '../curriculum/packs/grade1-tashpaz/';

  // ==========================================================================
  // טעינת פאק (cache + fallback ל-XHR sync או fs)
  // ==========================================================================

  const _cache = {};

  // _setPackCache — לטסטים בלבד (הזרקת pack ידנית)
  function _setPackCache(packId, pack) {
    _cache[packId] = pack;
  }

  function _clearCache() {
    for (const k of Object.keys(_cache)) delete _cache[k];
  }

  function loadPack(packId) {
    if (!packId) return null;
    if (_cache[packId]) return _cache[packId];

    // דפדפן — sync XHR (פיילוט; לא ל-production)
    if (typeof XMLHttpRequest !== 'undefined') {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', PACKS_RELATIVE_PATH + packId + '.json', false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          _cache[packId] = JSON.parse(xhr.responseText);
          return _cache[packId];
        }
      } catch (e) {
        // ניפול ל-Node fallback (אם רץ במצב מעורב)
      }
    }

    // Node — fs sync
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const file = path.resolve(
          __dirname || '.',
          '..', '..', '..', 'curriculum', 'packs', 'grade1-tashpaz',
          packId + '.json'
        );
        if (fs.existsSync(file)) {
          _cache[packId] = JSON.parse(fs.readFileSync(file, 'utf8'));
          return _cache[packId];
        }
      } catch (e) {
        // אין דרך לטעון — נחזיר null
      }
    }

    return null;
  }

  // preloadPack — async alternative for browsers that block sync XHR
  function preloadPack(packId) {
    if (_cache[packId]) return Promise.resolve(_cache[packId]);
    if (typeof fetch === 'undefined') {
      return Promise.resolve(loadPack(packId));
    }
    return fetch(PACKS_RELATIVE_PATH + packId + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('pack ' + packId + ' not found (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (pack) {
        _cache[packId] = pack;
        return pack;
      });
  }

  // loadCurrentPack — בוחר פאק לפי תאריך (month_index + year)
  function loadCurrentPack(date) {
    const d = date instanceof Date ? date : new Date();
    const monthIndex = d.getMonth() + 1;  // 1-12
    const year = d.getFullYear();

    // נסה לטעון לפי תבנית <month-name>-<year>
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const candidate = monthNames[monthIndex - 1] + '-' + year;
    const pack = loadPack(candidate);
    if (pack) return pack;

    // fallback: חיפוש ב-cache לפי month_index + year
    for (const id of Object.keys(_cache)) {
      const p = _cache[id];
      if (p && p.month_index === monthIndex && p.year === year) return p;
    }

    return null;
  }

  // ==========================================================================
  // בחירת Tier (הלב — selectTierForStudent)
  // ==========================================================================

  function pickTier(p) {
    if (p < TIER_THRESHOLDS.T1_MAX) return 1;
    if (p < TIER_THRESHOLDS.T2_MAX) return 2;
    if (p < TIER_THRESHOLDS.T3_MAX) return 3;
    return 4;
  }

  function _avg(arr) {
    if (!arr || arr.length === 0) return 0;
    let sum = 0;
    for (const v of arr) sum += v;
    return sum / arr.length;
  }

  function _formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return dd + '/' + mm;
  }

  function selectTierForStudent(studentId, packId) {
    const pack = loadPack(packId);
    if (!pack) {
      return {
        tier: 1,
        reason: 'פאק ' + packId + ' לא נמצא — ברירת מחדל Tier 1',
        source: 'fallback',
        confidence: 'low'
      };
    }

    // 1. בדיקת override ידני של מורה
    const override = _getOverride(studentId, packId);
    if (override) {
      return {
        tier: override.tier,
        reason: 'מורה הגדירה ידנית ב-' + _formatDate(override.date),
        source: 'manual',
        confidence: 'high',
        overrideDate: override.date
      };
    }

    // 2. חישוב אוטומטי לפי focus_mode
    let pKnown;
    let confidence;
    let detailReason;
    let contributingLettersOut = null;

    const bkt = (typeof window !== 'undefined' && window.AvneiBKT) ||
                (typeof global !== 'undefined' && global.AvneiBKT) || null;
    if (!bkt || typeof bkt.getStudentStrands !== 'function') {
      return {
        tier: 1,
        reason: 'AvneiBKT לא נטען — ברירת מחדל Tier 1',
        source: 'fallback',
        confidence: 'low'
      };
    }

    if (pack.focus_mode === 'letters') {
      // ממוצע על אותיות הפאק — דרך getLetterState (A.4)
      if (typeof bkt.getLetterState !== 'function') {
        return {
          tier: 1,
          reason: 'getLetterState לא קיים — דורש A.4',
          source: 'fallback',
          confidence: 'low'
        };
      }
      const letterStates = [];
      const contributingLetters = [];
      for (const letter of pack.letters_in_focus) {
        const ls = bkt.getLetterState(studentId, letter);
        if (ls && typeof ls.pKnown === 'number' && (ls.attempts || 0) >= CONFIDENCE_LETTERS_MIN_ATTEMPTS) {
          letterStates.push(ls);
          contributingLetters.push(letter);
        }
      }

      if (letterStates.length === 0) {
        return {
          tier: 1,
          reason: 'אין דאטה (פחות מ-' + CONFIDENCE_LETTERS_MIN_ATTEMPTS + ' ניסיונות פר אות) — מתחילים מ-Tier 1',
          source: 'cold-start',
          confidence: 'low',
          contributingLetters: []
        };
      }

      pKnown = _avg(letterStates.map(function (l) { return l.pKnown; }));
      confidence = (letterStates.length === pack.letters_in_focus.length) ? 'high' : 'med';
      detailReason = 'ממוצע על ' + pack.letters_in_focus.join('·') + ': p=' + pKnown.toFixed(2)
                   + ' (' + letterStates.length + '/' + pack.letters_in_focus.length + ' אותיות עם דאטה)';
      contributingLettersOut = contributingLetters;

    } else if (pack.focus_mode === 'strand') {
      // לפי BKT-per-strand של הסטרנד הראשי
      const strands = bkt.getStudentStrands(studentId);
      // getStudentStrands מחזיר object {[strandId]: state} (לפי A.1)
      const strand = strands && strands[pack.primary_strand];
      const attempts = (strand && (strand.attempts || strand.n)) || 0;

      if (!strand || attempts < CONFIDENCE_STRAND_COLD_ATTEMPTS) {
        return {
          tier: 1,
          reason: 'אין מספיק דאטה בסטרנד ' + STRAND_NAMES[pack.primary_strand]
                + ' (' + attempts + ' ניסיונות < ' + CONFIDENCE_STRAND_COLD_ATTEMPTS + ') — Tier 1',
          source: 'cold-start',
          confidence: 'low'
        };
      }
      pKnown = strand.pKnown;
      confidence = attempts >= CONFIDENCE_STRAND_HIGH_ATTEMPTS ? 'high' : 'med';
      detailReason = 'סטרנד ' + STRAND_NAMES[pack.primary_strand]
                   + ': p=' + pKnown.toFixed(2) + ' (' + attempts + ' ניסיונות)';

    } else {
      return {
        tier: 1,
        reason: 'focus_mode "' + pack.focus_mode + '" לא נתמך — Tier 1',
        source: 'fallback',
        confidence: 'low'
      };
    }

    // 3. בחירת Tier לפי thresholds
    const tier = pickTier(pKnown);
    const result = {
      tier: tier,
      reason: detailReason,
      source: 'auto',
      confidence: confidence,
      pKnown: pKnown
    };
    if (contributingLettersOut) {
      result.contributingLetters = contributingLettersOut;
    }
    return result;
  }

  // ==========================================================================
  // getItemsForStudent
  // ==========================================================================

  function getItemsForStudent(studentId, packId) {
    const decision = selectTierForStudent(studentId, packId);
    const pack = loadPack(packId);
    if (!pack || !pack.tiers || !pack.tiers[String(decision.tier)]) return [];
    return pack.tiers[String(decision.tier)].items || [];
  }

  // ==========================================================================
  // Override (localStorage)
  // ==========================================================================

  function _getStore() {
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function _setStore(store) {
    try {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _getOverride(studentId, packId) {
    const store = _getStore();
    return (store[studentId] && store[studentId][packId]) || null;
  }

  function overrideTier(studentId, packId, tier) {
    if (typeof tier !== 'number' || tier < 1 || tier > 4) return false;
    const store = _getStore();
    if (!store[studentId]) store[studentId] = {};
    store[studentId][packId] = {
      tier: tier,
      date: Date.now(),
      author: 'teacher'
    };
    return _setStore(store);
  }

  function clearOverride(studentId, packId) {
    const store = _getStore();
    if (!store[studentId] || !store[studentId][packId]) return false;
    delete store[studentId][packId];
    if (Object.keys(store[studentId]).length === 0) delete store[studentId];
    return _setStore(store);
  }

  // ==========================================================================
  // ייצוא ל-window + Node
  // ==========================================================================

  const API = {
    loadPack: loadPack,
    preloadPack: preloadPack,
    loadCurrentPack: loadCurrentPack,
    selectTierForStudent: selectTierForStudent,
    getItemsForStudent: getItemsForStudent,
    overrideTier: overrideTier,
    clearOverride: clearOverride,
    TIER_THRESHOLDS: TIER_THRESHOLDS,
    STRAND_NAMES: STRAND_NAMES,
    // helpers לטסטים — לא חלק מה-public API:
    _setPackCache: _setPackCache,
    _clearCache: _clearCache,
    _pickTier: pickTier
  };

  if (typeof window !== 'undefined') {
    window.AvneiPackBridge = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
