// ============================================================
// shared/bkt.js — מנוע Bayesian Knowledge Tracing
// מבוסס: architecture-mvp.md §4 + §3
// קלט: events מ-event-logger.js · פלט: p(שולט) פר-תלמיד.ה × פר-אי
// localStorage key: avnei-bkt-v1
//
// עדכון 23.5.2026 — 4 פערים ארכיטקטוניים נסגרו:
// פער 1: sub-BKT פר-אות באי 3 (5 אותיות במקום BKT-אי אחד)
// פער 2: recommendInitialTier — התאמת רמה לפי BKT/profile
// פער 4: setInitialState — חיבור אבחון פתיחה ל-BKT
// פער 3: ראה architecture-mvp.md §3.4 (תיעוד פאק vs BKT)
// ============================================================

window.AvneiBKT = (function() {

  const STORAGE_KEY = 'avnei-bkt-v1';

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

  const FLUENCY_THRESHOLD_MS = {
    3: 5000,
    4: 6000,
    6: 3000,
    7: 8000,
    8: 2000,
  };

  const MASTERY_THRESHOLD = 0.90;

  // אי 3 = sub-BKT פר אות (פער 1)
  const ISLAND_3_LETTERS = ['ת', 'מ', 'ר', 'ב', 'ק'];  // MVP: 5 אותיות. בעתיד 22.
  const ISLANDS_WITH_SUB_BKT = [3];  // איים שמשתמשים ב-sub-BKT פר-אות

  // ============================================================
  // ניהול state
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

  function emptyIsland3Record() {
    const params = PARAMS_PER_ISLAND[3];
    const per_letter = {};
    ISLAND_3_LETTERS.forEach(l => {
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

  // ============================================================
  // עדכון אי 3 (sub-BKT פר-אות) — פער 1
  // ============================================================
  function ingestIsland3Event(state, studentId, evt) {
    const island = state[studentId][3];
    const letter = evt.target_letter;

    // אם אין letter — לא אפשרי לעדכן sub-BKT. עדכון aggregate בלבד.
    if (!letter || !ISLAND_3_LETTERS.includes(letter)) {
      console.warn('BKT island 3: event without valid target_letter', evt);
      return null;
    }

    const params = PARAMS_PER_ISLAND[3];
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
  // הפונקציה הראשית — קולטת event
  // ============================================================
  function ingestEvent(evt) {
    const studentId = evt.student_id || 'local';
    const islandId  = evt.primary_island_id;
    if (!islandId) return null;

    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    if (!state[studentId][islandId]) {
      state[studentId][islandId] = ISLANDS_WITH_SUB_BKT.includes(islandId)
        ? emptyIsland3Record()
        : emptyIslandRecord(islandId);
    }

    let result;
    if (ISLANDS_WITH_SUB_BKT.includes(islandId)) {
      result = ingestIsland3Event(state, studentId, evt);
    } else {
      result = ingestRegularIslandEvent(state, studentId, islandId, evt);
    }

    saveState(state);
    return result;
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
      Object.entries(opts.per_letter).forEach(([letter, pL0]) => {
        if (island.per_letter[letter] && typeof pL0 === 'number') {
          island.per_letter[letter].pKnown = pL0;
        }
      });
      const all = Object.values(island.per_letter);
      island.aggregate_pKnown = all.reduce((s, l) => s + l.pKnown, 0) / all.length;
    }
    // עדכון pL0 אחיד (אם סופק)
    else if (typeof opts.pL0 === 'number' && opts.pL0 >= 0 && opts.pL0 <= 1) {
      if (ISLANDS_WITH_SUB_BKT.includes(islandId)) {
        ISLAND_3_LETTERS.forEach(l => island.per_letter[l].pKnown = opts.pL0);
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
    const state = loadState();
    if (studentId) delete state[studentId];
    else state[studentId || 'local'] = {};
    saveState(state);
  }

  function dump() { return loadState(); }

  return {
    ingestEvent,
    setInitialState,        // פער 4
    recommendInitialTier,   // פער 2
    getStudentState,
    getIslandState,
    checkMastery,
    getWeakLettersIn3,      // פער 1 — חשיפת אותיות חלשות
    reset,
    dump,
    ISLAND_3_LETTERS,
    ISLANDS_WITH_SUB_BKT,
    PARAMS_PER_ISLAND,
    DEFAULT_PARAMS,
    MASTERY_THRESHOLD,
    FLUENCY_THRESHOLD_MS,
    PROFILE_TIER_MAP,
    PREREQS,
  };
})();
