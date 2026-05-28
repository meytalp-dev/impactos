// ============================================================================
// pack-bkt-bridge.js — C.12 (Pack × BKT Integration) + C.12B (Weakness Targeting)
// ============================================================================
//
// המשימה (28.5.2026 · spec: _handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md §4
//          + revision: _handoff/2026-05-28-C11-C12-C13-pack-bkt-spec-rev2.md §5):
//   חיבור פאק חודשי (curriculum/packs/grade1-tashpaz/<month>-<year>.json)
//   למצב BKT/Sub-BKT של תלמידה → בחירת Tier אוטומטית (1-4).
//   המורה רואה ב-teacher-rama ויכולה להחליף ידנית (override ב-localStorage).
//   C.12B מוסיף layer: Weakness Targeting — בפאקים שמותרים, עדיפים פריטים
//   שמכילים אותיות חלשות מפאקים קודמים (top-3, p<0.40, attempts≥5).
//
// API (נחשף ב-window.AvneiPackBridge):
//   loadPack(packId)                              → pack object (cache or load)
//   loadCurrentPack(date)                         → pack של החודש הנוכחי (או null)
//   selectTierForStudent(studentId, packId)       → { tier, reason, source, confidence, pKnown? }
//   selectItemsForStudent(studentId, packId)      → array of items (כולל weakness targeting אם מותר)
//   getItemsForStudent(studentId, packId)         → alias ל-selectItemsForStudent (backward-compat)
//   overrideTier(studentId, packId, tier)         → boolean (success)
//   clearOverride(studentId, packId)              → boolean
//   TIER_THRESHOLDS                                → קבועי גבולות (קריאה בלבד)
//   STRAND_NAMES                                   → מיפוי 1-5 לשם בעברית
//   WEAKNESS_THRESHOLD · MIN_ATTEMPTS_FOR_WEAK     → ספי targeting (C.12B)
//   MAX_WEAK_LETTERS_TARGETED · TARGETED_RATIO     → קבועי בחירת פריטים (C.12B)
//
// תלויות:
//   window.AvneiBKT (A.1/A.4/C.12B) — getStudentStrands · getLetterState · getWeakLetters
//   localStorage  (override persistence)
//
// טסטים: scripts/test-pack-bridge.js · scripts/test-weakness-targeting.js
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

  // ========== C.12B — Weakness Targeting Constants ==========
  // מקור: spec rev2 §2 + §5.3. ניתנים לכיול בפיילוט (לא בסקופ C.12B).
  const WEAKNESS_THRESHOLD = 0.40;          // אות נחשבת חלשה אם pKnown < 0.40
  const MIN_ATTEMPTS_FOR_WEAK = 5;          // ספים cold-start: לפחות 5 ניסיונות פר אות
  const MAX_WEAK_LETTERS_TARGETED = 3;      // top-N — מבוסס Cowan + Foorman + Wanzek
  // TARGETED_RATIO פר Tier — drill-sandwich (MacQuarrie/Burns/Cepeda)
  // Tier 1 — פחות (overload protection לילדות עם פערים)
  // Tier 2/3/4 — drill-sandwich 70-75%
  const TARGETED_RATIO = Object.freeze({
    1: 0.30,
    2: 0.70,
    3: 0.75,
    4: 0.70
  });

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
  // selectItemsForStudent (C.12B) — בחירת פריטים עם Weakness Targeting
  // ==========================================================================
  //
  // לוגיקה:
  //   1. בוחרים Tier (selectTierForStudent)
  //   2. אם pack.allows_weakness_targeting === false (או חסר) → מחזירים את כל ה-items של ה-tier
  //   3. אם אין weak letters לתלמידה → מחזירים את כל ה-items של ה-tier
  //   4. אחרת: מסננים ל-2 קבוצות (targeted = items שמכילים weak letters · general = השאר)
  //      ובונים מערך לפי TARGETED_RATIO[tier] עם drill-sandwich interleave.
  //
  // ה-pool תמיד מכיל בדיוק |items| פריטים — אם אין מספיק targeted/general,
  // מתמלאים מהקבוצה השנייה (בלי כפילויות מעבר ל-pool המקורי).

  function _shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  // _interleaveDrill — שזירת targeted ו-general לפי תבנית drill-sandwich.
  // לא צמודים — תיתן לתלמידה גירויים מעורבים (Bjork desirable difficulties).
  // אלגוריתם פשוט: שזירה לפי ratio של אורכי המערכים.
  function _interleaveDrill(targeted, general) {
    const result = [];
    const tLen = targeted.length;
    const gLen = general.length;
    const total = tLen + gLen;
    if (total === 0) return result;

    let ti = 0, gi = 0;
    // יחס תור פר צעד — שומר על פיזור בהתבסס על אורך מבוקש
    for (let i = 0; i < total; i++) {
      const tRemaining = tLen - ti;
      const gRemaining = gLen - gi;
      if (tRemaining === 0) {
        result.push(general[gi++]);
      } else if (gRemaining === 0) {
        result.push(targeted[ti++]);
      } else {
        // מעדיף את הקבוצה עם יחס נותר גבוה יותר ביחס לתוכן המקורי
        const tShare = tRemaining / tLen;
        const gShare = gRemaining / gLen;
        if (tShare >= gShare) {
          result.push(targeted[ti++]);
        } else {
          result.push(general[gi++]);
        }
      }
    }
    return result;
  }

  function _itemMatchesWeakLetters(item, weakLetters) {
    const involved = Array.isArray(item.letters_involved) ? item.letters_involved : null;
    if (!involved || involved.length === 0) return false;
    for (const w of weakLetters) {
      if (involved.includes(w)) return true;
    }
    return false;
  }

  function selectItemsForStudent(studentId, packId) {
    const decision = selectTierForStudent(studentId, packId);
    const pack = loadPack(packId);
    if (!pack || !pack.tiers || !pack.tiers[String(decision.tier)]) return [];
    const items = pack.tiers[String(decision.tier)].items || [];
    if (items.length === 0) return [];

    // 1. פאק לא מתיר targeting — חזרה רגילה
    if (!pack.allows_weakness_targeting) return items;

    // 2. משוך top-N weak letters
    const bkt = (typeof window !== 'undefined' && window.AvneiBKT) ||
                (typeof global !== 'undefined' && global.AvneiBKT) || null;
    if (!bkt || typeof bkt.getWeakLetters !== 'function') return items;

    const weakLetters = bkt.getWeakLetters(studentId, {
      threshold: WEAKNESS_THRESHOLD,
      minAttempts: MIN_ATTEMPTS_FOR_WEAK,
      max: MAX_WEAK_LETTERS_TARGETED
    });

    if (!weakLetters || weakLetters.length === 0) return items;

    // 3. סנן ל-2 קבוצות
    const targetedPool = items.filter(i => _itemMatchesWeakLetters(i, weakLetters));
    const generalPool  = items.filter(i => !_itemMatchesWeakLetters(i, weakLetters));

    // אם אין פריטים מטורגטים בכלל ב-tier הזה — חזרה רגילה
    if (targetedPool.length === 0) return items;

    // 4. בחירת אחוזים פר Tier
    const ratio = TARGETED_RATIO[decision.tier];
    if (typeof ratio !== 'number') return items;

    const totalItems = items.length;
    let targetCount = Math.round(totalItems * ratio);
    let generalCount = totalItems - targetCount;

    // הגן על מקרה שאין מספיק פריטים בקבוצה אחת — שאר ימולא מהשנייה
    const tAvail = targetedPool.length;
    const gAvail = generalPool.length;
    if (targetCount > tAvail) {
      generalCount += (targetCount - tAvail);
      targetCount = tAvail;
    }
    if (generalCount > gAvail) {
      targetCount += (generalCount - gAvail);
      generalCount = gAvail;
    }
    // clamp לבטיחות (לא יותר מהזמין)
    if (targetCount > tAvail) targetCount = tAvail;
    if (generalCount > gAvail) generalCount = gAvail;

    const chosenTargeted = _shuffle(targetedPool).slice(0, targetCount);
    const chosenGeneral  = _shuffle(generalPool).slice(0, generalCount);

    return _interleaveDrill(chosenTargeted, chosenGeneral);
  }

  // getItemsForStudent — alias ל-selectItemsForStudent (backward-compat לטסטים ולקריאות קיימות)
  function getItemsForStudent(studentId, packId) {
    return selectItemsForStudent(studentId, packId);
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
    selectItemsForStudent: selectItemsForStudent,    // C.12B
    getItemsForStudent: getItemsForStudent,          // backward-compat alias
    overrideTier: overrideTier,
    clearOverride: clearOverride,
    TIER_THRESHOLDS: TIER_THRESHOLDS,
    STRAND_NAMES: STRAND_NAMES,
    // C.12B constants:
    WEAKNESS_THRESHOLD: WEAKNESS_THRESHOLD,
    MIN_ATTEMPTS_FOR_WEAK: MIN_ATTEMPTS_FOR_WEAK,
    MAX_WEAK_LETTERS_TARGETED: MAX_WEAK_LETTERS_TARGETED,
    TARGETED_RATIO: TARGETED_RATIO,
    // helpers לטסטים — לא חלק מה-public API:
    _setPackCache: _setPackCache,
    _clearCache: _clearCache,
    _pickTier: pickTier,
    _interleaveDrill: _interleaveDrill,
    _itemMatchesWeakLetters: _itemMatchesWeakLetters
  };

  if (typeof window !== 'undefined') {
    window.AvneiPackBridge = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
