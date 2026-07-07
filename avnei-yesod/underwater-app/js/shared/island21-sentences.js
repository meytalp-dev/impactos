// ============================================================================
// shared/island21-sentences.js — בנק המשפטים של אי 21 (לגונת הבקבוקים · דיקטה)
// לוח בניית האיים · H21 · 7.7.2026
//
// גרסת-ביניים של "דיקטה": הרכיב המוטורי (כתב-יד) אינו ישים עדיין, אז מתרגלים את
// הרכיב הקוגניטיבי — שמיעה → פירוק → איות → *סדר מילים*. נוני משמיעה משפט קצר
// (2–4 מילים, מילים מוכרות-לגיל בלבד) והילד.ה בונה אותו מאריחי-מילים מנוקדים,
// מימין לשמאל.
//
// 🔴 כל התוכן inline (אין קובץ JSON) → אין צורך ב-build-embedded-data.
// 🔴 כל המשפטים והמילים = ASK פדגוגי למיטל (אוצר מלקסיקון גן/א', נושא ימי).
//
// מבנה משפט:
//   { id, level, audio, text, words: [{text, slug}, ...] }
//   words = בסדר-הדיבור (המילה הראשונה נשמעת ראשונה → מוצגת מימין).
//   audio = מפתח קובץ המשפט המלא (assets/audio/<audio>.mp3).
//   כל מילה: slug → קובץ מילה בודדת isl21-word-<slug>.mp3 (להאזנה בלחיצה ארוכה).
//
// ניקוד: מלא. ב/כ/פ בראש הברה = דגש קל (בָּא · בַּיָּם · הַדָּג · גָּדוֹל · הַקָּטָן).
// נוני = נקבה ("נוני שָׁרָה" · "נוני רוֹאָה") — תואם הנרטיב באיים 5/20.
// ============================================================================

(function () {
  'use strict';

  function W(text, slug) { return { text: text, slug: slug }; }

  // מאגר המילים — slug יציב לאודיו (isl21-word-<slug>.mp3). מילה חוזרת בין
  // משפטים = אותו slug (מפיקים פעם אחת).
  var WORDS = {
    gal:     W('גַּל', 'gal'),        // wave
    ba:      W('בָּא', 'ba'),          // came (m.)
    hadag:   W('הַדָּג', 'hadag'),     // the fish
    dag:     W('דָּג', 'dag'),         // a fish
    sameach: W('שָׂמֵחַ', 'sameach'),  // happy (m.)
    noni:    W('נוֹנִי', 'noni'),      // Noni (octopus)
    shara:   W('שָׁרָה', 'shara'),     // sings (f.)
    shat:    W('שָׁט', 'shat'),        // sails/floats (m.)
    bayam:   W('בַּיָּם', 'bayam'),    // in-the-sea
    gadol:   W('גָּדוֹל', 'gadol'),    // big (m.)
    roa:     W('רוֹאָה', 'roa'),       // sees (f.)
    hakatan: W('הַקָּטָן', 'hakatan'), // the-small (m.)
  };

  // מסיחים — מילים ימיות/מוכרות שאינן במשפט הנוכחי (בלבול-מילה = word-choice).
  // כולן עם אודיו מובטח (מיוצרות בצנרת isl21-word-*).
  var DISTRACTORS = [
    W('יָם', 'yam'),        // sea (בלי ה')
    W('קָטָן', 'katan'),    // small (בלי ה')
    W('שֶׁמֶשׁ', 'shemesh'), // sun
    W('חוֹל', 'chol'),      // sand
    W('כָּחֹל', 'kachol'),  // blue (m.)
    W('גָּדוֹל', 'gadol'),
    W('דָּג', 'dag'),
    W('גַּל', 'gal'),
  ];

  // בנק המשפטים לפי דרגה (מספר מילים).
  var SENTENCES = [
    // ── 2 מילים ──────────────────────────────────────────────
    { id: 'gal-ba',        level: 2, text: 'גַּל בָּא',          audio: 'isl21-sent-gal-ba',        words: [WORDS.gal, WORDS.ba] },
    { id: 'hadag-sameach', level: 2, text: 'הַדָּג שָׂמֵחַ',      audio: 'isl21-sent-hadag-sameach', words: [WORDS.hadag, WORDS.sameach] },
    { id: 'noni-shara',    level: 2, text: 'נוֹנִי שָׁרָה',       audio: 'isl21-sent-noni-shara',    words: [WORDS.noni, WORDS.shara] },

    // ── 3 מילים ──────────────────────────────────────────────
    { id: 'hadag-shat-bayam', level: 3, text: 'הַדָּג שָׁט בַּיָּם',   audio: 'isl21-sent-hadag-shat-bayam', words: [WORDS.hadag, WORDS.shat, WORDS.bayam] },
    { id: 'gal-gadol-ba',     level: 3, text: 'גַּל גָּדוֹל בָּא',    audio: 'isl21-sent-gal-gadol-ba',     words: [WORDS.gal, WORDS.gadol, WORDS.ba] },
    { id: 'noni-roa-dag',     level: 3, text: 'נוֹנִי רוֹאָה דָּג',   audio: 'isl21-sent-noni-roa-dag',     words: [WORDS.noni, WORDS.roa, WORDS.dag] },

    // ── 4 מילים ──────────────────────────────────────────────
    { id: 'hadag-hakatan-shat-bayam', level: 4, text: 'הַדָּג הַקָּטָן שָׁט בַּיָּם', audio: 'isl21-sent-hadag-hakatan-shat-bayam', words: [WORDS.hadag, WORDS.hakatan, WORDS.shat, WORDS.bayam] },
    { id: 'noni-roa-gal-gadol',       level: 4, text: 'נוֹנִי רוֹאָה גַּל גָּדוֹל',  audio: 'isl21-sent-noni-roa-gal-gadol',       words: [WORDS.noni, WORDS.roa, WORDS.gal, WORDS.gadol] },
  ];

  function byLevel(level) {
    return SENTENCES.filter(function (s) { return s.level === level; });
  }

  // מסיחים למשפט: n מילים מהמאגר שאינן מופיעות במשפט (לפי slug).
  function distractorsFor(sentence, n) {
    var used = {};
    sentence.words.forEach(function (w) { used[w.slug] = true; });
    var pool = DISTRACTORS.filter(function (w) { return !used[w.slug]; });
    // dedupe by slug
    var seen = {}, out = [];
    pool.forEach(function (w) { if (!seen[w.slug]) { seen[w.slug] = true; out.push(w); } });
    // ערבוב דטרמיניסטי-קל (אין תלות ב-Math.random ברמת המודול)
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out.slice(0, n);
  }

  var API = {
    WORDS: WORDS,
    DISTRACTORS: DISTRACTORS,
    SENTENCES: SENTENCES,
    byLevel: byLevel,
    distractorsFor: distractorsFor,
    LEVELS: [2, 3, 4],
  };

  if (typeof window !== 'undefined') window.AvneiIsland21Sentences = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
