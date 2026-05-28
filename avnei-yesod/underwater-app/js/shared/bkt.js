// ============================================================
// shared/bkt.js — מנוע Bayesian Knowledge Tracing
// מבוסס: architecture-mvp.md §4 + partners-review-v3 §4א-ב
// קלט: events מ-event-logger.js · פלט: p(שולט) פר-תלמיד.ה × פר-סטרנד + פר-אי
// localStorage keys (dual-write):
//   avnei-bkt-v1         — legacy per-island state (נשמר חי, מקור-אמת למי שכבר עובד מולו)
//   avnei-bkt-strand-v1  — new per-strand state (5 BKT-ים פר ילדה — partners-review-v3 §11)
//
// עדכון 23.5.2026 — 4 פערים ארכיטקטוניים נסגרו:
// פער 1: sub-BKT פר-אות באי 3 (5 אותיות במקום BKT-אי אחד)
// פער 2: recommendInitialTier — התאמת רמה לפי BKT/profile
// פער 4: setInitialState — חיבור אבחון פתיחה ל-BKT
// פער 3: ראה architecture-mvp.md §3.4 (תיעוד פאק vs BKT)
//
// עדכון 27.5.2026 — משימה A.1: BKT-per-strand (5 מודלים)
//   • הוספת ISLAND_TO_STRAND (מבוסס 22-islands-validated strands_distribution)
//   • dual-write: כל event מעדכן את שני המפתחות (legacy + strand)
//   • sub-BKT per_letter ממשיך לחיות תחת island 3 (legacy) + תחת strand 1 (חדש)
//   • API חיצוני נשמר 1:1 ל-backwards-compat עם A0.1, A0.3, event-logger
//   • API חדש: getStrandState · getStrandMastery · getPerLetterState · ISLAND_TO_STRAND
//
// עדכון 27.5.2026 ערב — משימה A.4: Sub-BKT פר אות, הרחבה מ-5 ל-22
//   • ALL_HEBREW_LETTERS_22 — סדר אלפבתי קנוני (תואם data/island-03-letters/_schema.md מ-D.14)
//   • per_letter מאותחל ל-22 אותיות גם תחת strand 1 (חדש) וגם תחת island 3 (legacy)
//   • מיגרציה: state קיים עם 5 אותיות מתרחב אוטומטית ל-22 בלי לאבד נתונים
//   • ingestEvent מקבל אותיות חדשות (ש/ל/א וכו') — כבר לא מסומנות "לא חוקיות"
//   • ISLAND_3_LETTERS נשמר = 5 (האותיות עם משחקון פעיל) — מספיק ל-mastery של אי 3 ב-MVP
//     כש-D.15 ישלים את 17 המשחקונים — לעדכן ל-22 גם כאן
//   • API חדש לחשיפה ל-21A (מסך מורה) ול-D.15:
//     getLetterState · getWeakestLetters · getLetterMasteryDistribution
// ============================================================

