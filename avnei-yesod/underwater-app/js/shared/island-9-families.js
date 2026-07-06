// ============================================================================
// shared/island-9-families.js — מאגר משפחות-המילים של אי 9 (שְׂדֵה מִשְׁפְּחוֹת הָאַלְמוֹגִים)
// C9 · 6.7.2026
//
// 8 משפחות × 3 מילים. עקרונות הבחירה:
//   · אוצר מילים מוכר לגיל בלבד (לקסיקון גן/כיתה א' — feedback-child-vocab-must-be-age-familiar)
//   · שורש שקוף: שלוש אותיות-החותמת מופיעות בסדרן בכל מילה במשפחה
//     (הפדגוגיה = זיהוי דמיון בין מילים קרובות; בלי בניינים ובלי מינוח דקדוקי —
//      בשפת-ילד: "חוֹתֶמֶת הַמִּשְׁפָּחָה")
//   · ניקוד מלא + דגש קל ב-בגד-כפת בראש הברה (reference-hebrew-bgd-kpt-dagesh-rule)
//   · audio = isl9-w-*.mp3 (generate-island-09-audio.py, קול נוני ElevenLabs, QA Whisper)
//
// helpers: containsRoot / highlightRoot — התאמת תת-רצף עם נרמול אותיות סופיות.
// ============================================================================

(function () {
  'use strict';

  var FAMILIES = [
    { id: 'sfr', letters: ['ס', 'פ', 'ר'],
      words: [
        { w: 'סֵפֶר',     audio: 'isl9-w-sefer' },
        { w: 'סִפּוּר',    audio: 'isl9-w-sipur' },
        { w: 'מְסַפֵּר',   audio: 'isl9-w-mesaper' },
      ] },
    { id: 'ktv', letters: ['כ', 'ת', 'ב'],
      words: [
        { w: 'כּוֹתֵב',    audio: 'isl9-w-kotev' },
        { w: 'כּוֹתֶבֶת',  audio: 'isl9-w-kotevet' },
        { w: 'מִכְתָּב',   audio: 'isl9-w-michtav' },
      ] },
    { id: 'lmd', letters: ['ל', 'מ', 'ד'],
      words: [
        { w: 'לוֹמֵד',    audio: 'isl9-w-lomed' },
        { w: 'לוֹמֶדֶת',  audio: 'isl9-w-lomedet' },
        { w: 'תַּלְמִיד',  audio: 'isl9-w-talmid' },
      ] },
    { id: 'tzchk', letters: ['צ', 'ח', 'ק'],
      words: [
        { w: 'צוֹחֵק',    audio: 'isl9-w-tsochek' },
        { w: 'צְחוֹק',    audio: 'isl9-w-tschok' },
        { w: 'מַצְחִיק',   audio: 'isl9-w-matschik' },
      ] },
    { id: 'rkd', letters: ['ר', 'ק', 'ד'],
      words: [
        { w: 'רוֹקֵד',    audio: 'isl9-w-roked' },
        { w: 'רוֹקֶדֶת',  audio: 'isl9-w-rokedet' },
        { w: 'רִקּוּד',    audio: 'isl9-w-rikud' },
      ] },
    { id: 'shmr', letters: ['ש', 'מ', 'ר'],
      words: [
        { w: 'שׁוֹמֵר',    audio: 'isl9-w-shomer' },
        { w: 'שׁוֹמֶרֶת',  audio: 'isl9-w-shomeret' },
        { w: 'שְׁמִירָה',  audio: 'isl9-w-shmira' },
      ] },
    { id: 'gdl', letters: ['ג', 'ד', 'ל'],
      words: [
        { w: 'גָּדוֹל',    audio: 'isl9-w-gadol' },
        { w: 'גְּדוֹלָה',  audio: 'isl9-w-gdola' },
        { w: 'מִגְדָּל',   audio: 'isl9-w-migdal' },
      ] },
    { id: 'kfts', letters: ['ק', 'פ', 'צ'],
      words: [
        { w: 'קוֹפֵץ',    audio: 'isl9-w-kofets' },
        { w: 'קוֹפֶצֶת',  audio: 'isl9-w-kofetset' },
        { w: 'קְפִיצָה',   audio: 'isl9-w-kfitsa' },
      ] },
  ];

  // אות סופית → צורה רגילה (החותמת מוצגת ברגילות; ץ בסוף קוֹפֵץ עדיין נתפס)
  var FINAL_TO_REGULAR = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  function isHebLetter(c) { return c >= 'א' && c <= 'ת'; }
  function normLetter(c) { return FINAL_TO_REGULAR[c] || c; }

  // אינדקסי האותיות (בסיס, בלי ניקוד) שמרכיבות את רצף-השורש במילה — או null.
  // התאמה חמדנית משמאל-לימין על עיצורים בלבד; מספיקה לכל מילות המאגר.
  function rootIndices(word, letters) {
    var need = 0, hits = [];
    for (var i = 0; i < word.length && need < letters.length; i++) {
      var c = word[i];
      if (!isHebLetter(c)) continue;
      if (normLetter(c) === letters[need]) { hits.push(i); need++; }
    }
    return need === letters.length ? hits : null;
  }

  function containsRoot(word, letters) { return rootIndices(word, letters) !== null; }

  // HTML של המילה עם אותיות-החותמת עטופות ב-<span class="root-glow">.
  // סימני הניקוד (combining marks) נשארים צמודים לאות שלהם בתוך ה-span.
  function highlightRoot(word, letters) {
    var hits = rootIndices(word, letters);
    if (!hits) return null;
    var out = '', inSpan = false;
    for (var i = 0; i < word.length; i++) {
      var c = word[i];
      if (isHebLetter(c)) {
        if (inSpan) { out += '</span>'; inSpan = false; }
        if (hits.indexOf(i) !== -1) { out += '<span class="root-glow">'; inSpan = true; }
      }
      out += c;
    }
    if (inSpan) out += '</span>';
    return out;
  }

  window.Isl9Families = {
    FAMILIES: FAMILIES,
    containsRoot: containsRoot,
    highlightRoot: highlightRoot,
    rootIndices: rootIndices,
  };
})();
