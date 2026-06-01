/**
 * Studio · Validator Pipeline
 * Business validation: item schema + Hebrew niqud rules + content quality.
 *
 * Public:
 *   validateContent(item) → { valid, errors: [{ field, code, hebrew, severity, suggested_fix? }] }
 *
 * Mirrors את הבדיקות של scripts/validate-pack.js לרמת item יחיד,
 * ועליהן בדיקות עברית פדגוגיות שלא קיימות שם.
 *
 * Hebrew rules (memory: reference-hebrew-niqud-rules / reference-hebrew-bgd-kpt-dagesh-rule):
 *   - ב/כ/פ בתחילת מילה — דגש קל
 *   - "כל" עם חולם (כֹּל) לא קמץ
 *   - "יופי" עם וֹ
 *   - מילה שילדה רואה — ניקוד מלא
 *
 * Severity:
 *   - 'error' = חוסם publish
 *   - 'warning' = מותר לפרסם, אך מסומן
 */
(function (global) {
  'use strict';

  const VALID_MECHANICS = ['tap-all', 'pick', 'memory-pair', 'sort-by-letter'];

  const ALL_HEBREW_LETTERS_22 = [
    'א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
    'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'
  ];

  const FINAL_TO_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  const DAGESH = 'ּ';        // U+05BC
  const HOLAM  = 'ֹ';        // U+05B9
  const QAMATZ = 'ָ';        // U+05B8
  const PATAH  = 'ַ';        // U+05B7

  // mechanics שדורשות prompt audio כברירת מחדל
  const MECHANICS_NEEDING_AUDIO = new Set(['pick', 'tap-all']);

  // confusion lists (memory: reference-avnei-yesod-island-build-checklist §8)
  const SHAPE_CONFUSIONS = {
    'ב': ['כ', 'נ', 'ו'],
    'כ': ['ב', 'ן', 'נ'],
    'ר': ['ד', 'כ'],
    'ד': ['ר'],
    'ה': ['ח', 'ת'],
    'ח': ['ה', 'ת'],
    'ת': ['ה', 'ח'],
    'מ': ['ס', 'ט'],
    'נ': ['ב', 'כ', 'ג'],
    'ס': ['מ', 'ט'],
    'ז': ['ו', 'ן'],
    'ו': ['ז', 'נ', 'ן'],
    'ג': ['נ'],
    'ע': ['צ'],
    'צ': ['ע'],
    'ש': ['ש']  // shin vs sin בלבד
  };

  const SOUND_CONFUSIONS = {
    'ב': ['ו'],
    'כ': ['ח'],
    'ת': ['ט'],
    'ק': ['כ'],
    'ס': ['ש'],
    'א': ['ה', 'ע'],
    'ה': ['א', 'ע'],
    'ע': ['א', 'ה'],
    'ח': ['כ'],
    'ט': ['ת']
  };

  const HEBREW_MESSAGES = {
    'missing_letter':
      'בחרי על איזו אות המשחק מתמקד.',
    'missing_mechanic':
      'בחרי סוג משחק (הקש על כל / בחרי אופציה / זוגות / מיון).',
    'invalid_mechanic':
      'סוג המשחק לא נתמך — מותרים: הקש על כל, בחרי אופציה, זוגות, מיון.',
    'missing_rama_task':
      'לא הצלחנו לזהות איזה כיוון פדגוגי. בדקי שבחרת אי + סוג משחק שמתאימים אחד לשני.',
    'missing_audio':
      'חסר אודיו ל-prompt. ילדת כיתה א\' לא תוכל לקרוא את ההוראה לבד.',
    'niqud_violation_bgd_kpt':
      'ב/כ/פ בתחילת מילה צריכים דגש קל (נקודה בתוך האות). בלי דגש — האודיו יבטא /va·xa·fa/ במקום /ba·ka·pa/.',
    'niqud_violation_yofi':
      'כתבי "יוֹפִי" עם וֹ (חולם מלא), לא "יפי".',
    'niqud_violation_kol':
      'המילה "כל" צריכה להיות "כֹּל" עם חולם — לא "כָּל" עם קמץ קטן. AvriNeural יבטא קמץ-קטן בצורה לא נכונה לכיתה א\'.',
    'niqud_missing':
      'מילה שילדה רואה — חייבת ניקוד מלא. בלי ניקוד, היא לא תוכל לקרוא לבד.',
    'distractors_too_few':
      'משחק "בחירה" דורש לפחות 3 אופציות שגויות (distractors).',
    'distractors_too_similar':
      'ה-distractors קלים מדי — דומות מספיק כדי שילדה תצטרך להבחין באמת. הוסיפי לפחות אות מתבלבלת (למשל ב/ו, כ/ח).',
    'letters_involved_empty':
      'לא זיהינו אותיות בפריט. בדקי שיש לפחות אות אחת בתוכן.',
    'letter_not_in_22':
      'האות לא תקפה. מותרות 22 אותיות עבריות קנוניות (ללא סופיות).',
    'tier_out_of_range':
      'רמה (tier) חייבת להיות 1, 2, 3 או 4.',
    'rama_peima_mismatch':
      'משימת ראמ"ה ופעימה לא תואמות. autoTag לא הצליח — בדקי שבחרת אי תקין.',
    'tts_pending':
      'אודיו ייווצר רק לאחר שמירה (Web-Speech זמני, יוחלף לפני הפיילוט).'
  };

  // ============================================================
  // helpers
  // ============================================================

  function hasNiqud(str) {
    if (!str) return false;
    return /[֑-ׇ]/.test(str);
  }

  function isHebrewWord(str) {
    return /[א-ת]/.test(str || '');
  }

  function stripNiqud(s) {
    return (s || '').replace(/[֑-ׇ]/g, '');
  }

  function findBgdKptViolations(text) {
    if (!text) return [];
    // עבור על כל "מילה" בעברית, בדוק אם האות הראשונה ב/כ/פ
    // ויש marks אך אין dagesh.
    const violations = [];
    const wordRe = /[א-ת][א-ת֑-ׇ]*/g;
    let m;
    while ((m = wordRe.exec(text)) !== null) {
      const word = m[0];
      const first = word.charAt(0);
      if (!'בכפ'.includes(first)) continue;

      const tail = word.slice(1);
      const marksMatch = tail.match(/^[֑-ׇ]+/);
      if (!marksMatch) continue;  // לא מנוקד בכלל — לא הפרה (זה niqud_missing)
      const marks = marksMatch[0];
      if (marks.indexOf(DAGESH) === -1) {
        violations.push({ word, letter: first, atIndex: m.index });
      }
    }
    return violations;
  }

  function findYofiViolations(text) {
    // "יופי" → חייב "יוֹפִי" (חולם מלא על ו). אם stripped = "יפי" (חסרה ו)
    // או "יופי" בלי חולם מעל ה-ו → הפרה.
    // (regex \b לא עובד בעברית — איטרציה ידנית פר מילה.)
    if (!text) return [];
    const matches = [];
    const wordRe = /[א-ת][א-ת֑-ׇ]*/g;
    let m;
    while ((m = wordRe.exec(text)) !== null) {
      const word = m[0];
      const stripped = word.replace(/[֑-ׇ]/g, '');

      // bare "יפי" — חסרה ו
      if (stripped === 'יפי') {
        matches.push({ form: word, reason: 'missing-waw' });
        continue;
      }
      // "יופי" צריך חולם על ו. ב-NFC הסדר: י + ו + ֹ + פ + ...
      // אם stripped='יופי' ואין חולם → הפרה.
      if (stripped === 'יופי') {
        if (!word.includes(HOLAM)) {
          matches.push({ form: word, reason: 'missing-holam' });
        }
      }
    }
    return matches;
  }

  function findKolViolations(text) {
    // "כל" צריך "כֹּל". "כָּל" עם קמץ קטן — לא רצוי כי AvriNeural טועה.
    if (!text) return [];
    const matches = [];
    // חפש "כל" עם קמץ אבל בלי חולם
    const re = /כּ?ָל/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ form: m[0] });
    }
    return matches;
  }

  function distractorsHaveConfusion(letter, distractors) {
    if (!letter || !Array.isArray(distractors)) return false;
    const base = FINAL_TO_BASE[letter] ?? letter;
    const shape = SHAPE_CONFUSIONS[base] || [];
    const sound = SOUND_CONFUSIONS[base] || [];
    const targetSet = new Set([...shape, ...sound]);
    return distractors.some(d => {
      const dStripped = stripNiqud(d);
      for (const ch of dStripped) {
        const chBase = FINAL_TO_BASE[ch] ?? ch;
        if (targetSet.has(chBase)) return true;
      }
      return false;
    });
  }

  // ============================================================
  // main: validateContent
  // ============================================================

  function pushErr(errs, field, code, severity, suggested_fix) {
    errs.push({
      field: field,
      code: code,
      hebrew: HEBREW_MESSAGES[code] || code,
      severity: severity,
      ...(suggested_fix ? { suggested_fix } : {})
    });
  }

  function validateContent(item) {
    const errors = [];
    if (!item || typeof item !== 'object') {
      pushErr(errors, 'item', 'missing_mechanic', 'error');
      return { valid: false, errors };
    }

    // ---- mechanic ----
    if (!item.mechanic) {
      pushErr(errors, 'mechanic', 'missing_mechanic', 'error');
    } else if (!VALID_MECHANICS.includes(item.mechanic)) {
      pushErr(errors, 'mechanic', 'invalid_mechanic', 'error',
        `מותרים: ${VALID_MECHANICS.join(', ')}`);
    }

    // ---- tier ----
    if (item.tier !== undefined &&
        (!Number.isInteger(item.tier) || item.tier < 1 || item.tier > 4)) {
      pushErr(errors, 'tier', 'tier_out_of_range', 'error');
    }

    // ---- rama task / peima ----
    if (item.rama_task_alignment === undefined || item.rama_task_alignment === null) {
      pushErr(errors, 'rama_task_alignment', 'missing_rama_task', 'error');
    } else {
      const TASK_TO_PEIMA = { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:3, 8:3, 9:3, 10:3 };
      const expectedPeima = TASK_TO_PEIMA[item.rama_task_alignment];
      if (item.peima_target !== expectedPeima) {
        pushErr(errors, 'peima_target', 'rama_peima_mismatch', 'error');
      }
    }

    // ---- letter ----
    // Studio תמיד מתנהג כ-focus_mode=letters · type=new — letter נדרש.
    // letter חייב להיות אחת מ-22 הקנוניות (לא סופית).
    const isLetterFocused = item.skill === undefined || item.skill === null;
    if (isLetterFocused && (item.type === 'new' || item.type === undefined)) {
      if (!item.letter) {
        pushErr(errors, 'letter', 'missing_letter', 'error');
      } else if (!ALL_HEBREW_LETTERS_22.includes(item.letter)) {
        const suggested = FINAL_TO_BASE[item.letter];
        pushErr(errors, 'letter', 'letter_not_in_22', 'error',
          suggested ? `אולי התכוונת ל-${suggested}? (סופית = לתצוגה בלבד)` : undefined);
      }
    }

    // ---- letters_involved ----
    // חייב array לא ריק; כל איבר ב-22 הקנוניות (auto-tagger מנרמל סופיות).
    if (!Array.isArray(item.letters_involved) || item.letters_involved.length === 0) {
      pushErr(errors, 'letters_involved', 'letters_involved_empty', 'error');
    } else {
      const invalid = item.letters_involved.filter(l => !ALL_HEBREW_LETTERS_22.includes(l));
      if (invalid.length > 0) {
        pushErr(errors, 'letters_involved', 'letter_not_in_22', 'error',
          `אותיות לא תקפות: ${invalid.join(', ')}`);
      }
    }

    // ---- audio ----
    if (MECHANICS_NEEDING_AUDIO.has(item.mechanic)) {
      if (!item.audio_url) {
        // Phase 0 — warning בלבד; Phase 4 — error
        pushErr(errors, 'audio_url', 'missing_audio', 'warning');
      }
    }
    if (item.tts_pending) {
      pushErr(errors, 'audio_url', 'tts_pending', 'warning');
    }

    // ---- distractors (pick / tap-all) ----
    if (item.mechanic === 'pick') {
      const ds = Array.isArray(item.distractors) ? item.distractors : [];
      if (ds.length < 3) {
        pushErr(errors, 'distractors', 'distractors_too_few', 'error',
          `יש ${ds.length}, צריך לפחות 3`);
      }
    }
    if ((item.mechanic === 'pick' || item.mechanic === 'tap-all')
        && Array.isArray(item.distractors) && item.distractors.length > 0
        && item.letter) {
      if (!distractorsHaveConfusion(item.letter, item.distractors)) {
        pushErr(errors, 'distractors', 'distractors_too_similar', 'warning');
      }
    }

    // ---- niqud rules ----
    // טקסטים שילדה רואה: custom_words + distractors
    const visibleTexts = []
      .concat(Array.isArray(item.custom_words) ? item.custom_words : [])
      .concat(Array.isArray(item.distractors) ? item.distractors : []);
    if (item.prompt_he) visibleTexts.push(item.prompt_he);

    let foundMissingNiqud = false;
    let foundBgdKpt = false;
    let foundYofi = false;
    let foundKol = false;

    for (const txt of visibleTexts) {
      if (typeof txt !== 'string' || !txt.trim()) continue;
      if (!isHebrewWord(txt)) continue;

      // אי 3 (זיהוי אותיות): אות בודדת עירומה מ-22 הקנוניות = פדגוגית נכון.
      // הילדה לומדת את צורת האות, לא צליל מנוקד. לא מחילים niqud_missing.
      // (island_id חי ב-_studio כי pack-schema לא מכיל אותו ישירות)
      const itemIslandId = item.island_id ?? (item._studio && item._studio.island_id);
      const stripped = stripNiqud(txt).trim();
      if (itemIslandId === 3 && stripped.length === 1 && ALL_HEBREW_LETTERS_22.includes(stripped)) {
        continue;
      }

      if (!hasNiqud(txt)) {
        foundMissingNiqud = true;
        continue; // ה-bgdkpt check מסתמך על marks; דלג
      }
      if (findBgdKptViolations(txt).length > 0) foundBgdKpt = true;
      if (findYofiViolations(txt).length > 0)   foundYofi = true;
      if (findKolViolations(txt).length > 0)    foundKol = true;
    }

    if (foundMissingNiqud) {
      pushErr(errors, 'custom_words', 'niqud_missing', 'error');
    }
    if (foundBgdKpt) {
      pushErr(errors, 'custom_words', 'niqud_violation_bgd_kpt', 'error');
    }
    if (foundYofi) {
      pushErr(errors, 'custom_words', 'niqud_violation_yofi', 'warning');
    }
    if (foundKol) {
      pushErr(errors, 'custom_words', 'niqud_violation_kol', 'warning');
    }

    const blockers = errors.filter(e => e.severity === 'error');
    return { valid: blockers.length === 0, errors };
  }

  const api = {
    validateContent,
    findBgdKptViolations,
    findYofiViolations,
    findKolViolations,
    distractorsHaveConfusion,
    HEBREW_MESSAGES,
    SHAPE_CONFUSIONS,
    SOUND_CONFUSIONS,
    MECHANICS_NEEDING_AUDIO,
    VALID_MECHANICS,
    ALL_HEBREW_LETTERS_22
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global._StudioValidatorPipeline = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