window.AvneiBKT = (function() {

  // ---- Storage keys — dual-write ----
  const STORAGE_KEY = 'avnei-bkt-v1';                // legacy per-island (נשמר חי)
  const STORAGE_KEY_STRAND = 'avnei-bkt-strand-v1';  // new per-strand

  // ---- Strands — partners-review-v3 §4א ----
  const STRAND_IDS = [1, 2, 3, 4, 5];
  const STRAND_NAMES = Object.freeze({
    1: 'phonology',              // פונולוגיה (אותיות, פונמות, הברות)
    2: 'morphology',             // מורפולוגיה (שורש, בניין, ריבוי)
    3: 'oral_language',          // שפה דבורה (אוצר, תחביר דבור)
    4: 'reading_comprehension',  // קריאה והבנה
    5: 'writing',                // כתיבה (הכתבה והבעה)
  });

  // ISLAND_TO_STRAND — לפי curriculum/knowledge-base/sources/22-islands-validated-2026-05-21.json
  // strand_1_phonology_decoding:    [1, 2, 3, 4, 5, 6, 7, 8]
  // strand_2_morphology_function:   [9, 10, 11]
  // strand_3_oral_language:         [12, 13, 14]
  // strand_4_reading_comprehension: [15, 16, 17, 18]
  // strand_5_writing:               [19, 20, 21, 22]
  const ISLAND_TO_STRAND = Object.freeze({
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1,
    9: 2, 10: 2, 11: 2,
    12: 3, 13: 3, 14: 3,
    15: 4, 16: 4, 17: 4, 18: 4,
    19: 5, 20: 5, 21: 5, 22: 5,
  });

  // ---- פרמטרים ברירת מחדל ----
  const DEFAULT_PARAMS = {
    pL0: 0.20,
    pT:  0.15,
    pG:  0.20,
    pS:  0.08,
  };

  const PARAMS_PER_ISLAND = {
    1: { pL0: 0.15, pT: 0.18, pG: 0.25, pS: 0.08 },
    2: { pL0: 0.10, pT: 0.12, pG: 0.25, pS: 0.10 },
    3: { pL0: 0.10, pT: 0.15, pG: 0.20, pS: 0.05 },
    4: { pL0: 0.15, pT: 0.15, pG: 0.20, pS: 0.07 },
    5: { pL0: 0.10, pT: 0.13, pG: 0.18, pS: 0.07 },
    6: { pL0: 0.20, pT: 0.18, pG: 0.15, pS: 0.05 },
    7: { pL0: 0.10, pT: 0.10, pG: 0.15, pS: 0.08 },
    8: { pL0: 0.15, pT: 0.15, pG: 0.20, pS: 0.05 },
    9: { pL0: 0.10, pT: 0.10, pG: 0.20, pS: 0.10 },
  };

  // Per-strand params — ברירות מחדל. ילדים מגיעים עם פערים שונים בכל סטרנד:
  //   strand 1 (phonology):    pL0=0.12 — תואם לממוצע איים 1-3 הקיימים
  //   strand 2 (morphology):   pL0=0.10 — דורש הוראה מפורשת, לא ידע מולד
  //   strand 3 (oral):         pL0=0.30 — ילדה בכיתה א' כבר מגיעה עם שפה דבורה רחבה
  //   strand 4 (reading):      pL0=0.10 — הבנת הנקרא דורשת קריאה רהוטה
  //   strand 5 (writing):      pL0=0.08 — הכתבה והבעה הקשה ביותר
  // ייקבעו סופית בפאזה A.6 (Confidence indicators).
  const PARAMS_PER_STRAND = {
    1: { pL0: 0.12, pT: 0.15, pG: 0.22, pS: 0.07 },
    2: { pL0: 0.10, pT: 0.12, pG: 0.20, pS: 0.08 },
    3: { pL0: 0.30, pT: 0.15, pG: 0.25, pS: 0.10 },
    4: { pL0: 0.10, pT: 0.10, pG: 0.20, pS: 0.05 },
    5: { pL0: 0.08, pT: 0.10, pG: 0.15, pS: 0.08 },
  };

  const FLUENCY_THRESHOLD_MS = {
    3: 5000,
    4: 6000,
    6: 3000,
    7: 8000,
    8: 2000,
  };

  // ספים פר-סטרנד (חדש 27.5.2026 — TBD פדגוגית, נשמרים רכים עד A.6 + 21A)
  const FLUENCY_THRESHOLD_PER_STRAND_MS = {
    1: 4000,   // פונולוגיה — מהיר
    2: 6000,   // מורפולוגיה — מתון
    3: 8000,   // שפה דבורה — איטי (חשיבה לקסיקלית)
    4: 5000,   // קריאה והבנה
    5: 10000,  // כתיבה — איטי ביותר
  };

  const MASTERY_THRESHOLD = 0.90;

  // אי 3 = sub-BKT פר אות (פער 1)
  // ISLAND_3_LETTERS = 5 אותיות עם משחקון פעיל היום (מ/ק/ב/ר/ת).
  // משמש בלוגיקת mastery של אי 3 (A0.3 mastery-check ידרוש את כולן) — נשמר ב-5 עד D.15.
  const ISLAND_3_LETTERS = ['ת', 'מ', 'ר', 'ב', 'ק'];
  const ISLANDS_WITH_SUB_BKT = [3];  // איים שמשתמשים ב-sub-BKT פר-אות

  // A.4 — כל 22 האותיות לסטרנד 1 (per_letter). סדר אלפבתי קנוני (תואם D.14 _schema.md).
  // משמש לאתחול ה-per_letter ולחישוב distribution / weakest. עצמאי מ-ISLAND_3_LETTERS.
  const ALL_HEBREW_LETTERS_22 = Object.freeze([
    'א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ',
    'ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת',
  ]);

  // ספי distribution פר-אות (A.4) — תואם getWeakLettersIn3 הקיים (>= 3 attempts, p < 0.70).
  const LETTER_WEAK_THRESHOLD = 0.70;
  const LETTER_MIN_ATTEMPTS_FOR_BUCKET = 3;

  // ============================================================
  // ניהול state — שני stores (dual-write)
  // ============================================================
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) { return {}; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('BKT save failed:', e); }
  }

  function loadStrandStateRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STRAND);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) { return {}; }
  }

  function saveStrandStateRaw(state) {
    try { localStorage.setItem(STORAGE_KEY_STRAND, JSON.stringify(state)); }
    catch (e) { console.warn('BKT strand save failed:', e); }
  }

  function emptyIslandRecord(islandId) {
    const params = PARAMS_PER_ISLAND[islandId] || DEFAULT_PARAMS;
    return {
      pKnown: params.pL0,
      attempts: 0,
      correct: 0,
      wrong: 0,
      responseTimesMs: [],
      sessionsAtMastery: 0,
      lastSessionId: null,
      masteryAchievedAt: null,
    };
  }

  // A.4: per_letter מאותחל ל-22 אותיות (לא רק 5). aggregate ממשיך לפעול על אותיות שתורגלו.
  function emptyIsland3Record() {
    const params = PARAMS_PER_ISLAND[3];
    const per_letter = {};
    ALL_HEBREW_LETTERS_22.forEach(l => {
      per_letter[l] = {
        pKnown: params.pL0,
        attempts: 0,
        correct: 0,
        wrong: 0,
        responseTimesMs: [],
        masteryAchievedAt: null,
      };
    });
    return {
      per_letter,
      aggregate_pKnown: params.pL0,
      total_attempts: 0,
      sessionsAtMastery: 0,
      lastSessionId: null,
      masteryAchievedAt: null,
    };
  }

  // A.4: ensureAllLettersIn — מיגרציה non-destructive.
  // ילדה עם state קיים (5 אותיות בלבד) מקבלת את 17 החסרות עם pL0 ברירת מחדל.
  // ערכי האותיות הקיימות נשמרים ללא שינוי (attempts/pKnown/responseTimesMs/masteryAchievedAt).
  function ensureAllLettersIn(perLetter, pL0) {
    if (!perLetter || typeof perLetter !== 'object') return false;
    let changed = false;
    ALL_HEBREW_LETTERS_22.forEach(l => {
      if (!perLetter[l]) {
        perLetter[l] = {
          pKnown: pL0,
          attempts: 0,
          correct: 0,
          wrong: 0,
          responseTimesMs: [],
          masteryAchievedAt: null,
        };
        changed = true;
      }
    });
    return changed;
  }

  function emptyStrandRecord(strandId) {
    const params = PARAMS_PER_STRAND[strandId] || DEFAULT_PARAMS;
    const rec = {
      pKnown: params.pL0,
      attempts: 0,
      correct: 0,
      wrong: 0,
      responseTimesMs: [],
      sessionsAtMastery: 0,
      lastSessionId: null,
      masteryAchievedAt: null,
      per_island_attempts: {},  // כמה ניסיונות הגיעו מכל אי בסטרנד — לדיבאג ולקליברציה
    };
    // sub-BKT per_letter חי תחת strand 1 (פונולוגיה).
    // A.4: 22 אותיות (לא רק 5). pL0 = params.pL0 של strand 1 (0.12).
    if (strandId === 1) {
      rec.per_letter = {};
      ALL_HEBREW_LETTERS_22.forEach(l => {
        rec.per_letter[l] = {
          pKnown: params.pL0,
          attempts: 0, correct: 0, wrong: 0,
          responseTimesMs: [],
          masteryAchievedAt: null,
        };
      });
    }
    return rec;
  }

  function getStudentState(studentId) {
    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    return state[studentId];
  }

  function getIslandState(studentId, islandId) {
    const student = getStudentState(studentId);
    if (!student[islandId]) {
      student[islandId] = ISLANDS_WITH_SUB_BKT.includes(islandId)
        ? emptyIsland3Record()
        : emptyIslandRecord(islandId);
    }
    // A.4: מיגרציה — אי 3 עם 5 אותיות בלבד מתרחב ל-22.
    if (islandId === 3 && student[islandId].per_letter) {
      const params = PARAMS_PER_ISLAND[3];
      if (ensureAllLettersIn(student[islandId].per_letter, params.pL0)) {
        const state = loadState();
        if (!state[studentId]) state[studentId] = {};
        state[studentId][islandId] = student[islandId];
        saveState(state);
      }
    }
    return student[islandId];
  }

  // ============================================================
  // עדכון BKT (הליבה) — נוסחת Corbett & Anderson 1995
  // ============================================================
  function bktUpdate(pKnown, isCorrect, params) {
    let pAfterObservation;
    if (isCorrect) {
      const num = pKnown * (1 - params.pS);
      const den = num + (1 - pKnown) * params.pG;
      pAfterObservation = den > 0 ? num / den : pKnown;
    } else {
      const num = pKnown * params.pS;
      const den = num + (1 - pKnown) * (1 - params.pG);
      pAfterObservation = den > 0 ? num / den : pKnown;
    }
    return pAfterObservation + (1 - pAfterObservation) * params.pT;
  }

  // ============================================================
  // עזר — שטף
  // ============================================================
  function median(arr) {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function hasGoodFluency(times, islandId) {
    const threshold = FLUENCY_THRESHOLD_MS[islandId];
    if (!threshold) return true;
    const med = median(times.slice(-20));
    if (med === null) return false;
    return med <= threshold;
  }

  function hasGoodStrandFluency(times, strandId) {
    const threshold = FLUENCY_THRESHOLD_PER_STRAND_MS[strandId];
    if (!threshold) return true;
    const med = median(times.slice(-20));
    if (med === null) return false;
    return med <= threshold;
  }

  // ============================================================
  // עדכון אי 3 (sub-BKT פר-אות) — פער 1
  // ============================================================
  function ingestIsland3Event(state, studentId, evt) {
    const island = state[studentId][3];
    const letter = evt.target_letter;

    // A.4: כל אחת מ-22 האותיות תקפה לעדכון sub-BKT. אם חסרה — מתחזקים אוטומטית.
    if (!letter || !ALL_HEBREW_LETTERS_22.includes(letter)) {
      console.warn('BKT island 3: event without valid target_letter', evt);
      return null;
    }

    const params = PARAMS_PER_ISLAND[3];
    // מיגרציה בטוחה: אם state ישן ללא 22 האותיות — להרחיב.
    ensureAllLettersIn(island.per_letter, params.pL0);
    const letterState = island.per_letter[letter];

    letterState.attempts++;
    island.total_attempts++;
    if (evt.is_correct) letterState.correct++;
    else letterState.wrong++;

    if (typeof evt.response_time_ms === 'number' && evt.response_time_ms > 0) {
      letterState.responseTimesMs.push(evt.response_time_ms);
      if (letterState.responseTimesMs.length > 100) {
        letterState.responseTimesMs = letterState.responseTimesMs.slice(-100);
      }
    }

    letterState.pKnown = bktUpdate(letterState.pKnown, evt.is_correct === true, params);

    // mastery פר אות
    if (
      !letterState.masteryAchievedAt &&
      letterState.pKnown >= MASTERY_THRESHOLD &&
      hasGoodFluency(letterState.responseTimesMs, 3)
    ) {
      letterState.masteryAchievedAt = Date.now();
    }

    // עדכון aggregate — ממוצע של אותיות שתורגלו (attempts > 0)
    const practiced = Object.values(island.per_letter).filter(l => l.attempts > 0);
    if (practiced.length > 0) {
      island.aggregate_pKnown = practiced.reduce((s, l) => s + l.pKnown, 0) / practiced.length;
    }

    // עדכון יציבות (consolidation) — סיום סשן
    if (evt.session_id && evt.session_id !== island.lastSessionId) {
      const allMastered = ISLAND_3_LETTERS.every(l =>
        island.per_letter[l].masteryAchievedAt !== null
      );
      if (allMastered) island.sessionsAtMastery++;
      else island.sessionsAtMastery = 0;
      island.lastSessionId = evt.session_id;
    }

    // mastery של האי כולו — כל האותיות נשלטו + 2 סשנים רצופים
    if (
      !island.masteryAchievedAt &&
      ISLAND_3_LETTERS.every(l => island.per_letter[l].masteryAchievedAt !== null) &&
      island.sessionsAtMastery >= 2
    ) {
      island.masteryAchievedAt = Date.now();
    }

    return {
      pKnown_letter: letterState.pKnown,
      pKnown_island: island.aggregate_pKnown,
      letter: letter,
      masteryAchieved: !!island.masteryAchievedAt,
      letter_mastery: !!letterState.masteryAchievedAt,
    };
  }

  // ============================================================
  // עדכון אי רגיל
  // ============================================================
  function ingestRegularIslandEvent(state, studentId, islandId, evt) {
    const island = state[studentId][islandId];
    const params = PARAMS_PER_ISLAND[islandId] || DEFAULT_PARAMS;

    island.attempts++;
    if (evt.is_correct) island.correct++;
    else island.wrong++;

    if (typeof evt.response_time_ms === 'number' && evt.response_time_ms > 0) {
      island.responseTimesMs.push(evt.response_time_ms);
      if (island.responseTimesMs.length > 100) {
        island.responseTimesMs = island.responseTimesMs.slice(-100);
      }
    }

    island.pKnown = bktUpdate(island.pKnown, evt.is_correct === true, params);

    if (evt.session_id && evt.session_id !== island.lastSessionId) {
      if (island.pKnown >= MASTERY_THRESHOLD && hasGoodFluency(island.responseTimesMs, islandId)) {
        island.sessionsAtMastery++;
      } else {
        island.sessionsAtMastery = 0;
      }
      island.lastSessionId = evt.session_id;
    }

    if (
      !island.masteryAchievedAt &&
      island.pKnown >= MASTERY_THRESHOLD &&
      hasGoodFluency(island.responseTimesMs, islandId) &&
      island.sessionsAtMastery >= 2
    ) {
      island.masteryAchievedAt = Date.now();
    }

    return {
      pKnown: island.pKnown,
      attempts: island.attempts,
      masteryAchieved: !!island.masteryAchievedAt,
    };
  }

  // ============================================================
  // עדכון Strand (חדש — A.1, 27.5.2026)
  // ============================================================
  function ingestStrandEvent(strandState, studentId, evt) {
    const islandId = evt.primary_island_id;
    const strandId = ISLAND_TO_STRAND[islandId];
    if (!strandId) return null;

    if (!strandState[studentId]) strandState[studentId] = {};
    if (!strandState[studentId][strandId]) {
      strandState[studentId][strandId] = emptyStrandRecord(strandId);
    }
    const strand = strandState[studentId][strandId];
    const params = PARAMS_PER_STRAND[strandId] || DEFAULT_PARAMS;

    // A.4: מיגרציה non-destructive ל-strand 1 — 22 אותיות (אם state ישן עם 5 בלבד).
    if (strandId === 1 && strand.per_letter) {
      ensureAllLettersIn(strand.per_letter, params.pL0);
    }

    strand.attempts++;
    if (evt.is_correct) strand.correct++;
    else strand.wrong++;

    // ספירת ניסיונות פר-אי לטובת קליברציה ודיבאג
    if (!strand.per_island_attempts[islandId]) strand.per_island_attempts[islandId] = 0;
    strand.per_island_attempts[islandId]++;

    if (typeof evt.response_time_ms === 'number' && evt.response_time_ms > 0) {
      strand.responseTimesMs.push(evt.response_time_ms);
      if (strand.responseTimesMs.length > 100) {
        strand.responseTimesMs = strand.responseTimesMs.slice(-100);
      }
    }

    strand.pKnown = bktUpdate(strand.pKnown, evt.is_correct === true, params);

    // sub-BKT פר-אות — רק עבור אי 3 (mirror של island.per_letter, חי תחת strand 1)
    if (islandId === 3 && evt.target_letter && strand.per_letter && strand.per_letter[evt.target_letter]) {
      const ls = strand.per_letter[evt.target_letter];
      ls.attempts++;
      if (evt.is_correct) ls.correct++;
      else ls.wrong++;
      if (typeof evt.response_time_ms === 'number' && evt.response_time_ms > 0) {
        ls.responseTimesMs.push(evt.response_time_ms);
        if (ls.responseTimesMs.length > 100) {
          ls.responseTimesMs = ls.responseTimesMs.slice(-100);
        }
      }
      ls.pKnown = bktUpdate(ls.pKnown, evt.is_correct === true, PARAMS_PER_ISLAND[3]);
      if (!ls.masteryAchievedAt &&
          ls.pKnown >= MASTERY_THRESHOLD &&
          hasGoodStrandFluency(ls.responseTimesMs, 1)) {
        ls.masteryAchievedAt = Date.now();
      }
    }

    // יציבות + mastery ברמת סטרנד
    if (evt.session_id && evt.session_id !== strand.lastSessionId) {
      if (strand.pKnown >= MASTERY_THRESHOLD && hasGoodStrandFluency(strand.responseTimesMs, strandId)) {
        strand.sessionsAtMastery++;
      } else {
        strand.sessionsAtMastery = 0;
      }
      strand.lastSessionId = evt.session_id;
    }

    if (
      !strand.masteryAchievedAt &&
      strand.pKnown >= MASTERY_THRESHOLD &&
      hasGoodStrandFluency(strand.responseTimesMs, strandId) &&
      strand.sessionsAtMastery >= 2
    ) {
      strand.masteryAchievedAt = Date.now();
    }

    return {
      strand_id: strandId,
      strand_name: STRAND_NAMES[strandId],
      pKnown: strand.pKnown,
      attempts: strand.attempts,
      masteryAchieved: !!strand.masteryAchievedAt,
    };
  }

  // ============================================================
  // הפונקציה הראשית — קולטת event (dual-write)
  // ============================================================
  function ingestEvent(evt) {
    const studentId = evt.student_id || 'local';
    const islandId  = evt.primary_island_id;
    if (!islandId) return null;

    // ---- 1) Legacy per-island (מקור-אמת ל-A0.3 mastery-check + A0.1 reads) ----
    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    if (!state[studentId][islandId]) {
      state[studentId][islandId] = ISLANDS_WITH_SUB_BKT.includes(islandId)
        ? emptyIsland3Record()
        : emptyIslandRecord(islandId);
    }

    let islandResult;
    if (ISLANDS_WITH_SUB_BKT.includes(islandId)) {
      islandResult = ingestIsland3Event(state, studentId, evt);
    } else {
      islandResult = ingestRegularIslandEvent(state, studentId, islandId, evt);
    }
    saveState(state);

    // ---- 2) New per-strand (לקריאה ע"י 21A, A.6, calibration עתידי) ----
    const strandState = loadStrandStateRaw();
    const strandResult = ingestStrandEvent(strandState, studentId, evt);
    saveStrandStateRaw(strandState);

    // החזרה — שדות ישנים נשמרים, וגם strand info מצורף ל-callers חדשים
    if (!islandResult) return null;
    if (strandResult) {
      islandResult.strand_id = strandResult.strand_id;
      islandResult.strand_pKnown = strandResult.pKnown;
      islandResult.strand_masteryAchieved = strandResult.masteryAchieved;
    }
    return islandResult;
  }

  // ============================================================
  // API — Cold start (פער 4)
  // קלט מאבחון פתיחה: pL0 מותאם + Tier התחלתי
  // ============================================================
  function setInitialState(studentId, islandId, opts = {}) {
    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    if (!state[studentId][islandId]) {
      state[studentId][islandId] = ISLANDS_WITH_SUB_BKT.includes(islandId)
        ? emptyIsland3Record()
        : emptyIslandRecord(islandId);
    }

    const island = state[studentId][islandId];

    // עדכון pL0 פר-אות באי 3 (תומך גם בלי opts.pL0 כללי)
    if (ISLANDS_WITH_SUB_BKT.includes(islandId) && opts.per_letter) {
      const updatedLetters = [];
      Object.entries(opts.per_letter).forEach(([letter, pL0]) => {
        if (island.per_letter[letter] && typeof pL0 === 'number') {
          island.per_letter[letter].pKnown = pL0;
          updatedLetters.push(letter);
        }
      });
      // A.4: aggregate על האותיות שהוזנו במפורש (לא על כל 22 — אחרת 17 ב-pL0 ידללו את הממוצע).
      // אם לא הוזן כלום — נשמר ערך קודם.
      if (updatedLetters.length > 0) {
        const sum = updatedLetters.reduce((s, l) => s + island.per_letter[l].pKnown, 0);
        island.aggregate_pKnown = sum / updatedLetters.length;
      }
    }
    // עדכון pL0 אחיד (אם סופק)
    else if (typeof opts.pL0 === 'number' && opts.pL0 >= 0 && opts.pL0 <= 1) {
      if (ISLANDS_WITH_SUB_BKT.includes(islandId)) {
        // A.4: pL0 אחיד מוחל על כל 22 האותיות.
        ALL_HEBREW_LETTERS_22.forEach(l => {
          if (island.per_letter[l]) island.per_letter[l].pKnown = opts.pL0;
        });
        island.aggregate_pKnown = opts.pL0;
      } else {
        island.pKnown = opts.pL0;
      }
    }

    // Tier התחלתי — נשמר במטה-data של הילדה (לא ב-state.per_island)
    if (typeof opts.initialTier === 'number' && opts.initialTier >= 1 && opts.initialTier <= 4) {
      if (!state[studentId]._meta) state[studentId]._meta = {};
      if (!state[studentId]._meta.initialTier) state[studentId]._meta.initialTier = {};
      state[studentId]._meta.initialTier[islandId] = opts.initialTier;
    }

    saveState(state);

    // הערה: setInitialState משפיע רק על island state (legacy). strand state ימשיך מ-pL0 ברירת-מחדל
    // ויתעדכן רק מ-events. אבחון פתיחה לסטרנד = אחריות עתידית של A.5 / cold-start.
    return island;
  }

  // ============================================================
  // API — Tier recommendation (פער 2)
  // היוריסטיקה: BKT-prereq → profile → default
  // ============================================================
  const PREREQS = {
    1: [], 2: [1], 3: [2], 4: [3], 5: [4], 6: [5],
    7: [6], 8: [6], 9: [5], 10: [9], 11: [10],
  };

  const PROFILE_TIER_MAP = {
    'phonological':   { 1: 4, 2: 4, 3: 3, 4: 3, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
    'visual':         { 1: 1, 2: 1, 3: 4, 4: 3, 5: 2, 6: 2, 7: 3, 8: 2, 9: 2 },
    'fluency':        { 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 4, 7: 3, 8: 3, 9: 2 },
    'comprehension':  { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3 },
  };

  function recommendInitialTier(studentId, islandId, opts = {}) {
    const student = loadState()[studentId] || {};
    const profile = opts.profile || (student._meta && student._meta.profile);

    // 1. אם יש BKT history של prereqs — לפי p(BKT) הגבוה ביותר ביניהם
    const prereqs = PREREQS[islandId] || [];
    const prereqPs = prereqs
      .map(pId => student[pId])
      .filter(s => s)
      .map(s => s.pKnown !== undefined ? s.pKnown : s.aggregate_pKnown);

    if (prereqPs.length > 0) {
      const best = Math.max(...prereqPs);
      let tier;
      if (best >= 0.85) tier = 1;
      else if (best >= 0.65) tier = 2;
      else if (best >= 0.40) tier = 3;
      else tier = 4;
      return { tier, source: 'prereq_bkt', best_prereq_p: best };
    }

    // 2. אם יש profile מיפוי
    if (profile && PROFILE_TIER_MAP[profile] && PROFILE_TIER_MAP[profile][islandId]) {
      return { tier: PROFILE_TIER_MAP[profile][islandId], source: 'profile', profile };
    }

    // 3. אם יש tier התחלתי מהאבחון
    if (student._meta && student._meta.initialTier && student._meta.initialTier[islandId]) {
      return { tier: student._meta.initialTier[islandId], source: 'diagnostic_initial' };
    }

    // 4. ברירת מחדל
    return { tier: 2, source: 'default', uncertainty: true };
  }

  // ============================================================
  // API לדשבורד/UI
  // ============================================================
  function checkMastery(studentId, islandId) {
    const island = getIslandState(studentId, islandId);

    if (ISLANDS_WITH_SUB_BKT.includes(islandId)) {
      // אי 3 — בדיקה פר-אות
      const lettersStatus = {};
      let weakLetters = [];
      ISLAND_3_LETTERS.forEach(l => {
        const ls = island.per_letter[l];
        const mastered = ls.masteryAchievedAt !== null;
        lettersStatus[l] = {
          pKnown: ls.pKnown,
          mastered,
          attempts: ls.attempts,
          accuracy: ls.attempts > 0 ? ls.correct / ls.attempts : null,
        };
        if (!mastered && ls.attempts > 0 && ls.pKnown < MASTERY_THRESHOLD) {
          weakLetters.push(l);
        }
      });

      return {
        mastered: !!island.masteryAchievedAt,
        aggregate_pKnown: island.aggregate_pKnown,
        per_letter: lettersStatus,
        weak_letters: weakLetters,
        consolidationOk: island.sessionsAtMastery >= 2,
        reason: island.masteryAchievedAt
          ? 'mastered'
          : weakLetters.length > 0
            ? `אותיות חלשות: ${weakLetters.join(', ')}`
            : `דורש שני סשנים רצופים — כרגע ${island.sessionsAtMastery}`,
      };
    }

    // אי רגיל
    const fluencyOk = hasGoodFluency(island.responseTimesMs, islandId);
    const pOk = island.pKnown >= MASTERY_THRESHOLD;
    const consolidationOk = island.sessionsAtMastery >= 2;
    return {
      mastered: !!island.masteryAchievedAt,
      pKnown: island.pKnown,
      pOk, fluencyOk, consolidationOk,
      median_response_time_ms: median(island.responseTimesMs.slice(-20)),
      reason: pOk && fluencyOk && consolidationOk ? 'mastered'
        : !pOk ? `p(שולטת) = ${island.pKnown.toFixed(2)} — דורש > ${MASTERY_THRESHOLD}`
        : !fluencyOk ? `שטף איטי — דורש < ${FLUENCY_THRESHOLD_MS[islandId]}ms`
        : `דורש שני סשנים רצופים בסף — כרגע ${island.sessionsAtMastery}`,
    };
  }

  // עוקב מה הילדה חלשה בו בתוך אי 3 — לדשבורד מורה
  function getWeakLettersIn3(studentId) {
    const state = loadState();
    const island = state[studentId] && state[studentId][3];
    if (!island) return [];
    return ISLAND_3_LETTERS.filter(l => {
      const ls = island.per_letter[l];
      return ls.attempts >= 3 && ls.pKnown < 0.70;  // 3+ ניסיונות, p נמוך
    });
  }

  function reset(studentId) {
    // ניקוי בשני המפתחות לאותה ילדה
    const state = loadState();
    if (studentId) delete state[studentId];
    else state[studentId || 'local'] = {};
    saveState(state);

    const strandState = loadStrandStateRaw();
    if (studentId) delete strandState[studentId];
    else strandState[studentId || 'local'] = {};
    saveStrandStateRaw(strandState);
  }

  function dump() {
    return {
      island: loadState(),    // legacy
      strand: loadStrandStateRaw(),  // חדש
    };
  }

  // ============================================================
  // API חדש — per-strand (A.1, 27.5.2026)
  // ============================================================
  function getStrandState(studentId, strandId) {
    const allStrands = loadStrandStateRaw();
    if (!allStrands[studentId]) allStrands[studentId] = {};
    if (!allStrands[studentId][strandId]) {
      allStrands[studentId][strandId] = emptyStrandRecord(strandId);
    }
    // A.4: מיגרציה non-destructive ל-strand 1 בקריאה.
    if (strandId === 1 && allStrands[studentId][strandId].per_letter) {
      const params = PARAMS_PER_STRAND[1] || DEFAULT_PARAMS;
      const expanded = ensureAllLettersIn(allStrands[studentId][strandId].per_letter, params.pL0);
      // Backfill חד-פעמי: ילדות לפני A.1 שיש להן דאטה ב-island 3 אבל strand 1 ריק.
      const backfilled = backfillStrand1FromIsland3(studentId, allStrands);
      if (expanded || backfilled) {
        saveStrandStateRaw(allStrands);
      }
    }
    return allStrands[studentId][strandId];
  }

  // A.4: backfill חד-פעמי — מעתיק per_letter מ-island 3 (legacy) ל-strand 1 (חדש)
  // לאותיות שב-strand 1 הן attempts=0 וב-island 3 יש להן attempts > 0.
  // נדרש לילדות שהיו במערכת לפני A.1 (יש להן רק avnei-bkt-v1, לא avnei-bkt-strand-v1).
  // אחרי backfill, ingestEvent של A.1 (dual-write) יעדכן את שניהם בלי לדרוס.
  function backfillStrand1FromIsland3(studentId, allStrands) {
    const state = loadState();
    if (!state[studentId] || !state[studentId][3] || !state[studentId][3].per_letter) return false;
    if (!allStrands[studentId] || !allStrands[studentId][1] || !allStrands[studentId][1].per_letter) return false;
    const strand1 = allStrands[studentId][1];
    const islandPerLetter = state[studentId][3].per_letter;
    let changed = false;
    ALL_HEBREW_LETTERS_22.forEach(l => {
      const islandLs = islandPerLetter[l];
      const strandLs = strand1.per_letter[l];
      if (!islandLs || !strandLs) return;
      if ((strandLs.attempts || 0) === 0 && (islandLs.attempts || 0) > 0) {
        strand1.per_letter[l] = {
          pKnown: islandLs.pKnown,
          attempts: islandLs.attempts,
          correct: islandLs.correct || 0,
          wrong: islandLs.wrong || 0,
          responseTimesMs: (islandLs.responseTimesMs || []).slice(),
          masteryAchievedAt: islandLs.masteryAchievedAt || null,
        };
        changed = true;
      }
    });
    return changed;
  }

  function getStudentStrands(studentId) {
    const allStrands = loadStrandStateRaw();
    if (!allStrands[studentId]) return {};
    return allStrands[studentId];
  }

  function checkStrandMastery(studentId, strandId) {
    const strand = getStrandState(studentId, strandId);
    const threshold = FLUENCY_THRESHOLD_PER_STRAND_MS[strandId];
    const fluencyOk = hasGoodStrandFluency(strand.responseTimesMs, strandId);
    const pOk = strand.pKnown >= MASTERY_THRESHOLD;
    const consolidationOk = strand.sessionsAtMastery >= 2;

    const result = {
      strand_id: strandId,
      strand_name: STRAND_NAMES[strandId],
      mastered: !!strand.masteryAchievedAt,
      pKnown: strand.pKnown,
      pOk, fluencyOk, consolidationOk,
      attempts: strand.attempts,
      median_response_time_ms: median(strand.responseTimesMs.slice(-20)),
      per_island_attempts: strand.per_island_attempts || {},
      reason: pOk && fluencyOk && consolidationOk ? 'mastered'
        : !pOk ? `p(שולטת)=${strand.pKnown.toFixed(2)} — דורש > ${MASTERY_THRESHOLD}`
        : !fluencyOk ? `שטף איטי — דורש < ${threshold}ms`
        : `דורש שני סשנים רצופים בסף — כרגע ${strand.sessionsAtMastery}`,
    };

    // עבור strand 1 — לחשוף גם per_letter
    if (strandId === 1 && strand.per_letter) {
      const lettersStatus = {};
      Object.keys(strand.per_letter).forEach(l => {
        const ls = strand.per_letter[l];
        lettersStatus[l] = {
          pKnown: ls.pKnown,
          mastered: ls.masteryAchievedAt !== null,
          attempts: ls.attempts,
          accuracy: ls.attempts > 0 ? ls.correct / ls.attempts : null,
        };
      });
      result.per_letter = lettersStatus;
    }

    return result;
  }

  // proxy לתאימות לאחור: A0.1 (suggestFromBKT) קורא per_letter מ-state[3].
  // הפונקציה הזו חושפת את per_letter מ-strand 1 (המקור-אמת החדש) עם fallback ל-legacy island 3.
  // A.4: בודק קיום של state לפני יצירה (אין side-effect לתלמידה לא-קיימת).
  //      אם יש דאטה, getStrandState יבצע backfill מ-island 3 + מיגרציה ל-22 אותיות.
  function getPerLetterState(studentId) {
    const allStrands = loadStrandStateRaw();
    const state = loadState();
    const hasStrand = !!(allStrands[studentId] && allStrands[studentId][1] && allStrands[studentId][1].per_letter);
    const hasIsland = !!(state[studentId] && state[studentId][3] && state[studentId][3].per_letter);
    if (!hasStrand && !hasIsland) return null;

    if (hasStrand) {
      // קוראים דרך getStrandState — backfill + ensureAllLettersIn ירוצו.
      const strand1 = getStrandState(studentId, 1);
      return strand1 && strand1.per_letter ? strand1.per_letter : null;
    }
    // fallback ל-legacy island 3 (אין strand state כלל — ילדה לפני A.1)
    const params = PARAMS_PER_ISLAND[3];
    if (ensureAllLettersIn(state[studentId][3].per_letter, params.pL0)) {
      saveState(state);
    }
    return state[studentId][3].per_letter;
  }

  // ============================================================
  // API חדש — Sub-BKT פר-אות (A.4, 27.5.2026 ערב)
  // ============================================================

  // letterStateInternal — קריאה מ-strand 1 (קנוני) עם fallback ל-island 3 (legacy).
  // החזרת null אם לאות אין רשומה בכלל (לא אמור לקרות אחרי מיגרציה).
  function _resolvePerLetter(studentId) {
    return getPerLetterState(studentId);
  }

  // getLetterState — מצב BKT מלא עבור אות בודדת.
  // מחזיר null אם אין דאטה לתלמידה או אם האות אינה ב-22 הקנוניות.
  function getLetterState(studentId, letter) {
    if (!ALL_HEBREW_LETTERS_22.includes(letter)) return null;
    const perLetter = _resolvePerLetter(studentId);
    if (!perLetter || !perLetter[letter]) return null;
    const ls = perLetter[letter];
    return {
      letter,
      pKnown: ls.pKnown,
      attempts: ls.attempts || 0,
      correct: ls.correct || 0,
      wrong: ls.wrong || 0,
      accuracy: (ls.attempts > 0) ? (ls.correct / ls.attempts) : null,
      median_response_time_ms: median((ls.responseTimesMs || []).slice(-20)),
      mastered: ls.masteryAchievedAt !== null && ls.masteryAchievedAt !== undefined,
      masteryAchievedAt: ls.masteryAchievedAt || null,
    };
  }

  // getWeakestLetters — n האותיות החלשות ביותר, ממוין pKnown עולה.
  // ברירת מחדל: רק אותיות עם attempts >= LETTER_MIN_ATTEMPTS_FOR_BUCKET (3).
  // {includeUntouched: true} → כולל אותיות שלא תורגלו (pKnown = pL0).
  // F.21A ו-D.15 יוכלו לבחור.
  function getWeakestLetters(studentId, n, opts) {
    const limit = (typeof n === 'number' && n > 0) ? n : 3;
    const options = opts || {};
    const includeUntouched = options.includeUntouched === true;
    const perLetter = _resolvePerLetter(studentId);
    if (!perLetter) return [];

    const entries = ALL_HEBREW_LETTERS_22
      .map(letter => {
        const ls = perLetter[letter];
        if (!ls) return null;
        const attempts = ls.attempts || 0;
        if (!includeUntouched && attempts < LETTER_MIN_ATTEMPTS_FOR_BUCKET) return null;
        // אותיות שכבר נשלטו — לא "חלשות".
        if (ls.masteryAchievedAt) return null;
        return {
          letter,
          pKnown: ls.pKnown,
          attempts,
          accuracy: attempts > 0 ? (ls.correct / attempts) : null,
        };
      })
      .filter(Boolean);

    entries.sort((a, b) => a.pKnown - b.pKnown);
    return entries.slice(0, limit);
  }

  // getWeakLetters — Top-N אותיות חלשות לפי threshold ב-pKnown ו-minAttempts.
  // משמש את C.12B (Weakness Targeting Engine ב-pack-bkt-bridge).
  // ברירות מחדל: threshold=0.40, minAttempts=5, max=3.
  // החזרה: array של מחרוזות (שמות אותיות), ממוין מהחלשה ביותר.
  // שונה מ-getWeakestLetters (שמחזיר objects ולא מסנן ב-threshold) ומ-getWeakLettersIn3
  // (שעובד רק על 5 האותיות הקנוניות באי 3).
  function getWeakLetters(studentId, options) {
    const opts = options || {};
    const threshold = typeof opts.threshold === 'number' ? opts.threshold : 0.40;
    const minAttempts = typeof opts.minAttempts === 'number' ? opts.minAttempts : 5;
    const max = typeof opts.max === 'number' ? opts.max : 3;

    const perLetter = _resolvePerLetter(studentId);
    if (!perLetter) return [];

    const candidates = [];
    ALL_HEBREW_LETTERS_22.forEach(letter => {
      const ls = perLetter[letter];
      if (!ls) return;
      const attempts = ls.attempts || 0;
      if (attempts < minAttempts) return;
      if (ls.pKnown >= threshold) return;
      candidates.push({ letter, pKnown: ls.pKnown });
    });

    candidates.sort((a, b) => a.pKnown - b.pKnown);
    return candidates.slice(0, max).map(c => c.letter);
  }

  // getLetterMasteryDistribution — חתך 4 דליים לדשבורד F.21A.
  //   mastered:    masteryAchievedAt !== null
  //   in_progress: attempts >= 3 AND pKnown >= LETTER_WEAK_THRESHOLD (0.70) AND לא mastered
  //   weak:        attempts >= 3 AND pKnown < LETTER_WEAK_THRESHOLD
  //   untouched:   attempts < 3
  // סך 4 הקבוצות = 22.
  function getLetterMasteryDistribution(studentId) {
    const perLetter = _resolvePerLetter(studentId);
    const dist = {
      mastered: 0,
      in_progress: 0,
      weak: 0,
      untouched: 0,
      by_bucket: { mastered: [], in_progress: [], weak: [], untouched: [] },
      total: ALL_HEBREW_LETTERS_22.length,
    };
    if (!perLetter) {
      // אין דאטה כלל — כל 22 ב-untouched.
      dist.untouched = ALL_HEBREW_LETTERS_22.length;
      dist.by_bucket.untouched = ALL_HEBREW_LETTERS_22.slice();
      return dist;
    }
    ALL_HEBREW_LETTERS_22.forEach(letter => {
      const ls = perLetter[letter];
      if (!ls) { dist.untouched++; dist.by_bucket.untouched.push(letter); return; }
      const attempts = ls.attempts || 0;
      if (ls.masteryAchievedAt) {
        dist.mastered++; dist.by_bucket.mastered.push(letter);
      } else if (attempts < LETTER_MIN_ATTEMPTS_FOR_BUCKET) {
        dist.untouched++; dist.by_bucket.untouched.push(letter);
      } else if (ls.pKnown < LETTER_WEAK_THRESHOLD) {
        dist.weak++; dist.by_bucket.weak.push(letter);
      } else {
        dist.in_progress++; dist.by_bucket.in_progress.push(letter);
      }
    });
    return dist;
  }

  return {
    // ---- Legacy API (תאימות 1:1 ל-A0.1, A0.3, event-logger, test-bkt) ----
    ingestEvent,
    setInitialState,        // פער 4
    recommendInitialTier,   // פער 2
    getStudentState,
    getIslandState,
    checkMastery,
    getWeakLettersIn3,      // פער 1 — חשיפת אותיות חלשות
    reset,
    dump,

    // ---- API חדש — per-strand (A.1) ----
    getStrandState,
    getStudentStrands,
    checkStrandMastery,
    getPerLetterState,

    // ---- API חדש — Sub-BKT פר-אות 22 (A.4) ----
    getLetterState,
    getWeakestLetters,
    getLetterMasteryDistribution,

    // ---- API חדש — Weakness Targeting (C.12B) ----
    getWeakLetters,

    // ---- קבועים (legacy) ----
    ISLAND_3_LETTERS,
    ISLANDS_WITH_SUB_BKT,
    PARAMS_PER_ISLAND,
    DEFAULT_PARAMS,
    MASTERY_THRESHOLD,
    FLUENCY_THRESHOLD_MS,
    PROFILE_TIER_MAP,
    PREREQS,

    // ---- קבועים חדשים (per-strand) ----
    STRAND_IDS,
    STRAND_NAMES,
    ISLAND_TO_STRAND,
    PARAMS_PER_STRAND,
    FLUENCY_THRESHOLD_PER_STRAND_MS,
    STORAGE_KEY,
    STORAGE_KEY_STRAND,

    // ---- קבועים חדשים (A.4) ----
    ALL_HEBREW_LETTERS_22,
    LETTER_WEAK_THRESHOLD,
    LETTER_MIN_ATTEMPTS_FOR_BUCKET,
  };
})();
