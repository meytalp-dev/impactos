// ============================================================================
// shared/word-adapter.js — Word Adapter (אי 5 — מיזוג צירופים למילים)
// סוכן 30 · 30.5.2026
//
// מטרה:
//   להוסיף תמיכה ב-skill-unit type='word' ב-skill-units.js, ולשרת את אי 5
//   (מיזוג צירופים למילים) — שלב בו ילדה לומדת לחבר 2+ CV pairs למילה.
//   דוגמאות: בַּת · בַּיִת · אַבָּא · תַּפּוּז.
//
// 5 החלטות מיטל (30.5.2026 · orchestrator):
//   1. Vocab = מ-curriculum/vocab-bank.json בלבד. אסור להמציא.
//   2. אודיו = AvriNeural MP3 (cv-* קיים מאי 4 + word-* חדש). Web Speech = fallback.
//   3. Sub-BKT level = פר אורך-מילה (2cv / 3cv / 4cv) — לא פר מילה.
//      ISLANDS_WITH_SUB_BKT ב-bkt.js: [3, 14] → [3, 5, 14].
//   4. ב/כ/פ דגש קל חובה בתחילת הברה (זהה לכלל באי 4 — ראה
//      reference-hebrew-bgd-kpt-dagesh-rule).
//   5. stage-5-island.html = welcome buffer קצר (3 פסקאות + 2 CTAs).
//
// schema localStorage:
//   avnei-teacher-word-targets-v1 / avnei-teacher-word-freeze-v1 —
//   מקבילים ל-vowel-targets, key הוא ה-word text (canonical, עם ניקוד).
//
// API (window.AvneiWordAdapter):
//   // Words
//   getWords(level)                      → array of words (2cv / 3cv / 4cv)
//   getAllWords()                        → כל ה-65 מילים
//   getWordsByLetter(letter, level?)     → מילים שמתחילות באות הזו
//   getWordsByFirstLetters(letters[], level?)  → לסבבים של "word family"
//   getWordsForFamilySession(letter, n)  → 5 מילים מ-2/3/4 cv על האות הזו (mix)
//   getWordByKey(key)                    → lookup ע"פ key
//
//   // Decomposition + validation
//   decomposeWord(text)                  → [{letter, niqud, dagesh, isFinal}, ...]
//   countBaseLetters(text)               → מספר אותיות בסיס (ללא ניקוד)
//   stripNiqud(text)                     → טקסט ללא ניקוד
//   validateBgdkptDagesh(text)           → {ok, errors[]}
//   classifyWordLevel(text)              → '2cv' | '3cv' | '4cv' | 'other'
//   wordKey(text)                        → ASCII slug (לאודיו ו-storage)
//   wordAudioKey(text)                   → 'word-<key>'
//
//   // Weakness discovery (נגזר מ-BKT)
//   getTopWeakWords(sid, n=3, opts?)     → array of word entries
//
//   // Target/freeze (delegates to localStorage; mirrors vowel-targets)
//   addTarget(sid, text, source?)        → boolean
//   removeTarget(sid, text)              → boolean
//   getTargets(sid)                      → array of word entries
//   markFrozen(sid, text, source?)       → boolean
//   removeFrozen(sid, text)              → boolean
//   isFrozen(sid, text)                  → boolean
//   getFrozen(sid)                       → array of word entries
//
// תלות:
//   window.AvneiBKT — getWeakestLetters
//   window.AvneiVowelAdapter — לbuildCV של הצורות הפנימיות (לא חובה אבל מועיל)
//
// טסטים: scripts/test-word-adapter.js
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 22 אותיות עבריות — סדר אלפבתי קנוני (תואם bkt.js + vowel-adapter)
  // --------------------------------------------------------------------------
  const ALL_HEBREW_LETTERS_22 = Object.freeze([
    'א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
    'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת',
  ]);

  // letter → letter_key — תואם sound-/cv- conventions של אי 3+4.
  const LETTER_KEY = Object.freeze({
    'א': 'alef',  'ב': 'bet',   'ג': 'gimel', 'ד': 'dalet', 'ה': 'hey',
    'ו': 'vav',   'ז': 'zayin', 'ח': 'het',   'ט': 'tet',   'י': 'yud',
    'כ': 'kaf',   'ל': 'lamed', 'מ': 'mem',   'נ': 'nun',   'ס': 'samekh',
    'ע': 'ayin',  'פ': 'pey',   'צ': 'tzadi', 'ק': 'qof',   'ר': 'resh',
    'ש': 'shin',  'ת': 'tav',
  });

  // אותיות סופיות (final forms) → צורה רגילה.
  const FINAL_TO_REGULAR = Object.freeze({
    'ם': 'מ', 'ן': 'נ', 'ך': 'כ', 'ף': 'פ', 'ץ': 'צ',
  });
  const FINAL_LETTERS = Object.freeze(['ם', 'ן', 'ך', 'ף', 'ץ']);

  // ב/כ/פ דורשות דגש קל בתחילת הברה (זהה ל-vowel-adapter ול-checklist).
  // ראה: reference-hebrew-bgd-kpt-dagesh-rule.
  const BKP_LETTERS = Object.freeze(['ב', 'כ', 'פ']);
  const DAGESH = 'ּ';   // U+05BC HEBREW POINT DAGESH OR MAPIQ

  // Unicode ranges
  const HEBREW_LETTER_START = 0x05D0;
  const HEBREW_LETTER_END   = 0x05EA;
  const HEBREW_NIQUD_START  = 0x0591;
  const HEBREW_NIQUD_END    = 0x05C7;
  const NIQUD_REGEX = /[֑-ׇ]/g;

  // Levels — Sub-BKT buckets פר אורך-מילה.
  const ISLAND_5_WORD_LENGTHS = Object.freeze(['2cv', '3cv', '4cv']);
  const LEVEL_DISPLAY_HE = Object.freeze({
    '2cv': 'מִילִּים שֶׁל 2 אוֹתִיּוֹת',
    '3cv': 'מִילִּים שֶׁל 3 אוֹתִיּוֹת',
    '4cv': 'מִילִּים שֶׁל 4 אוֹתִיּוֹת',
  });

  // --------------------------------------------------------------------------
  // WORDS — synced with data/island-05-words/words-level-<1|2|3>.json.
  //
  // שדות פר מילה:
  //   text          — מנוקדת מלאה (עם ב/כ/פ דגש בתחילת הברה)
  //   key           — ASCII slug יציב לאודיו ול-localStorage (letter-letter-...)
  //   first_letter  — האות הראשונה (לחיבור ל-BKT sub-letter weakness)
  //   meaning_he    — תרגום פנימי קצר (לדשבורד מורה — לא לתלמיד)
  //   source        — איזה station ב-vocab-bank
  //   anchor_image  — נתיב אופציונלי לתמונה (null אם לא קיים — match-word-to-image
  //                   ייפול חזרה ל-MCQ טקסטואלי).
  //
  // הערה חשובה: רשימות אלה מכילות רק מילים שאומתו ב-vocab-bank (מטח · קסם
  // וחברים). מילים נפוצות בעברית (כמו "אַבָּא", "אִמָּא", "יָם", "גַּן") שאינן
  // מופיעות מפורשות ב-vocab-bank — לא כלולות, גם אם הן מתאימות פדגוגית.
  // ראה _handoff/2026-05-30-island-05-vocab-gaps.md לרשימת מילים חסרות שמיטל
  // צריכה לאשר כתוספת ל-vocab-bank.
  // --------------------------------------------------------------------------
  // WORDS_2CV — 19 מילים בנות 2 אותיות בסיס. סנכרון: data/island-05-words/words-level-1.json
  // 10 מילים נוספו ב-30.5.2026 לפי אישור מיטל (אופציה A) — מקור: 'vocab-bank-extended.meytal-approved-2026-05-30'.
  const WORDS_2CV = Object.freeze([
    { text: 'בַּת',  key: 'bet-tav-bat',       first_letter: 'ב', meaning_he: 'בת',  source: 'vocab-bank.book_2_station_8',                      anchor_image: null },
    { text: 'רַק',  key: 'resh-qof-rak',      first_letter: 'ר', meaning_he: 'רק',  source: 'vocab-bank.book_2_station_2',                      anchor_image: null },
    { text: 'קַר',  key: 'qof-resh-qar',      first_letter: 'ק', meaning_he: 'קר',  source: 'vocab-bank.book_2_station_2',                      anchor_image: null },
    { text: 'מַר',  key: 'mem-resh-mar',      first_letter: 'מ', meaning_he: 'מר',  source: 'vocab-bank.book_2_station_2',                      anchor_image: null },
    { text: 'יָד',  key: 'yud-dalet-yad',     first_letter: 'י', meaning_he: 'יד',  source: 'vocab-bank.book_2_station_9',                      anchor_image: null },
    { text: 'קָם',  key: 'qof-mem-qam',       first_letter: 'ק', meaning_he: 'קם',  source: 'vocab-bank.book_2_station_6',                      anchor_image: null },
    { text: 'אֵשׁ', key: 'alef-shin-esh',     first_letter: 'א', meaning_he: 'אש',  source: 'vocab-bank.book_2_station_4',                      anchor_image: null },
    { text: 'אַף',  key: 'alef-pey-af',       first_letter: 'א', meaning_he: 'אף',  source: 'vocab-bank.book_2_station_4',                      anchor_image: null },
    { text: 'כַּף', key: 'kaf-pey-kaf',       first_letter: 'כ', meaning_he: 'כף',  source: 'vocab-bank.book_4_final_phonemes',                 anchor_image: null },
    // ↓ 10 מילים נוספו ב-30.5.2026 (אישור מיטל · אופציה A)
    { text: 'יָם',  key: 'yud-mem-yam',       first_letter: 'י', meaning_he: 'ים',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'גַּן', key: 'gimel-nun-gan',     first_letter: 'ג', meaning_he: 'גן',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'אַח', key: 'alef-het-ach',       first_letter: 'א', meaning_he: 'אח',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'אָב', key: 'alef-bet-av',        first_letter: 'א', meaning_he: 'אב',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'בָּא', key: 'bet-alef-ba',       first_letter: 'ב', meaning_he: 'בא',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'חַם', key: 'het-mem-cham',       first_letter: 'ח', meaning_he: 'חם',  source: 'vocab-bank.book_2_station_2',                      anchor_image: null },
    { text: 'נֵר', key: 'nun-resh-ner',       first_letter: 'נ', meaning_he: 'נר',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'שַׁר', key: 'shin-resh-shar',    first_letter: 'ש', meaning_he: 'שר',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'גַּל', key: 'gimel-lamed-gal',   first_letter: 'ג', meaning_he: 'גל',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
    { text: 'דַּג', key: 'dalet-gimel-dag',   first_letter: 'ד', meaning_he: 'דג',  source: 'vocab-bank-extended.meytal-approved-2026-05-30',   anchor_image: null },
  ]);

  // WORDS_3CV — 30 מילים בנות 3 אותיות בסיס. סנכרון: data/island-05-words/words-level-2.json
  const WORDS_3CV = Object.freeze([
    { text: 'בָּרָק',  key: 'bet-resh-qof-barak',       first_letter: 'ב', meaning_he: 'ברק',         source: 'vocab-bank.book_2_station_2',        anchor_image: null },
    { text: 'תָּמָר',  key: 'tav-mem-resh-tamar',       first_letter: 'ת', meaning_he: 'תמר',         source: 'vocab-bank.book_2_station_2',        anchor_image: null },
    { text: 'מַטֶּה',  key: 'mem-tet-hey-mateh',        first_letter: 'מ', meaning_he: 'מטה',         source: 'vocab-bank.book_2_station_1',        anchor_image: null },
    { text: 'מָחָר',  key: 'mem-het-resh-machar',      first_letter: 'מ', meaning_he: 'מחר',         source: 'vocab-bank.book_2_station_6',        anchor_image: null },
    { text: 'תָּלָה',  key: 'tav-lamed-hey-tala',       first_letter: 'ת', meaning_he: 'תלה',         source: 'vocab-bank.book_2_station_6',        anchor_image: null },
    { text: 'קָרָה',  key: 'qof-resh-hey-qara',        first_letter: 'ק', meaning_he: 'קרה',         source: 'vocab-bank.book_2_station_6',        anchor_image: null },
    { text: 'שָׁתַק', key: 'shin-tav-qof-shatak',      first_letter: 'ש', meaning_he: 'שתק',         source: 'vocab-bank.book_2_station_6',        anchor_image: null },
    { text: 'לָקַח',  key: 'lamed-qof-het-lakach',     first_letter: 'ל', meaning_he: 'לקח',         source: 'vocab-bank.book_2_station_6',        anchor_image: null },
    { text: 'חָלַם',  key: 'het-lamed-mem-chalam',     first_letter: 'ח', meaning_he: 'חלם',         source: 'vocab-bank.book_2_station_6',        anchor_image: null },
    { text: 'חַלָּה', key: 'het-lamed-hey-chala',      first_letter: 'ח', meaning_he: 'חלה',         source: 'vocab-bank.book_2_station_8',        anchor_image: null },
    { text: 'מָחָק',  key: 'mem-het-qof-machak',       first_letter: 'מ', meaning_he: 'מחק (שם)',    source: 'vocab-bank.book_2_station_8',        anchor_image: null },
    { text: 'נָחָשׁ', key: 'nun-het-shin-nachash',     first_letter: 'נ', meaning_he: 'נחש',         source: 'vocab-bank.book_2_station_8',        anchor_image: null },
    { text: 'בָּצָל', key: 'bet-tzadi-lamed-batzal',   first_letter: 'ב', meaning_he: 'בצל',         source: 'vocab-bank.book_2_station_shva_le',  anchor_image: null },
    { text: 'מַחַק',  key: 'mem-het-qof-machak-verb',  first_letter: 'מ', meaning_he: 'מחק (פועל)',  source: 'vocab-bank.book_2_station_9',        anchor_image: null },
    { text: 'שָׁבַר', key: 'shin-bet-resh-shavar',     first_letter: 'ש', meaning_he: 'שבר',         source: 'vocab-bank.book_2_station_9',        anchor_image: null },
    { text: 'שָׁאַב', key: 'shin-alef-bet-shaav',      first_letter: 'ש', meaning_he: 'שאב',         source: 'vocab-bank.book_2_station_9',        anchor_image: null },
    { text: 'חָבַשׁ', key: 'het-bet-shin-chavash',     first_letter: 'ח', meaning_he: 'חבש',         source: 'vocab-bank.book_2_station_9',        anchor_image: null },
    { text: 'אֹהֶל',  key: 'alef-hey-lamed-ohel',      first_letter: 'א', meaning_he: 'אהל',         source: 'vocab-bank.book_2_station_4',        anchor_image: null },
    { text: 'גֶּשֶׁר', key: 'gimel-shin-resh-gesher',  first_letter: 'ג', meaning_he: 'גשר',         source: 'vocab-bank.book_3_station_shin',     anchor_image: null },
    { text: 'שָׁפָם', key: 'shin-pey-mem-safam',       first_letter: 'ש', meaning_he: 'שפם',         source: 'vocab-bank.book_3_station_sin',      anchor_image: null },
    { text: 'עָשָׁן', key: 'ayin-shin-nun-ashan',      first_letter: 'ע', meaning_he: 'עשן',         source: 'vocab-bank.book_3_station_shin',     anchor_image: null },
    { text: 'לוּל',   key: 'lamed-vav-lamed-lul',      first_letter: 'ל', meaning_he: 'לול',         source: 'vocab-bank.book_5_station_u',        anchor_image: null },
    { text: 'חוּם',   key: 'het-vav-mem-chum',         first_letter: 'ח', meaning_he: 'חום',         source: 'vocab-bank.book_5_station_u',        anchor_image: null },
    { text: 'פִּיל',  key: 'pey-yud-lamed-pil',        first_letter: 'פ', meaning_he: 'פיל',         source: 'vocab-bank.book_5_station_pi',       anchor_image: null },
    { text: 'בַּיִת',  key: 'bet-yud-tav-bayit',        first_letter: 'ב', meaning_he: 'בית',         source: 'vocab-bank.book_3_phonemes',         anchor_image: null },
    { text: 'תִּיק',  key: 'tav-yud-qof-tik',          first_letter: 'ת', meaning_he: 'תיק',         source: 'vocab-bank.book_3_station_1',        anchor_image: null },
    { text: 'דְּבַשׁ', key: 'dalet-bet-shin-dvash',    first_letter: 'ד', meaning_he: 'דבש',         source: 'vocab-bank.book_5_station_10',       anchor_image: null },
    { text: 'סֻכָּה', key: 'samekh-kaf-hey-sukka',     first_letter: 'ס', meaning_he: 'סוכה',        source: 'vocab-bank.book_5_station_qubutz',   anchor_image: null },
    { text: 'סֻלָּם', key: 'samekh-lamed-mem-sulam',   first_letter: 'ס', meaning_he: 'סולם',        source: 'vocab-bank.book_5_station_qubutz',   anchor_image: null },
    { text: 'גָּמָל',  key: 'gimel-mem-lamed-gamal',   first_letter: 'ג', meaning_he: 'גמל',         source: 'vocab-bank.book_4_final_phonemes',   anchor_image: null },
  ]);

  // WORDS_4CV — 12 מילים בנות 4 אותיות בסיס. סנכרון: data/island-05-words/words-level-3.json
  // מַחְשֵׁב נוסף ב-30.5.2026 (אישור מיטל · אופציה A).
  // מִכְתָּב נוסף ב-31.5.2026 (אישור מיטל · B1-mini). 3 קנדידטים אחרים (צִינוֹר/תְּמוּנָה/חֲנֻכִּיָּה) = 5 אותיות → post-pilot L4.
  const WORDS_4CV = Object.freeze([
    { text: 'תַּפּוּז',  key: 'tav-pey-vav-zayin-tapuz',   first_letter: 'ת', meaning_he: 'תפוז',  source: 'vocab-bank.book_2_station_1',        anchor_image: null },
    { text: 'מַתָּנָה', key: 'mem-tav-nun-hey-matana',     first_letter: 'מ', meaning_he: 'מתנה',  source: 'vocab-bank.book_2_station_8',        anchor_image: null },
    { text: 'אֶצְבַּע', key: 'alef-tzadi-bet-ayin-etzba',  first_letter: 'א', meaning_he: 'אצבע',  source: 'vocab-bank.book_2_station_4',        anchor_image: null },
    { text: 'בְּרֵכָה', key: 'bet-resh-kaf-hey-breicha',   first_letter: 'ב', meaning_he: 'בריכה', source: 'vocab-bank.book_2_station_10',       anchor_image: null },
    { text: 'יוֹנָה',   key: 'yud-vav-nun-hey-yona',       first_letter: 'י', meaning_he: 'יונה',  source: 'vocab-bank.book_3_phonemes',         anchor_image: null },
    { text: 'נֵרוֹת',   key: 'nun-resh-vav-tav-nerot',     first_letter: 'נ', meaning_he: 'נרות',  source: 'vocab-bank.book_4_final_phonemes',   anchor_image: null },
    { text: 'תַּפּוּחַ', key: 'tav-pey-vav-het-tapuach',   first_letter: 'ת', meaning_he: 'תפוח',  source: 'vocab-bank.book_5_station_pu',       anchor_image: null },
    { text: 'אַרְנָק',  key: 'alef-resh-nun-qof-arnak',    first_letter: 'א', meaning_he: 'ארנק',  source: 'vocab-bank.book_4_final_phonemes',   anchor_image: null },
    { text: 'שָׁעוֹן',  key: 'shin-ayin-vav-nun-shaon',    first_letter: 'ש', meaning_he: 'שעון',  source: 'vocab-bank.book_3_station_sin',      anchor_image: null },
    { text: 'בָּלוֹן',  key: 'bet-lamed-vav-nun-balon',    first_letter: 'ב', meaning_he: 'בלון',  source: 'vocab-bank.book_2_station_shva_le',  anchor_image: null },
    // ↓ נוסף ב-30.5.2026 (אישור מיטל · אופציה A)
    { text: 'מַחְשֵׁב', key: 'mem-het-shin-bet-machshev',  first_letter: 'מ', meaning_he: 'מחשב',  source: 'vocab-bank.book_3_station_sin',      anchor_image: null },
    // ↓ נוסף ב-31.5.2026 (אישור מיטל · B1-mini · סוכן השלמת אי 5)
    { text: 'מִכְתָּב', key: 'mem-kaf-tav-bet-michtav',    first_letter: 'מ', meaning_he: 'מכתב',  source: 'vocab-bank.book_3_station_10_real_vs_invented', anchor_image: null },
  ]);

  const WORDS_BY_LEVEL = Object.freeze({
    '2cv': WORDS_2CV,
    '3cv': WORDS_3CV,
    '4cv': WORDS_4CV,
  });

  // Build lookup by key (must be unique across all levels — verified by test)
  const _WORDS_BY_KEY = (function () {
    const out = {};
    [WORDS_2CV, WORDS_3CV, WORDS_4CV].forEach(function (level) {
      level.forEach(function (w) { out[w.key] = w; });
    });
    return Object.freeze(out);
  })();

  // Build lookup by text (canonical with niqud)
  const _WORDS_BY_TEXT = (function () {
    const out = {};
    [WORDS_2CV, WORDS_3CV, WORDS_4CV].forEach(function (level) {
      level.forEach(function (w) { out[w.text] = w; });
    });
    return Object.freeze(out);
  })();

  // --------------------------------------------------------------------------
  // localStorage keys + helpers (zhe ke-vowel-adapter)
  // --------------------------------------------------------------------------
  const TARGETS_KEY = 'avnei-teacher-word-targets-v1';
  const FREEZE_KEY  = 'avnei-teacher-word-freeze-v1';

  const DAY_MS = 24 * 60 * 60 * 1000;
  const TARGET_DURATION_DAYS = 14;
  const FREEZE_DURATION_DAYS = 3;

  function _getLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof global !== 'undefined' && global.localStorage) return global.localStorage;
    return null;
  }
  function _load(key) {
    const ls = _getLocalStorage();
    if (!ls) return {};
    try {
      const raw = ls.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
  }
  function _save(key, data) {
    const ls = _getLocalStorage();
    if (!ls) return false;
    try { ls.setItem(key, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }
  function _nowIso() { return (new Date()).toISOString(); }
  function _isExpired(entry, nowTs) {
    if (!entry || !entry.expiresAt) return false;
    const exp = Date.parse(entry.expiresAt);
    if (isNaN(exp)) return false;
    const t = (typeof nowTs === 'number') ? nowTs : Date.now();
    return exp <= t;
  }
  function _activeEntries(byKey, nowTs) {
    const out = {};
    if (!byKey || typeof byKey !== 'object') return out;
    Object.keys(byKey).forEach(function (k) {
      const entry = byKey[k];
      if (entry && !_isExpired(entry, nowTs)) out[k] = entry;
    });
    return out;
  }
  function _getBKT() {
    if (typeof window !== 'undefined' && window.AvneiBKT) return window.AvneiBKT;
    if (typeof global !== 'undefined' && global.AvneiBKT) return global.AvneiBKT;
    return null;
  }

  // --------------------------------------------------------------------------
  // Decomposition — מפרק מילה ל-base letters + niqud + dagesh.
  //
  // decomposeWord('בַּיִת') → [
  //   { letter: 'ב', niqud: 'ַ', dagesh: true,  isFinal: false },
  //   { letter: 'י', niqud: 'ִ', dagesh: false, isFinal: false },
  //   { letter: 'ת', niqud: '',  dagesh: false, isFinal: false },
  // ]
  // --------------------------------------------------------------------------
  function _isHebrewLetter(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    return code >= HEBREW_LETTER_START && code <= HEBREW_LETTER_END;
  }
  function _isCombining(ch) {
    if (!ch) return false;
    const code = ch.charCodeAt(0);
    return code >= HEBREW_NIQUD_START && code <= HEBREW_NIQUD_END;
  }

  function decomposeWord(text) {
    if (typeof text !== 'string' || text.length === 0) return [];
    const out = [];
    let current = null;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (_isHebrewLetter(ch)) {
        if (current) out.push(current);
        current = {
          letter: ch,
          niqud: '',
          dagesh: false,
          isFinal: FINAL_LETTERS.indexOf(ch) >= 0,
        };
      } else if (ch === DAGESH) {
        if (current) current.dagesh = true;
      } else if (_isCombining(ch)) {
        if (current) current.niqud += ch;
      }
      // skip non-Hebrew, non-niqud chars
    }
    if (current) out.push(current);
    return out;
  }

  function stripNiqud(text) {
    if (typeof text !== 'string') return '';
    return text.replace(NIQUD_REGEX, '');
  }

  function countBaseLetters(text) {
    return stripNiqud(text).length;
  }

  function classifyWordLevel(text) {
    const n = countBaseLetters(text);
    if (n === 2) return '2cv';
    if (n === 3) return '3cv';
    if (n === 4) return '4cv';
    return 'other';
  }

  // wordKey — fallback אם אין explicit key בדאטה. ASCII slug של letter-keys.
  function wordKey(text) {
    const decomp = decomposeWord(text);
    if (decomp.length === 0) return '';
    return decomp.map(function (d) {
      const base = FINAL_TO_REGULAR[d.letter] || d.letter;
      return LETTER_KEY[base] || base;
    }).join('-');
  }

  function wordAudioKey(text) {
    // אם המילה רשומה — להחזיר key פנימי. אחרת לחשב מ-wordKey.
    const w = _WORDS_BY_TEXT[text];
    if (w && w.key) return 'word-' + w.key;
    const k = wordKey(text);
    return k ? 'word-' + k : '';
  }

  // --------------------------------------------------------------------------
  // ב/כ/פ דגש validation — נדרש בכל ב/כ/פ בתחילת הברה (בעיקר בראש מילה).
  // ראה: reference-hebrew-bgd-kpt-dagesh-rule.
  //
  // ב-MVP אנו מוודאים רק את האות הראשונה של המילה (תחילת מילה = תחילת
  // הברה תמיד). dagesh באמצע מילה נדרש רק אחרי שווא נח — דורש parser
  // מורכב יותר; ניתן להוסיף ב-V2.
  // --------------------------------------------------------------------------
  function validateBgdkptDagesh(text) {
    const errors = [];
    const decomp = decomposeWord(text);
    if (decomp.length === 0) {
      return { ok: false, errors: ['מילה ריקה'] };
    }
    const first = decomp[0];
    if (BKP_LETTERS.indexOf(first.letter) >= 0 && !first.dagesh) {
      errors.push(
        'ב/כ/פ בתחילת מילה ללא דגש קל: "' + first.letter + '" ב-"' + text +
        '" — AvriNeural יבטא /v·x·f/ במקום /b·k·p/.'
      );
    }
    return { ok: errors.length === 0, errors: errors };
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------
  function getWords(level) {
    if (!WORDS_BY_LEVEL[level]) return [];
    return WORDS_BY_LEVEL[level].slice();
  }

  function getAllWords() {
    return WORDS_2CV.concat(WORDS_3CV).concat(WORDS_4CV);
  }

  function getWordByKey(key) {
    return _WORDS_BY_KEY[key] || null;
  }

  function getWordByText(text) {
    return _WORDS_BY_TEXT[text] || null;
  }

  function getWordsByLetter(letter, level) {
    if (!letter || ALL_HEBREW_LETTERS_22.indexOf(letter) < 0) return [];
    const pool = level ? getWords(level) : getAllWords();
    return pool.filter(function (w) { return w.first_letter === letter; });
  }

  function getWordsByFirstLetters(letters, level) {
    if (!Array.isArray(letters) || letters.length === 0) return [];
    const pool = level ? getWords(level) : getAllWords();
    return pool.filter(function (w) { return letters.indexOf(w.first_letter) >= 0; });
  }

  // getWordsForFamilySession — בוחר n מילים מאותה first_letter (mix של 2/3/4 cv).
  // בא לתמיכה ב-stage-5-word-merge.html: 5 סבבים על אותה word family.
  // ב-MVP: מעדיף לפזר רמות (קודם 2cv, אחר כך 3cv, ולבסוף 4cv) — progression טבעי.
  function getWordsForFamilySession(letter, n) {
    const limit = (typeof n === 'number' && n > 0) ? n : 5;
    if (!letter) return [];
    const out = [];
    ISLAND_5_WORD_LENGTHS.forEach(function (lvl) {
      getWordsByLetter(letter, lvl).forEach(function (w) {
        if (out.length < limit) out.push(Object.assign({ level: lvl }, w));
      });
    });
    return out;
  }

  // --------------------------------------------------------------------------
  // Weakness discovery — נגזר מ-BKT (חלשות אותיות → מילים שמתחילות בהן).
  // למצב Sub-BKT פר אורך-מילה: ראה bkt.js · ingestIsland5Event.
  // --------------------------------------------------------------------------
  function getTopWeakWords(sid, n, opts) {
    const limit = (typeof n === 'number' && n > 0) ? n : 3;
    if (!sid) return [];
    const options = opts || {};
    const level = options.level || null;

    const BKT = _getBKT();
    if (!BKT || typeof BKT.getWeakestLetters !== 'function') return [];

    let weakest;
    try {
      weakest = BKT.getWeakestLetters(sid, limit * 2);
    } catch (e) { weakest = []; }

    if (!Array.isArray(weakest) || weakest.length === 0) return [];

    const out = [];
    for (let i = 0; i < weakest.length && out.length < limit; i++) {
      const letter = weakest[i] && weakest[i].letter;
      if (!letter) continue;
      const candidates = getWordsByLetter(letter, level);
      for (let j = 0; j < candidates.length && out.length < limit; j++) {
        const w = candidates[j];
        if (isFrozen(sid, w.text)) continue;
        const entry = Object.assign({}, w, {
          source_letter_pKnown: weakest[i].pKnown,
        });
        out.push(entry);
      }
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // Targets — "שלחי לתרגול אישי"
  // --------------------------------------------------------------------------
  function _validText(text) {
    return typeof text === 'string' && text.length > 0;
  }

  function addTarget(sid, text, source) {
    if (!sid || !_validText(text)) return false;
    const all = _load(TARGETS_KEY);
    if (!all[sid]) all[sid] = {};
    const now = Date.now();
    all[sid][text] = {
      addedAt: _nowIso(),
      expiresAt: (new Date(now + TARGET_DURATION_DAYS * DAY_MS)).toISOString(),
      source: source || 'teacher-send',
    };
    if (!_save(TARGETS_KEY, all)) return false;
    markFrozen(sid, text, 'auto-from-target');
    return true;
  }

  function removeTarget(sid, text) {
    if (!sid || !_validText(text)) return false;
    const all = _load(TARGETS_KEY);
    if (!all[sid] || !all[sid][text]) return false;
    delete all[sid][text];
    if (Object.keys(all[sid]).length === 0) delete all[sid];
    return _save(TARGETS_KEY, all);
  }

  function getTargets(sid) {
    if (!sid) return [];
    const all = _load(TARGETS_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active).map(function (text) {
      const w = _WORDS_BY_TEXT[text];
      return {
        text: text,
        key: w ? w.key : wordKey(text),
        first_letter: w ? w.first_letter : (decomposeWord(text)[0] || {}).letter,
        level: w ? classifyWordLevel(text) : classifyWordLevel(text),
        addedAt: active[text].addedAt,
        expiresAt: active[text].expiresAt,
        source: active[text].source,
      };
    });
  }

  // --------------------------------------------------------------------------
  // Freeze — "טיפלתי בכיתה"
  // --------------------------------------------------------------------------
  function markFrozen(sid, text, source) {
    if (!sid || !_validText(text)) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid]) all[sid] = {};
    const now = Date.now();
    all[sid][text] = {
      frozenAt: _nowIso(),
      expiresAt: (new Date(now + FREEZE_DURATION_DAYS * DAY_MS)).toISOString(),
      source: source || 'teacher-handled',
    };
    return _save(FREEZE_KEY, all);
  }

  function removeFrozen(sid, text) {
    if (!sid || !_validText(text)) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid] || !all[sid][text]) return false;
    delete all[sid][text];
    if (Object.keys(all[sid]).length === 0) delete all[sid];
    return _save(FREEZE_KEY, all);
  }

  function isFrozen(sid, text) {
    if (!sid || !_validText(text)) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid] || !all[sid][text]) return false;
    return !_isExpired(all[sid][text], Date.now());
  }

  function getFrozen(sid) {
    if (!sid) return [];
    const all = _load(FREEZE_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active).map(function (text) {
      const w = _WORDS_BY_TEXT[text];
      return {
        text: text,
        key: w ? w.key : wordKey(text),
        first_letter: w ? w.first_letter : (decomposeWord(text)[0] || {}).letter,
        level: classifyWordLevel(text),
        frozenAt: active[text].frozenAt,
        expiresAt: active[text].expiresAt,
        source: active[text].source,
      };
    });
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------
  const API = {
    // Decomposition + validation
    decomposeWord: decomposeWord,
    stripNiqud: stripNiqud,
    countBaseLetters: countBaseLetters,
    classifyWordLevel: classifyWordLevel,
    validateBgdkptDagesh: validateBgdkptDagesh,
    wordKey: wordKey,
    wordAudioKey: wordAudioKey,

    // Words
    getWords: getWords,
    getAllWords: getAllWords,
    getWordByKey: getWordByKey,
    getWordByText: getWordByText,
    getWordsByLetter: getWordsByLetter,
    getWordsByFirstLetters: getWordsByFirstLetters,
    getWordsForFamilySession: getWordsForFamilySession,

    // Weakness
    getTopWeakWords: getTopWeakWords,

    // Targets
    addTarget: addTarget,
    removeTarget: removeTarget,
    getTargets: getTargets,

    // Freeze
    markFrozen: markFrozen,
    removeFrozen: removeFrozen,
    isFrozen: isFrozen,
    getFrozen: getFrozen,

    // Constants
    ALL_HEBREW_LETTERS_22: ALL_HEBREW_LETTERS_22,
    LETTER_KEY: LETTER_KEY,
    FINAL_TO_REGULAR: FINAL_TO_REGULAR,
    FINAL_LETTERS: FINAL_LETTERS,
    BKP_LETTERS: BKP_LETTERS,
    DAGESH: DAGESH,
    ISLAND_5_WORD_LENGTHS: ISLAND_5_WORD_LENGTHS,
    LEVEL_DISPLAY_HE: LEVEL_DISPLAY_HE,
    TARGETS_KEY: TARGETS_KEY,
    FREEZE_KEY: FREEZE_KEY,
    TARGET_DURATION_DAYS: TARGET_DURATION_DAYS,
    FREEZE_DURATION_DAYS: FREEZE_DURATION_DAYS,
  };

  if (typeof window !== 'undefined') {
    window.AvneiWordAdapter = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
