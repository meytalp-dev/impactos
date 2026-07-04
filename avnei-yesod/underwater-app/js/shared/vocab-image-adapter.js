// ============================================================================
// shared/vocab-image-adapter.js — גשר בין _manifest.json לאופציות המשחקון
// 3.7.2026
//
// הבעיה שנפתרת: האופציות ב-questions-grade1.json מסומנות mode:"image" אבל בלי
// image_src. הקבצים בפועל יושבים ב-assets/vocab/, וה-mapping (איזה קובץ לאיזו
// שאלה/אופציה) חי ב-assets/vocab/_manifest.json. המודול הזה קורא את ה-manifest
// פעם אחת ומזריק image_src לכל אופציה לפי q_id + מיקום האופציה (opt).
//
// עיקרון: התאמה לפי אינדקס. manifest entry {q_id, opt, file} → options[opt].image_src.
// (הסדר ב-questions-grade1.json קבוע לפני הערבוב; המשחקון מערבב אח"כ בעצמו.)
//
// חוזה:
//   await AvneiVocabImages.load()                    // טוען + ממזג pending, idempotent
//   AvneiVocabImages.applyToQuestion(q)              // מזריק image_src in-place, מחזיר q
//   AvneiVocabImages.srcFor(q_id, optIndex)          // → 'assets/vocab/x.png' | null
//   AvneiVocabImages.missing()                       // → [{q_id, opt, word, file}] שאין להם קובץ
//   AvneiVocabImages.stats()                         // → {total, present, missing}
//
// אפס תלות ב-backend. נכשל בשקט אם ה-manifest לא נטען (image_src נשאר כפי שהיה).
// ============================================================================

(function () {
  'use strict';

  var DEFAULT_BASE = 'assets/vocab/';
  var MANIFEST_URL = DEFAULT_BASE + '_manifest.json';

  var state = {
    base: DEFAULT_BASE,
    byQid: null,        // { q_id: [ {opt, word, file, correct}, ... ] } ממוין לפי opt
    loaded: false,
    loading: null,      // Promise בזמן טעינה (מונע כפילות)
  };

  function indexManifest(rows) {
    var by = {};
    (rows || []).forEach(function (r) {
      if (!r || !r.q_id || typeof r.opt !== 'number') return;
      (by[r.q_id] || (by[r.q_id] = []))[r.opt] = {
        opt: r.opt, word: r.word, file: r.file, correct: !!r.correct,
      };
    });
    return by;
  }

  function load(opts) {
    if (opts && opts.base) { state.base = opts.base; }
    if (state.loaded) return Promise.resolve(state.byQid);
    if (state.loading) return state.loading;

    var url = (opts && opts.manifestUrl) || (state.base + '_manifest.json');
    state.loading = fetch(url, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('manifest ' + res.status);
        return res.json();
      })
      .then(function (rows) {
        state.byQid = indexManifest(rows);
        state.loaded = true;
        state.loading = null;
        return state.byQid;
      })
      .catch(function (err) {
        // כשל טעינה = לא חוסם את המשחקון; פשוט אין תמונות.
        if (typeof console !== 'undefined') console.warn('[VocabImages] load failed:', err && err.message);
        state.byQid = state.byQid || {};
        state.loaded = true;
        state.loading = null;
        return state.byQid;
      });
    return state.loading;
  }

  function srcFor(qId, optIndex) {
    if (!state.byQid) return null;
    var rows = state.byQid[qId];
    if (!rows) return null;
    var entry = rows[optIndex];
    if (!entry || !entry.file) return null;
    return state.base + entry.file;
  }

  // מזריק image_src לכל אופציה עם mode:'image' שאין לה image_src, לפי המיקום.
  // גם ל-stem אם הוא mode:'image' (משתמש ב-opt של האופציה הנכונה כ-stem במצב image_to_word).
  function applyToQuestion(q) {
    if (!q || !Array.isArray(q.options)) return q;
    q.options.forEach(function (opt, i) {
      if (!opt) return;
      var isImg = opt.mode === 'image' || (!opt.mode && !opt.text_he && !opt.label_he);
      if (isImg && !opt.image_src) {
        var src = srcFor(q.q_id, i);
        if (src) {
          opt.image_src = src;
          if (!opt.image_alt) opt.image_alt = opt.label_he || opt.word || '';
        }
      }
    });
    // כיוון image_to_word: ה-stem הוא תמונת התשובה הנכונה.
    // הבנק מסמן stem-תמונה ב-stem_mode:'image' (top-level) — אובייקט q.stem
    // קיים רק כשה-src הוזרק ידנית; יוצרים אותו כאן כשיש רשומת manifest.
    var stemIsImage = (q.stem && q.stem.mode === 'image') || q.stem_mode === 'image';
    if (stemIsImage && !(q.stem && q.stem.image_src) && Array.isArray(q.options)) {
      var correctIdx = q.options.findIndex(function (o) { return o && o.is_correct; });
      if (correctIdx >= 0) {
        var s = srcFor(q.q_id, correctIdx);
        if (s) {
          if (!q.stem) q.stem = { mode: 'image' };
          q.stem.image_src = s;
        }
      }
    }
    return q;
  }

  // רשימת כל הרשומות שקובץ התמונה שלהן עדיין לא קיים בדיסק (בדיקה דרך HEAD/Image).
  // אסינכרוני — בודק בפועל אילו קבצים נטענים. שימושי לדף QA.
  function missing() {
    if (!state.byQid) return Promise.resolve([]);
    var all = [];
    Object.keys(state.byQid).forEach(function (qId) {
      state.byQid[qId].forEach(function (r) {
        if (r) all.push({ q_id: qId, opt: r.opt, word: r.word, file: r.file });
      });
    });
    return Promise.all(all.map(function (row) {
      return probe(state.base + row.file).then(function (ok) {
        return ok ? null : row;
      });
    })).then(function (arr) { return arr.filter(Boolean); });
  }

  function probe(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = url;
    });
  }

  function stats() {
    return missing().then(function (miss) {
      var total = 0;
      if (state.byQid) {
        Object.keys(state.byQid).forEach(function (q) {
          state.byQid[q].forEach(function (r) { if (r) total++; });
        });
      }
      return { total: total, present: total - miss.length, missing: miss.length };
    });
  }

  window.AvneiVocabImages = {
    load: load,
    srcFor: srcFor,
    applyToQuestion: applyToQuestion,
    missing: missing,
    stats: stats,
    _state: state, // debug
  };
})();
