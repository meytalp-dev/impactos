// ============================================================================
// shared/vowel-adapter.js — Vowel + CV Pair Adapter (אי 4 — אות-ניקוד-צליל)
// סוכן 29 · 29.5.2026
//
// מטרה:
//   להוסיף תמיכה ב-skill-unit type='vowel' ב-skill-units.js, ולשרת את אי 4
//   (אות-ניקוד-צליל) — שלב בו ילדה לומדת לחבר אות + ניקוד = צליל-של-תחילת-מילה.
//
// הוראת תזמורת (מיטל · 29.5.2026):
//   • Sub-BKT = פר אות בלבד (לא פר CV pair, לא פר vowel). 22 BKT states, נקודה.
//   • לפיכך: getTopWeakCVs נגזר מ-getWeakestLetters של bkt.js + ה-vowels הפעילים.
//   • אסור להוסיף שכבת BKT חדשה.
//
// 7 ה-vowels (פר רצף מטח · vocab-bank.complete_niqqud_sequence):
//   קמץ · פתח · שווא · חיריק · חולם · צירי · סגול
//   (vowels של MOY task_5 — קריאת 45 צירופים מנוקדים)
//
// schema localStorage:
//   avnei-teacher-vowel-targets-v1 / avnei-teacher-vowel-freeze-v1 —
//   מקבילים ל-letter-targets, אבל הקלט הוא "letter:vowel" (canonical pair).
//
// API (window.AvneiVowelAdapter):
//   // Vowels
//   getVowels()                          → array of vowel objects
//   getVowelById(id)                     → vowel object | null
//
//   // CV pair construction + display
//   buildCV(letter, vowelId)             → string CV (e.g., "מַ")
//   parseCV(cvKey)                       → { letter, vowelId } | null
//   cvKey(letter, vowelId)               → canonical "letter:vowelId"
//   getAllCVPairs(opts?)                 → 154 entries (or filtered)
//
//   // Anchor words (lookup ב-vocab-bank; ב-MVP — manual seeds)
//   getAnchorWord(letter, vowelId)       → string | null
//
//   // Weakness discovery
//   getTopWeakCVs(sid, n=3, opts?)       → array of CV entries
//
//   // Target/freeze (delegates to localStorage; mirrors letter-targets)
//   addTarget(sid, letter, vowelId, source?)    → boolean
//   removeTarget(sid, letter, vowelId)          → boolean
//   getTargets(sid)                             → array of CV entries
//   markFrozen(sid, letter, vowelId, source?)   → boolean
//   removeFrozen(sid, letter, vowelId)          → boolean
//   isFrozen(sid, letter, vowelId)              → boolean
//   getFrozen(sid)                              → array of CV entries
//
// תלות:
//   window.AvneiBKT — לחשיפת אותיות חלשות (getWeakestLetters)
//   localStorage    — לטרגטים/הקפאה
//
// טסטים: scripts/test-vowel-adapter.js
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 7 ה-Vowels
  //
  // הערה על Unicode:
  //   ניקוד הוא combining marks שמופיעים _אחרי_ האות (visual under/around).
  //   חולם החסר (U+05B9) ושורוק עם וי"ו (חולם מלא U+05B9 עם ו) — ב-MVP אנו
  //   משתמשים בצורת ה-CHASER (combining ABOVE) שעובדת על כל אות.
  // --------------------------------------------------------------------------
  // phoneme_group — קבוצת צליל (חשוב פדגוגית!).
  // מטח מלמדים vowels באותה קבוצת צליל ביחד כיחידה אחת:
  //   /a/ = קמץ + פתח (חוברת 2 שיעורים 1-9)
  //   /e/ = צירי + סגול (חוברת 4 שיעורים 7-12)
  //   /u/ = קובוץ + שורוק (חוברת 5 — post-MVP)
  // מקור: vocab-bank.complete_niqqud_sequence + bootstrap "רצף ניקוד מומלץ".
  const VOWELS = Object.freeze([
    { id: 'kamatz',  displayHe: 'קמץ',  symbol: 'ָ', phoneme: '/a/', phoneme_group: 'a',    book: 2 },
    { id: 'patach',  displayHe: 'פתח',  symbol: 'ַ', phoneme: '/a/', phoneme_group: 'a',    book: 2 },
    { id: 'shva',    displayHe: 'שווא', symbol: 'ְ', phoneme: '/ə/ או שתיקה', phoneme_group: 'shwa', book: 2 },
    { id: 'hiriq',   displayHe: 'חיריק', symbol: 'ִ', phoneme: '/i/', phoneme_group: 'i',    book: 3 },
    { id: 'holam',   displayHe: 'חולם', symbol: 'ֹ', phoneme: '/o/', phoneme_group: 'o',    book: 4 },
    { id: 'tzere',   displayHe: 'צירי', symbol: 'ֵ', phoneme: '/e/', phoneme_group: 'e',    book: 4 },
    { id: 'segol',   displayHe: 'סגול', symbol: 'ֶ', phoneme: '/e/', phoneme_group: 'e',    book: 4 },
  ]);

  // PHONEME_GROUP_HE — תיוג עברי לקבוצת הצליל (למסך מורה ולמסך תלמיד.ה).
  const PHONEME_GROUP_HE = Object.freeze({
    'a':    'פתח-קמץ',
    'e':    'צירי-סגול',
    'i':    'חיריק',
    'o':    'חולם',
    'shwa': 'שווא',
  });

  const VOWELS_BY_ID = Object.freeze(VOWELS.reduce(function (acc, v) {
    acc[v.id] = v;
    return acc;
  }, {}));

  // 22 אותיות עברית — סדר אלפבתי קנוני (תואם bkt.js ALL_HEBREW_LETTERS_22)
  const ALL_HEBREW_LETTERS_22 = Object.freeze([
    'א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
    'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת',
  ]);

  // ב/כ/פ דורשות דגש קל ב-CV של תחילת הברה (אחרת נשמעות /v·x·f/ זהה ל-ו·ך·ף).
  // ראה: reference-hebrew-bgd-kpt-dagesh-rule. נוסף 30.5.2026 (אחרי finding מיטל).
  // ג·ד·ת היסטוריות הקלות בכ"ב — בעברית מודרנית לא נשמעות שונות, אין צורך בדגש לאבחנה.
  const BKP_LETTERS = Object.freeze(['ב', 'כ', 'פ']);
  const DAGESH = 'ּ';   // HEBREW POINT DAGESH OR MAPIQ (ּ)

  // letter → letter_key — תואם sound-<key>.mp3 הקיים באי 3 +
  // cv-<key>-<vowel>.mp3 שנוצר באי 4 (generate-island-04-cv-audio.py).
  const LETTER_KEY = Object.freeze({
    'א': 'alef',  'ב': 'bet',   'ג': 'gimel', 'ד': 'dalet', 'ה': 'hey',
    'ו': 'vav',   'ז': 'zayin', 'ח': 'het',   'ט': 'tet',   'י': 'yud',
    'כ': 'kaf',   'ל': 'lamed', 'מ': 'mem',   'נ': 'nun',   'ס': 'samekh',
    'ע': 'ayin',  'פ': 'pey',   'צ': 'tzadi', 'ק': 'qof',   'ר': 'resh',
    'ש': 'shin',  'ת': 'tav',
  });

  // localStorage keys
  const TARGETS_KEY = 'avnei-teacher-vowel-targets-v1';
  const FREEZE_KEY  = 'avnei-teacher-vowel-freeze-v1';

  // TTLs (תואם letter-targets — להמשכיות UX למורה)
  const DAY_MS = 24 * 60 * 60 * 1000;
  const TARGET_DURATION_DAYS = 14;
  const FREEZE_DURATION_DAYS = 3;

  // --------------------------------------------------------------------------
  // Anchor words — seed מינימלי. ערכים נוספים יתווספו מ-vocab-bank ע"י Meytal.
  // הקלידה: letter + vowelId → מילה שמתחילה ב-CV. null = חסר (לבקש ממיטל).
  //
  // מקור הזרעים: vocab-bank.json (book_2_station_* + book_3_station_*).
  // --------------------------------------------------------------------------
  const ANCHOR_WORDS = Object.freeze({
    // מ
    'מ:kamatz':  'מָחָר',     // tomorrow (book_2_station_6)
    'מ:patach':  'מַטֶּה',    // staff (book_2_station_1)
    'מ:shva':    null,         // שווא בראש מילה — נדיר; ASK
    'מ:hiriq':   'מִכְנָסַיִם', // pants (book_3_station_1)
    'מ:holam':   null,         // ASK
    'מ:tzere':   null,         // ASK
    'מ:segol':   'מֶלֶךְ',     // king (סטנדרטי)

    // ב
    'ב:kamatz':  'בָּרָק',     // book_2_station_2
    'ב:patach':  'בַּת',       // daughter (book_2_station_9)
    'ב:shva':    'בְּרֵכָה',   // pool (book_2_station_10)
    'ב:hiriq':   null,         // ASK
    'ב:holam':   null,         // ASK
    'ב:tzere':   'בֵּיצָה',    // egg (book_2_station_10 — "ביצה")
    'ב:segol':   null,         // ASK

    // ר
    'ר:kamatz':  null,         // ASK
    'ר:patach':  'רַק',        // only (book_2_station_2)
    'ר:shva':    null,         // ASK
    'ר:hiriq':   null,         // ASK
    'ר:holam':   null,         // ASK
    'ר:tzere':   null,         // ASK
    'ר:segol':   null,         // ASK

    // ק
    'ק:kamatz':  null,         // ASK
    'ק:patach':  'קַר',        // cold (book_2_station_2)
    'ק:shva':    'קְפִיץ',     // spring (book_2_station_10)
    'ק:hiriq':   null,         // ASK
    'ק:holam':   null,         // ASK
    'ק:tzere':   null,         // ASK
    'ק:segol':   null,         // ASK

    // ת
    'ת:kamatz':  'תָּמָר',     // name/fruit (book_2_station_2)
    'ת:patach':  'תַּפּוּז',   // orange (book_2_station_1)
    'ת:shva':    'תְּרוּפָה',  // medicine (book_2_station_10)
    'ת:hiriq':   'תִּיק',      // bag (book_3_station_1)
    'ת:holam':   null,         // ASK
    'ת:tzere':   null,         // ASK
    'ת:segol':   null,         // ASK
  });

  // --------------------------------------------------------------------------
  // Storage helpers (מקבילים ל-letter-targets.js)
  // --------------------------------------------------------------------------
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
  // Vowels
  // --------------------------------------------------------------------------
  function getVowels() {
    return VOWELS.slice();
  }

  function getVowelById(id) {
    return VOWELS_BY_ID[id] || null;
  }

  // getPhonemeGroup(vowelId) → 'a' | 'e' | 'i' | 'o' | 'shwa' | null
  function getPhonemeGroup(vowelId) {
    const v = VOWELS_BY_ID[vowelId];
    return v ? v.phoneme_group : null;
  }

  // getVowelsInGroup('a') → [{kamatz}, {patach}]
  function getVowelsInGroup(group) {
    return VOWELS.filter(function (v) { return v.phoneme_group === group; });
  }

  // getSisterVowels(vowelId) → vowels באותה קבוצת צליל, לא כולל את עצמו.
  // לדוגמה: getSisterVowels('patach') → [kamatz]. ל-hiriq → [].
  function getSisterVowels(vowelId) {
    const group = getPhonemeGroup(vowelId);
    if (!group) return [];
    return VOWELS.filter(function (v) {
      return v.phoneme_group === group && v.id !== vowelId;
    });
  }

  // --------------------------------------------------------------------------
  // CV pair construction
  //
  // buildCV('מ', 'patach') → 'מַ'   (letter + combining niqud)
  // parseCV('מ:patach')   → { letter:'מ', vowelId:'patach' }
  // cvKey('מ', 'patach')  → 'מ:patach'
  // --------------------------------------------------------------------------
  function buildCV(letter, vowelId) {
    if (!letter || !ALL_HEBREW_LETTERS_22.includes(letter)) return '';
    const v = VOWELS_BY_ID[vowelId];
    if (!v) return '';
    // ב/כ/פ בתחילת CV → תמיד עם דגש קל (אחרת AvriNeural ו-קוראים מבטאים /v·x·f/).
    // Unicode order: letter + vowel + dagesh (5d1 5b7 5bc) — תואם input methods טיפוסיים
    // ולקריאת AvriNeural. החריג היחיד הוא שווא נח באמצע מילה — לא רלוונטי ב-CV pair בודד.
    if (BKP_LETTERS.includes(letter)) {
      return letter + v.symbol + DAGESH;
    }
    return letter + v.symbol;
  }

  function cvKey(letter, vowelId) {
    if (!letter || !vowelId) return '';
    return letter + ':' + vowelId;
  }

  // cvAudioKey('מ', 'patach') → 'cv-mem-patach'
  // משמש את mechanic-tap-cv להשמעת MP3 דרך AvneiAudio.play().
  function cvAudioKey(letter, vowelId) {
    const lk = LETTER_KEY[letter];
    if (!lk) return null;
    if (!VOWELS_BY_ID[vowelId]) return null;
    return 'cv-' + lk + '-' + vowelId;
  }

  // letterKey('מ') → 'mem'
  function letterKey(letter) {
    return LETTER_KEY[letter] || null;
  }

  function parseCV(key) {
    if (typeof key !== 'string' || key.indexOf(':') < 0) return null;
    const parts = key.split(':');
    if (parts.length !== 2) return null;
    const letter = parts[0];
    const vowelId = parts[1];
    if (!ALL_HEBREW_LETTERS_22.includes(letter)) return null;
    if (!VOWELS_BY_ID[vowelId]) return null;
    return { letter: letter, vowelId: vowelId };
  }

  // getAllCVPairs(opts):
  //   opts.letters  → רק אותיות אלה (default: כל 22)
  //   opts.vowels   → רק vowels אלה (default: כל 7)
  //   opts.books    → רק vowels של ספרי לימוד אלה (סבון מחושב מעל)
  // החזרה: array של { letter, vowelId, cv, key, anchor_word }.
  function getAllCVPairs(opts) {
    const options = opts || {};
    const letters = Array.isArray(options.letters) ? options.letters : ALL_HEBREW_LETTERS_22;
    let vowels = Array.isArray(options.vowels) ? options.vowels : VOWELS.map(function (v) { return v.id; });
    if (Array.isArray(options.books)) {
      const allowedBooks = options.books;
      vowels = vowels.filter(function (vid) {
        const v = VOWELS_BY_ID[vid];
        return v && allowedBooks.indexOf(v.book) >= 0;
      });
    }
    const out = [];
    letters.forEach(function (letter) {
      if (!ALL_HEBREW_LETTERS_22.includes(letter)) return;
      vowels.forEach(function (vowelId) {
        const v = VOWELS_BY_ID[vowelId];
        if (!v) return;
        out.push({
          letter: letter,
          vowelId: vowelId,
          cv: buildCV(letter, vowelId),
          key: cvKey(letter, vowelId),
          anchor_word: getAnchorWord(letter, vowelId),
        });
      });
    });
    return out;
  }

  // --------------------------------------------------------------------------
  // Anchor words
  // --------------------------------------------------------------------------
  function getAnchorWord(letter, vowelId) {
    const k = cvKey(letter, vowelId);
    const seeded = ANCHOR_WORDS[k];
    return (typeof seeded === 'string' && seeded.length > 0) ? seeded : null;
  }

  // getAllAnchorWords() → [{ letter, vowelId, word, cv, phonemeGroup, audioKey }]
  // משמש את match-cv-to-word לבחירת targets + distractors.
  function getAllAnchorWords() {
    const out = [];
    Object.keys(ANCHOR_WORDS).forEach(function (k) {
      const word = ANCHOR_WORDS[k];
      if (!word) return;
      const parsed = parseCV(k);
      if (!parsed) return;
      out.push({
        letter: parsed.letter,
        vowelId: parsed.vowelId,
        word: word,
        cv: buildCV(parsed.letter, parsed.vowelId),
        phonemeGroup: getPhonemeGroup(parsed.vowelId),
        audioKey: 'word-' + (LETTER_KEY[parsed.letter] || '') + '-' + parsed.vowelId,
      });
    });
    return out;
  }

  // getAnchorWordsForPhonemeGroup(letter, group) → anchor words על האות הזו +
  // vowels באותה phoneme group. למשל (מ, 'a') → [מָחָר, מַטֶּה].
  function getAnchorWordsForPhonemeGroup(letter, group) {
    const all = getAllAnchorWords();
    return all.filter(function (w) {
      return w.letter === letter && w.phonemeGroup === group;
    });
  }

  // wordAudioKey(letter, vowelId) → 'word-<letter_key>-<vowel_id>'
  function wordAudioKey(letter, vowelId) {
    const lk = LETTER_KEY[letter];
    if (!lk) return null;
    if (!VOWELS_BY_ID[vowelId]) return null;
    return 'word-' + lk + '-' + vowelId;
  }

  // --------------------------------------------------------------------------
  // Weakness discovery — נגזר מ-BKT (לא BKT עצמאי)
  //
  // הלוגיקה:
  //   1. שאל את BKT מי האותיות החלשות (top N*2 לבחירה).
  //   2. הכפל כל אות ב-vowels הפעילים (default: כל 7; אפשרי לסנן לפי books).
  //   3. חתוך ל-N תוצאות.
  //   4. סנן CV pairs שב-frozen.
  //
  // ב-MVP, "vowels פעילים" = כל 7. בעתיד יקבל פאק חודשי (לדוגמה נובמבר=קמץ+פתח).
  // --------------------------------------------------------------------------
  function getTopWeakCVs(sid, n, opts) {
    const limit = (typeof n === 'number' && n > 0) ? n : 3;
    if (!sid) return [];

    const options = opts || {};
    const vowelIds = Array.isArray(options.vowels) && options.vowels.length > 0
      ? options.vowels.filter(function (vid) { return !!VOWELS_BY_ID[vid]; })
      : VOWELS.map(function (v) { return v.id; });

    if (vowelIds.length === 0) return [];

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
      if (!letter || !ALL_HEBREW_LETTERS_22.includes(letter)) continue;
      for (let j = 0; j < vowelIds.length && out.length < limit; j++) {
        const vid = vowelIds[j];
        if (isFrozen(sid, letter, vid)) continue;
        out.push({
          letter: letter,
          vowelId: vid,
          cv: buildCV(letter, vid),
          key: cvKey(letter, vid),
          anchor_word: getAnchorWord(letter, vid),
          source_letter_pKnown: weakest[i].pKnown,
        });
      }
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // Targets — "שלחי לתרגול אישי" (מקביל ל-letter-targets)
  // --------------------------------------------------------------------------
  function _validPair(letter, vowelId) {
    if (!letter || !ALL_HEBREW_LETTERS_22.includes(letter)) return false;
    if (!vowelId || !VOWELS_BY_ID[vowelId]) return false;
    return true;
  }

  function addTarget(sid, letter, vowelId, source) {
    if (!sid || !_validPair(letter, vowelId)) return false;
    const all = _load(TARGETS_KEY);
    if (!all[sid]) all[sid] = {};
    const now = Date.now();
    const k = cvKey(letter, vowelId);
    all[sid][k] = {
      addedAt: _nowIso(),
      expiresAt: (new Date(now + TARGET_DURATION_DAYS * DAY_MS)).toISOString(),
      source: source || 'teacher-send',
    };
    if (!_save(TARGETS_KEY, all)) return false;
    markFrozen(sid, letter, vowelId, 'auto-from-target');
    return true;
  }

  function removeTarget(sid, letter, vowelId) {
    if (!sid || !_validPair(letter, vowelId)) return false;
    const all = _load(TARGETS_KEY);
    const k = cvKey(letter, vowelId);
    if (!all[sid] || !all[sid][k]) return false;
    delete all[sid][k];
    if (Object.keys(all[sid]).length === 0) delete all[sid];
    return _save(TARGETS_KEY, all);
  }

  function getTargets(sid) {
    if (!sid) return [];
    const all = _load(TARGETS_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active).map(function (k) {
      const parsed = parseCV(k);
      if (!parsed) return null;
      return {
        letter: parsed.letter,
        vowelId: parsed.vowelId,
        cv: buildCV(parsed.letter, parsed.vowelId),
        key: k,
        addedAt: active[k].addedAt,
        expiresAt: active[k].expiresAt,
        source: active[k].source,
      };
    }).filter(Boolean);
  }

  // --------------------------------------------------------------------------
  // Freeze — "טיפלתי בכיתה"
  // --------------------------------------------------------------------------
  function markFrozen(sid, letter, vowelId, source) {
    if (!sid || !_validPair(letter, vowelId)) return false;
    const all = _load(FREEZE_KEY);
    if (!all[sid]) all[sid] = {};
    const now = Date.now();
    const k = cvKey(letter, vowelId);
    all[sid][k] = {
      frozenAt: _nowIso(),
      expiresAt: (new Date(now + FREEZE_DURATION_DAYS * DAY_MS)).toISOString(),
      source: source || 'teacher-handled',
    };
    return _save(FREEZE_KEY, all);
  }

  function removeFrozen(sid, letter, vowelId) {
    if (!sid || !_validPair(letter, vowelId)) return false;
    const all = _load(FREEZE_KEY);
    const k = cvKey(letter, vowelId);
    if (!all[sid] || !all[sid][k]) return false;
    delete all[sid][k];
    if (Object.keys(all[sid]).length === 0) delete all[sid];
    return _save(FREEZE_KEY, all);
  }

  function isFrozen(sid, letter, vowelId) {
    if (!sid || !_validPair(letter, vowelId)) return false;
    const all = _load(FREEZE_KEY);
    const k = cvKey(letter, vowelId);
    if (!all[sid] || !all[sid][k]) return false;
    return !_isExpired(all[sid][k], Date.now());
  }

  function getFrozen(sid) {
    if (!sid) return [];
    const all = _load(FREEZE_KEY);
    const active = _activeEntries(all[sid], Date.now());
    return Object.keys(active).map(function (k) {
      const parsed = parseCV(k);
      if (!parsed) return null;
      return {
        letter: parsed.letter,
        vowelId: parsed.vowelId,
        cv: buildCV(parsed.letter, parsed.vowelId),
        key: k,
        frozenAt: active[k].frozenAt,
        expiresAt: active[k].expiresAt,
        source: active[k].source,
      };
    }).filter(Boolean);
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------
  const API = {
    // Vowels
    getVowels: getVowels,
    getVowelById: getVowelById,
    getPhonemeGroup: getPhonemeGroup,
    getVowelsInGroup: getVowelsInGroup,
    getSisterVowels: getSisterVowels,

    // CV
    buildCV: buildCV,
    parseCV: parseCV,
    cvKey: cvKey,
    getAllCVPairs: getAllCVPairs,
    cvAudioKey: cvAudioKey,
    letterKey: letterKey,

    // Anchor
    getAnchorWord: getAnchorWord,
    getAllAnchorWords: getAllAnchorWords,
    getAnchorWordsForPhonemeGroup: getAnchorWordsForPhonemeGroup,
    wordAudioKey: wordAudioKey,

    // Weakness
    getTopWeakCVs: getTopWeakCVs,

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
    VOWELS: VOWELS,
    PHONEME_GROUP_HE: PHONEME_GROUP_HE,
    LETTER_KEY: LETTER_KEY,
    ALL_HEBREW_LETTERS_22: ALL_HEBREW_LETTERS_22,
    BKP_LETTERS: BKP_LETTERS,
    DAGESH: DAGESH,
    TARGETS_KEY: TARGETS_KEY,
    FREEZE_KEY: FREEZE_KEY,
    TARGET_DURATION_DAYS: TARGET_DURATION_DAYS,
    FREEZE_DURATION_DAYS: FREEZE_DURATION_DAYS,
  };

  if (typeof window !== 'undefined') {
    window.AvneiVowelAdapter = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();
