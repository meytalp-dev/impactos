/* ============================================================
   _pipeline-stub.js — Studio-UI temporary pipeline stand-in
   ------------------------------------------------------------
   Studio-UI agent uses this so the UI works "in the air" until
   Studio-Pipeline agent ships js/studio/_pipeline-real.js.

   Drop this file the moment Pipeline agent's API is loaded.
   ============================================================ */
(function () {
  'use strict';

  if (window.AvneiStudioPipeline && window.AvneiStudioPipeline.__stub === false) {
    return;
  }

  const ISLANDS = [
    { id: 1, name_he: 'בועות', mechanics_supported: ['pick'] },
    { id: 2, name_he: 'מודעות פונולוגית', mechanics_supported: ['pick', 'sort-by-letter'] },
    { id: 3, name_he: 'הכרת אותיות', mechanics_supported: ['tap-all', 'pick', 'memory-pair'] },
    { id: 4, name_he: 'הברות (CV)', mechanics_supported: ['tap-all', 'pick'] },
    { id: 5, name_he: 'מילים', mechanics_supported: ['memory-pair', 'sort-by-letter'] },
    { id: 14, name_he: 'הבנת הנשמע', mechanics_supported: ['pick'] }
  ];

  const MECH_LABELS = {
    'tap-all': 'הקש על הכל',
    'pick': 'בחירה מתוך אופציות',
    'memory-pair': 'זיכרון זוגות',
    'sort-by-letter': 'מיון לפי אות'
  };

  const TIER_LABELS = {
    1: 'בסיסי — חזרה',
    2: 'ליבה',
    3: 'מתקדם',
    4: 'מאסטר'
  };

  const STORE_KEY = 'studio-drafts';
  const PUBLISHED_KEY = 'studio-published';

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  }
  function writeStore(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); }
    catch { /* quota */ }
  }

  function uid(prefix) {
    return `${prefix}-${Math.floor(Math.random() * 1e8).toString(36)}`;
  }

  window.AvneiStudioPipeline = {
    __stub: true,

    autoTag(draft) {
      const item = Object.assign({
        item_id: draft.item_id || uid('stub'),
        tier: draft.tier || 2,
        type: draft.type || 'new',
        rama_task_alignment: 1,
        peima_target: 1,
        letters_involved: [draft.letter].filter(Boolean)
      }, draft);
      return item;
    },

    async applyNiqud(textPlain) {
      await new Promise(r => setTimeout(r, 150));
      return textPlain;
    },

    async generateTTS(textNiqud) {
      await new Promise(r => setTimeout(r, 200));
      return { audioUrl: '', durationMs: 0 };
    },

    validateContent(item) {
      const errors = [];
      if (!item.mechanic) {
        errors.push({ field: 'mechanic', code: 'missing_mechanic', severity: 'error',
          hebrew: 'לא נבחר משחק' });
      }
      if (item.mechanic && ['tap-all', 'pick'].includes(item.mechanic) && !item.letter) {
        errors.push({ field: 'letter', code: 'missing_letter', severity: 'error',
          hebrew: 'לא נבחרה אות יעד' });
      }
      if (item.mechanic === 'pick' && (!item.distractors || item.distractors.length < 3)) {
        errors.push({ field: 'distractors', code: 'distractors_too_few', severity: 'error',
          hebrew: 'צריך לפחות 3 אופציות מסיחות' });
      }
      if (item.mechanic === 'tap-all' && (!item.distractors || item.distractors.length < 3)) {
        errors.push({ field: 'distractors', code: 'distractors_too_few', severity: 'warning',
          hebrew: 'מומלץ לפחות 3 אותיות מסיחות במסך' });
      }
      if (item.mechanic === 'memory-pair') {
        const filled = (item.custom_words || []).filter(p => p && p.a && p.b);
        if (filled.length < 4) {
          errors.push({ field: 'custom_words', code: 'pairs_too_few', severity: 'error',
            hebrew: `צריך לפחות 4 זוגות מלאים (כרגע ${filled.length})` });
        }
      }
      if (item.mechanic === 'sort-by-letter') {
        const filledGroups = (item.sort_groups || []).filter(g => g && g.letter && (g.items || []).length);
        if (filledGroups.length < 2) {
          errors.push({ field: 'sort_groups', code: 'groups_too_few', severity: 'error',
            hebrew: `צריך לפחות 2 קבוצות עם אות ופריטים (כרגע ${filledGroups.length})` });
        }
      }
      return { valid: errors.filter(e => e.severity === 'error').length === 0, errors };
    },

    async saveDraft(item) {
      const list = readStore(STORE_KEY);
      const id = item.item_id || uid('draft');
      const stored = Object.assign({}, item, {
        item_id: id,
        status: 'draft',
        updated_at: new Date().toISOString()
      });
      const idx = list.findIndex(x => x.item_id === id);
      if (idx >= 0) list[idx] = stored; else list.push(stored);
      writeStore(STORE_KEY, list);
      return { id };
    },

    async publishItem(id) {
      const drafts = readStore(STORE_KEY);
      const pub = readStore(PUBLISHED_KEY);
      const item = drafts.find(x => x.item_id === id);
      if (item) {
        const next = Object.assign({}, item, { status: 'published', published_at: new Date().toISOString() });
        const i = pub.findIndex(x => x.item_id === id);
        if (i >= 0) pub[i] = next; else pub.push(next);
        writeStore(PUBLISHED_KEY, pub);
      }
    },

    async listMyItems() {
      return readStore(STORE_KEY);
    },

    async deleteDraft(id) {
      const list = readStore(STORE_KEY).filter(x => x.item_id !== id);
      writeStore(STORE_KEY, list);
    },

    getAvailableIslands() {
      return ISLANDS.slice();
    },

    getMechanicLabel(mechanic) {
      return MECH_LABELS[mechanic] || mechanic;
    },

    getTierLabel(tier) {
      return TIER_LABELS[tier] || `רמה ${tier}`;
    }
  };
})();
