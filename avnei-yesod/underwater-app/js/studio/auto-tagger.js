/**
 * Studio · Auto-Tagger
 * draft חלקי מהמורה → item תקני שעובר את validate-pack.js
 *
 * Exposes: window._StudioAutoTagger / module.exports (UMD).
 * Owned by: Studio-Pipeline Agent (1.6.2026 bootstrap)
 */
(function (global) {
  'use strict';

  const VALID_MECHANICS = ['tap-all', 'pick', 'memory-pair', 'sort-by-letter'];

  const ALL_HEBREW_LETTERS_22 = [
    'א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
    'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'
  ];

  const FINAL_TO_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  // island × mechanic → rama_task (1-10). מקור: item-schema.js RAMA_TASKS.
  const RAMA_TASK_MAP = {
    1:  { 'pick': 2 },
    2:  { 'pick': 2, 'sort-by-letter': 2 },
    3:  { 'tap-all': 1, 'pick': 1, 'memory-pair': 1 },
    4:  { 'tap-all': 5, 'pick': 5 },
    5:  { 'memory-pair': 6, 'sort-by-letter': 6 },
    14: { 'pick': 3 }
  };

  // task → peima (1-3). תואם TASK_TO_PEIMA ב-item-schema.js.
  const TASK_TO_PEIMA = { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:3 };

  function deriveRamaTask(islandId, mechanic) {
    const m = RAMA_TASK_MAP[islandId];
    if (!m) return null;
    return m[mechanic] ?? null;
  }

  function stripNiqud(text) {
    return text.replace(/[֑-ׇ]/g, '');
  }

  function extractLettersInvolved(draft) {
    const parts = [];
    if (draft.letter) parts.push(draft.letter);
    if (Array.isArray(draft.custom_words)) parts.push(...draft.custom_words);
    if (Array.isArray(draft.distractors)) parts.push(...draft.distractors);
    const stripped = stripNiqud(parts.join(''));

    const letters = new Set();
    for (const ch of stripped) {
      const base = FINAL_TO_BASE[ch] ?? ch;
      if (ALL_HEBREW_LETTERS_22.includes(base)) letters.add(base);
    }
    return [...letters];
  }

  function rand4() {
    let s = '';
    for (let i = 0; i < 4; i++) s += Math.floor(Math.random() * 36).toString(36);
    return s;
  }

  function getTeacherId() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('studio-teacher-id') || 'guest';
      }
    } catch (_) {}
    return 'guest';
  }

  function nowMs() {
    return Date.now();
  }

  /**
   * autoTag — draft → fully-tagged item.
   * @param {Object} draft - { island_id, mechanic, letter?, custom_words?, distractors?, challenge?, tier?, skill?, audio_url? }
   * @returns {Object} item תקני (עובר validate-pack.js עבור pack של focus_mode=letters).
   */
  function autoTag(draft) {
    if (!draft || typeof draft !== 'object') {
      throw new Error('autoTag: draft required (object)');
    }
    if (!VALID_MECHANICS.includes(draft.mechanic)) {
      throw new Error(
        `autoTag: invalid mechanic "${draft.mechanic}" — must be one of ${VALID_MECHANICS.join(', ')}`
      );
    }
    if (typeof draft.island_id !== 'number') {
      throw new Error('autoTag: island_id (number) required');
    }

    const ramaTask = deriveRamaTask(draft.island_id, draft.mechanic);
    const peima = ramaTask !== null ? TASK_TO_PEIMA[ramaTask] : null;

    const tier = Number.isInteger(draft.tier) && draft.tier >= 1 && draft.tier <= 4
      ? draft.tier
      : 2;

    const teacherId = getTeacherId();
    const itemId = draft.item_id
      || `studio-${teacherId}-${nowMs()}-${rand4()}`;

    const item = {
      item_id: itemId,
      tier: tier,
      type: 'new',
      mechanic: draft.mechanic,
      rama_task_alignment: ramaTask,
      peima_target: peima,
      letters_involved: extractLettersInvolved(draft)
    };

    if (draft.letter) item.letter = draft.letter;
    if (draft.skill) item.skill = draft.skill;
    if (draft.challenge) item.challenge = draft.challenge;
    if (draft.audio_url) item.audio_url = draft.audio_url;
    if (Array.isArray(draft.custom_words)) item.custom_words = draft.custom_words.slice();
    if (Array.isArray(draft.distractors)) item.distractors = draft.distractors.slice();

    item._studio = {
      teacher_id: teacherId,
      island_id: draft.island_id,
      created_at: new Date().toISOString()
    };

    return item;
  }

  const api = {
    autoTag,
    deriveRamaTask,
    extractLettersInvolved,
    stripNiqud,
    getTeacherId,
    RAMA_TASK_MAP,
    TASK_TO_PEIMA,
    ALL_HEBREW_LETTERS_22,
    FINAL_TO_BASE,
    VALID_MECHANICS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global._StudioAutoTagger = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
