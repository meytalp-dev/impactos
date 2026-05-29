// ============================================================================
// shared/skill-units.js — Skill Unit Abstraction (F.21E unit-agnostic layer)
// סוכן קוד F.21E · 29.5.2026 ערב מאוחר
//
// מטרה:
//   F.21E ה-Section "נקודות לחיזוק היום" התחיל מ-"אותיות חלשות". אבל לפי
//   התוכנית השנתית (curriculum/literacy-grade1-2-yearly.md):
//     ספט-אוק: אותיות + צלילים
//     נוב:    מילים + ם/ן
//     דצמ:    שווא + תחיליות (וְ, בְּ, לְ)
//     ינו:    תנועת חיריק
//     פב-מר:  חולם, צירי-סגול, אבחנה בין תנועות
//     אפר:    קובוץ-שורוק
//     מאי:    הבנת משפט + מילות תפל
//     יוני:   שטף + הבנת פסקה
//
//   כדי לא לכתוב מחדש את F.21E בינואר — אבסטרקציה אחת שמסיגה את ה-API
//   מ-"אותיות" ל-"יחידות מיומנות" (skill units).
//
// Skill Unit Schema:
//   {
//     type: 'letter' | 'vowel' | 'phon-skill' | 'word' | 'morpheme' |
//           'reading-skill' | 'oral-skill' | 'writing',
//     id: 'מ' | 'kamatz' | 'sound-isolation' | 'kelev' | 'prefix-ve' | ...,
//     displayHe: 'מ' | 'תנועת קמץ' | 'בידוד צליל פותח' | ...,
//     strand: 1 | 2 | 3 | 4 | 5      // (אופציונלי)
//   }
//
// API (window.AvneiSkillUnits):
//   // Targeting (delegates to type-specific stores; "letter" → AvneiLetterTargets)
//   addTarget(sid, unit, source?)     → boolean
//   removeTarget(sid, unit)           → boolean
//   getTargets(sid)                   → array of units (active)
//   markFrozen(sid, unit, source?)    → boolean
//   removeFrozen(sid, unit)           → boolean
//   isFrozen(sid, unit)               → boolean
//   getFrozen(sid)                    → array of units (active)
//
//   // Weakness discovery (pulls from BKT/EPA per type)
//   getWeakUnits(sid, n=3)            → array of units, top-N weakest
//                                         currently: letters only (sub-BKT)
//                                         post-pilot: vowels/phon-skills/...
//
//   // Display
//   unitToDisplayHe(unit)             → string (Hebrew, no niqqud)
//   unitKey(unit)                     → canonical "type:id" string
//
// Pluggable per-type adapters:
//   _LETTER_ADAPTER  → AvneiLetterTargets (קיים)
//   _VOWEL_ADAPTER   → ⏳ post-pilot
//   _PHON_SKILL_ADAPTER → ⏳ post-pilot
//
// תלות:
//   window.AvneiLetterTargets  — להתאמת type='letter'
//   window.AvneiBKT            — להגעה ל-getWeakestLetters עבור type='letter'
//
// טסטים: scripts/test-skill-units.js
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Type constants (לעדכון כשנוספים types)
  // --------------------------------------------------------------------------
  const UNIT_TYPES = Object.freeze({
    LETTER:        'letter',
    VOWEL:         'vowel',
    PHON_SKILL:    'phon-skill',
    WORD:          'word',
    MORPHEME:      'morpheme',
    READING_SKILL: 'reading-skill',
    ORAL_SKILL:    'oral-skill',
    WRITING:       'writing'
  });

  // Display label fallbacks פר type — אם unit.displayHe חסר.
  // עבור type='letter', id הוא התו עצמו ולא צריך עיטוף.
  // עבור types אחרים, מפה אופציונלית (תורחב פר type).
  const DISPLAY_PREFIX_BY_TYPE = Object.freeze({
    'letter':        '',
    'vowel':         'תנועת ',
    'phon-skill':    '',
    'word':          'הקריאה של ',
    'morpheme':      'התחילית ',
    'reading-skill': '',
    'oral-skill':    '',
    'writing':       'כתיבת '
  });

  // --------------------------------------------------------------------------
  // Adapters access (mockable ב-Node)
  // --------------------------------------------------------------------------
  function _getLetterTargets() {
    if (typeof window !== 'undefined' && window.AvneiLetterTargets) return window.AvneiLetterTargets;
    if (typeof global !== 'undefined' && global.AvneiLetterTargets) return global.AvneiLetterTargets;
    return null;
  }

  function _getBKT() {
    if (typeof window !== 'undefined' && window.AvneiBKT) return window.AvneiBKT;
    if (typeof global !== 'undefined' && global.AvneiBKT) return global.AvneiBKT;
    return null;
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  function _isValidUnit(unit) {
    if (!unit || typeof unit !== 'object') return false;
    if (!unit.type || typeof unit.type !== 'string') return false;
    if (!unit.id || typeof unit.id !== 'string') return false;
    return true;
  }

  // --------------------------------------------------------------------------
  // Display helpers
  // --------------------------------------------------------------------------
  function unitToDisplayHe(unit) {
    if (!_isValidUnit(unit)) return '';
    if (unit.displayHe) return unit.displayHe;
    const prefix = DISPLAY_PREFIX_BY_TYPE[unit.type] || '';
    return prefix + unit.id;
  }

  function unitKey(unit) {
    if (!_isValidUnit(unit)) return '';
    return unit.type + ':' + unit.id;
  }

  // --------------------------------------------------------------------------
  // Targeting — delegates per type
  // --------------------------------------------------------------------------
  function addTarget(sid, unit, source) {
    if (!sid || !_isValidUnit(unit)) return false;
    if (unit.type === UNIT_TYPES.LETTER) {
      const LT = _getLetterTargets();
      if (!LT || typeof LT.addTarget !== 'function') return false;
      return LT.addTarget(sid, unit.id, source);
    }
    // Future types: no-op for now (returns false to surface "not yet supported")
    return false;
  }

  function removeTarget(sid, unit) {
    if (!sid || !_isValidUnit(unit)) return false;
    if (unit.type === UNIT_TYPES.LETTER) {
      const LT = _getLetterTargets();
      if (!LT || typeof LT.removeTarget !== 'function') return false;
      return LT.removeTarget(sid, unit.id);
    }
    return false;
  }

  function getTargets(sid) {
    if (!sid) return [];
    const out = [];
    // letter delegate
    const LT = _getLetterTargets();
    if (LT && typeof LT.getTargets === 'function') {
      try {
        (LT.getTargets(sid) || []).forEach(function (letter) {
          out.push({ type: UNIT_TYPES.LETTER, id: letter, displayHe: letter });
        });
      } catch (e) { /* swallow */ }
    }
    // Future types: append here
    return out;
  }

  function markFrozen(sid, unit, source) {
    if (!sid || !_isValidUnit(unit)) return false;
    if (unit.type === UNIT_TYPES.LETTER) {
      const LT = _getLetterTargets();
      if (!LT || typeof LT.markFrozen !== 'function') return false;
      return LT.markFrozen(sid, unit.id, source);
    }
    return false;
  }

  function removeFrozen(sid, unit) {
    if (!sid || !_isValidUnit(unit)) return false;
    if (unit.type === UNIT_TYPES.LETTER) {
      const LT = _getLetterTargets();
      if (!LT || typeof LT.removeFrozen !== 'function') return false;
      return LT.removeFrozen(sid, unit.id);
    }
    return false;
  }

  function isFrozen(sid, unit) {
    if (!sid || !_isValidUnit(unit)) return false;
    if (unit.type === UNIT_TYPES.LETTER) {
      const LT = _getLetterTargets();
      if (!LT || typeof LT.isFrozen !== 'function') return false;
      return LT.isFrozen(sid, unit.id);
    }
    return false;
  }

  function getFrozen(sid) {
    if (!sid) return [];
    const out = [];
    const LT = _getLetterTargets();
    if (LT && typeof LT.getFrozen === 'function') {
      try {
        (LT.getFrozen(sid) || []).forEach(function (letter) {
          out.push({ type: UNIT_TYPES.LETTER, id: letter, displayHe: letter });
        });
      } catch (e) { /* swallow */ }
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // getWeakUnits — top-N weak units פר תלמיד.ה
  //
  // היום: שולף אותיות חלשות מ-AvneiBKT.getWeakestLetters.
  // post-pilot: יוסיף vowels (מאי-strand 1), phon-skills (events EPA), וכו'.
  // --------------------------------------------------------------------------
  function getWeakUnits(sid, n) {
    const limit = (typeof n === 'number' && n > 0) ? n : 3;
    if (!sid) return [];

    const out = [];

    // Letters
    const BKT = _getBKT();
    if (BKT && typeof BKT.getWeakestLetters === 'function') {
      try {
        const weakest = BKT.getWeakestLetters(sid, limit * 2);  // משוך יותר ל-filtering פוטנציאלי
        if (Array.isArray(weakest)) {
          weakest.forEach(function (entry) {
            const letter = entry && entry.letter;
            if (!letter) return;
            const unit = { type: UNIT_TYPES.LETTER, id: letter, displayHe: letter, strand: 1 };
            // סנן את אלה ש-frozen
            if (!isFrozen(sid, unit)) {
              out.push(unit);
            }
          });
        }
      } catch (e) { /* swallow */ }
    }

    // Future: vowels (post-pilot)
    // const VOWELS = _getVowelEngine();
    // if (VOWELS && ...) { ... }

    // Future: phon-skills (post-pilot)
    // ...

    return out.slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // Convenience: letter shorthand (backward compat / readability)
  // --------------------------------------------------------------------------
  function makeLetterUnit(letter) {
    return { type: UNIT_TYPES.LETTER, id: letter, displayHe: letter, strand: 1 };
  }

  // --------------------------------------------------------------------------
  // export
  // --------------------------------------------------------------------------
  const API = {
    // Constants
    UNIT_TYPES: UNIT_TYPES,
    DISPLAY_PREFIX_BY_TYPE: DISPLAY_PREFIX_BY_TYPE,

    // Targeting
    addTarget: addTarget,
    removeTarget: removeTarget,
    getTargets: getTargets,
    markFrozen: markFrozen,
    removeFrozen: removeFrozen,
    isFrozen: isFrozen,
    getFrozen: getFrozen,

    // Discovery
    getWeakUnits: getWeakUnits,

    // Display
    unitToDisplayHe: unitToDisplayHe,
    unitKey: unitKey,

    // Convenience
    makeLetterUnit: makeLetterUnit,

    // Validation (לטסטים)
    _isValidUnit: _isValidUnit
  };

  if (typeof window !== 'undefined') {
    window.AvneiSkillUnits = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
