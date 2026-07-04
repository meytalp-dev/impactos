/**
 * Studio · Metadata
 * Helpers ל-UI: islands · mechanic labels · tier labels.
 * עברית פדגוגית (לא טכנית) — בהתאם ל-memory feedback-avnei-yesod-teacher-language-simplicity.
 */
(function (global) {
  'use strict';

  // אִיים זמינים ל-Studio. השמות העבריים מאי 1+2+3+4+5+14.
  // mechanics_supported מתכתב עם RAMA_TASK_MAP ב-auto-tagger.js.
  const AVAILABLE_ISLANDS = [
    {
      id: 1, name_he: 'הבועות הראשונות', short_he: 'בועות',
      mechanics_supported: ['pick'],
      description_he: 'מודעות פונולוגית — אית-פותחת / אית-סוגרת'
    },
    {
      id: 2, name_he: 'להקות הדגים', short_he: 'דגיגים',
      mechanics_supported: ['pick', 'sort-by-letter'],
      description_he: 'מודעות פונולוגית — מיון לפי צליל'
    },
    {
      id: 3, name_he: 'הבית של נוני', short_he: 'בית',
      mechanics_supported: ['tap-all', 'pick', 'memory-pair'],
      description_he: 'זיהוי שמות אותיות'
    },
    {
      id: 4, name_he: 'השונית השקטה', short_he: 'CV',
      mechanics_supported: ['tap-all', 'pick'],
      description_he: 'קריאת צירופים מנוקדים (אות + תנועה)'
    },
    {
      id: 5, name_he: 'מילים מהצדפים', short_he: 'מילים',
      mechanics_supported: ['memory-pair', 'sort-by-letter'],
      description_he: 'קריאת מילים מוכרות'
    },
    {
      id: 14, name_he: 'מכוון לשמיעה', short_he: 'הבנה',
      mechanics_supported: ['pick'],
      description_he: 'הבנת טקסט מושמע'
    }
  ];

  const MECHANIC_LABELS = {
    'tap-all':         'הקש על כל ה...',
    'pick':            'בחרי אופציה אחת',
    'memory-pair':     'משחק זוגות',
    'sort-by-letter':  'מיון לפי אות'
  };

  const MECHANIC_DESCRIPTIONS = {
    'tap-all':
      'הילדה רואה רשת של אופציות, מקישה על כל אלה שמתאימות לקריטריון.',
    'pick':
      'הילדה שומעת prompt אחד, ובוחרת אופציה אחת נכונה מ-2-4.',
    'memory-pair':
      'הילדה הופכת קלפים ומחפשת זוגות (למשל אות + צליל).',
    'sort-by-letter':
      'הילדה גוררת פריטים לסלים — לפי האות הראשונה / אחרונה.'
  };

  // Tier labels — שפה פדגוגית פשוטה. ראה memory: feedback-avnei-yesod-teacher-language-simplicity
  const TIER_LABELS = {
    1: 'בסיסי — חזרה',
    2: 'ליבה — תרגול רגיל',
    3: 'מתקדם — אתגר',
    4: 'מאסטר + חיזוק'
  };

  function getAvailableIslands() {
    // הקפד להחזיר עותק כדי שה-UI לא ידרוס.
    return AVAILABLE_ISLANDS.map(x => Object.assign({}, x,
      { mechanics_supported: x.mechanics_supported.slice() }));
  }

  function getMechanicLabel(mech) {
    return MECHANIC_LABELS[mech] || mech;
  }

  function getMechanicDescription(mech) {
    return MECHANIC_DESCRIPTIONS[mech] || '';
  }

  function getTierLabel(tier) {
    return TIER_LABELS[tier] || `רמה ${tier}`;
  }

  const api = {
    AVAILABLE_ISLANDS,
    MECHANIC_LABELS,
    MECHANIC_DESCRIPTIONS,
    TIER_LABELS,
    getAvailableIslands,
    getMechanicLabel,
    getMechanicDescription,
    getTierLabel
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global._StudioMetadata = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
