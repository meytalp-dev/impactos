/**
 * Studio · Niqud Client
 * Dicta API wrapper + ב/כ/פ דגש קל post-processor.
 *
 * Public:
 *   applyNiqud(textPlain) → Promise<string>   ← Dicta + post-processor
 *   ensureBgdKptDagesh(textNiqud) → string    ← post-processor יחיד (sync)
 *   _applyNiqudViaDicta(textPlain) → Promise<string>  ← API call (no post-processor)
 *
 * Notes:
 *   - Dicta endpoint נכון נכון להיום (1.6.2026): https://nakdan-api.dicta.org.il/addnikud
 *     אם משתנה — לעדכן ENDPOINT.
 *   - on fetch failure: passthrough + שדה _niqud_failed=true בתוצאה (לא זורק).
 *   - post-processor חל גם על passthrough (אם input כבר מנוקד חלקית).
 *   - ראה memory: reference-hebrew-bgd-kpt-dagesh-rule
 */
(function (global) {
  'use strict';

  const ENDPOINT = 'https://nakdan-api.dicta.org.il/api/nakdan';
  // ↑ אם 'api/nakdan' לא עובד, נסיון fallback ל-'addnikud' (legacy).
  const ENDPOINT_FALLBACK = 'https://nakdan-api.dicta.org.il/addnikud';

  // U+05BC = HEBREW POINT DAGESH OR MAPIQ
  const DAGESH = 'ּ';
  const HEB_LETTERS = 'א-ת';        // א-ת
  const HEB_MARKS   = '֑-ׇ';        // כל סימני ניקוד/טעמים

  const BGD_KPT = new Set(['ב', 'כ', 'פ']);

  /**
   * post-processor: ב/כ/פ בתחילת מילה — חייבים דגש קל.
   * - חוקי בג"ד כפ"ת מודרני: רק תחילת מילה (לא אחרי שווא נח באמצע).
   * - אם dagesh כבר קיים → no-op.
   * - אם אין שום מארק (טקסט לא מנוקד) → no-op (אין מה להחליט).
   * - מבצע NFC בסוף לוודא סדר canonical.
   *
   * @param {string} textNiqud
   * @returns {string}
   */
  function ensureBgdKptDagesh(textNiqud) {
    if (typeof textNiqud !== 'string' || !textNiqud) return textNiqud;

    const wordRe = new RegExp(`[${HEB_LETTERS}][${HEB_LETTERS}${HEB_MARKS}]*`, 'g');

    const out = textNiqud.replace(wordRe, (word) => {
      const first = word.charAt(0);
      if (!BGD_KPT.has(first)) return word;

      // אסוף marks אחרי האות הראשונה (עד האות הבאה)
      const marksRe = new RegExp(`^[${HEB_MARKS}]+`);
      const tail = word.slice(1);
      const marksMatch = tail.match(marksRe);
      const marks = marksMatch ? marksMatch[0] : '';

      // אם אין marks (לא מנוקד) — לא להוסיף dagesh
      if (!marks) return word;

      // אם dagesh כבר קיים — no-op
      if (marks.indexOf(DAGESH) !== -1) return word;

      // הוסף dagesh בסוף ה-marks (NFC ידאג לסדר)
      const rest = tail.slice(marks.length);
      return first + marks + DAGESH + rest;
    });

    try {
      return out.normalize('NFC');
    } catch (_) {
      return out;
    }
  }

  /**
   * Dicta API call. מחזיר טקסט מנוקד או passthrough על fail.
   * NOT a public method — use applyNiqud() that also runs post-processor.
   */
  async function _applyNiqudViaDicta(textPlain) {
    if (!textPlain || typeof textPlain !== 'string') return textPlain;

    const payload = JSON.stringify({
      task: 'nakdan',
      genre: 'modern',
      data: textPlain,
      addmorph: false,
      keepqq: false,
      keepmetagim: false
    });

    const tryFetch = async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      if (!res.ok) throw new Error(`Dicta ${url}: HTTP ${res.status}`);
      return res.json();
    };

    let json;
    try {
      json = await tryFetch(ENDPOINT);
    } catch (_e1) {
      try {
        json = await tryFetch(ENDPOINT_FALLBACK);
      } catch (_e2) {
        // network / endpoint שניהם נכשלו → passthrough
        return textPlain;
      }
    }

    // Dicta החזיר כמה צורות תגובה במשך הזמן. נבדוק את הסבירות.
    // 1) חדש: { data: [{ word, options: [{ w: '...' }] }] }
    // 2) ישן: { text: '...' }
    if (typeof json === 'string') return json;
    if (json && typeof json.text === 'string') return json.text;

    if (json && Array.isArray(json.data)) {
      const parts = [];
      for (const tok of json.data) {
        if (typeof tok === 'string') { parts.push(tok); continue; }
        if (tok && typeof tok.w === 'string') { parts.push(tok.w); continue; }
        if (tok && typeof tok.word === 'string') {
          if (Array.isArray(tok.options) && tok.options[0]) {
            const opt = tok.options[0];
            if (typeof opt === 'string') { parts.push(opt); continue; }
            if (opt && typeof opt.w === 'string') { parts.push(opt.w); continue; }
          }
          parts.push(tok.word);
          continue;
        }
        // unknown shape — להמשיך
      }
      const joined = parts.join('');
      return joined || textPlain;
    }

    // unknown shape — passthrough
    return textPlain;
  }

  /**
   * Public: applyNiqud — Dicta + post-processor.
   * אם fetch נכשל / API ירד → מחזיר את ה-textPlain (passthrough),
   * עם post-processor (שמוסיף dagesh אם יש marks).
   *
   * @param {string} textPlain
   * @returns {Promise<string>}
   */
  async function applyNiqud(textPlain) {
    if (!textPlain || typeof textPlain !== 'string') return textPlain;
    let niqud;
    try {
      niqud = await _applyNiqudViaDicta(textPlain);
    } catch (_e) {
      niqud = textPlain;
    }
    return ensureBgdKptDagesh(niqud);
  }

  const api = {
    applyNiqud,
    ensureBgdKptDagesh,
    _applyNiqudViaDicta,
    DAGESH,
    ENDPOINT,
    ENDPOINT_FALLBACK
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global._StudioNiqudClient = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
