// ============================================================
// shared/bkt.js — מנוע Bayesian Knowledge Tracing
// מבוסס: architecture-mvp.md §4 (BKT + שטף + יציבות)
// קלט: events מ-event-logger.js · פלט: p(שולט) פר-תלמיד.ה × פר-אי
// localStorage key: avnei-bkt-v1
// ============================================================

window.AvneiBKT = (function() {

  const STORAGE_KEY = 'avnei-bkt-v1';

  // ---- פרמטרים ברירת מחדל ----
  // p(L₀): סיכוי לדעת מההתחלה · p(T): סיכוי ללמוד אחרי תרגיל
  // p(G):  סיכוי לנחש נכון        · p(S): סיכוי לטעות למרות שיודע
  const DEFAULT_PARAMS = {
    pL0: 0.20,
    pT:  0.15,
    pG:  0.20,
    pS:  0.08,
  };

  // פרמטרים ספציפיים פר-אי (אם שונים מברירת מחדל)
  // מבוסס architecture-mvp.md §4.1
  const PARAMS_PER_ISLAND = {
    1: { pL0: 0.15, pT: 0.18, pG: 0.25, pS: 0.08 },  // PA — קל יחסית
    2: { pL0: 0.10, pT: 0.12, pG: 0.25, pS: 0.10 },  // פונמית — קשה
    3: { pL0: 0.10, pT: 0.15, pG: 0.20, pS: 0.05 },  // אותיות — תלוי במחקר
    4: { pL0: 0.15, pT: 0.15, pG: 0.20, pS: 0.07 },  // CV
    5: { pL0: 0.10, pT: 0.13, pG: 0.18, pS: 0.07 },  // מיזוג
    6: { pL0: 0.20, pT: 0.18, pG: 0.15, pS: 0.05 },  // שטף — נשען על קודמים
    7: { pL0: 0.10, pT: 0.10, pG: 0.15, pS: 0.08 },  // תלת-הברתי + צ'אנקים
    8: { pL0: 0.15, pT: 0.15, pG: 0.20, pS: 0.05 },  // Sight Words
    9: { pL0: 0.10, pT: 0.10, pG: 0.20, pS: 0.10 },  // מורפולוגיה — קשה
  };

  // ספי שטף (זמן תגובה חציוני במילישניות) פר-אי
  const FLUENCY_THRESHOLD_MS = {
    3: 5000,  // 5 שניות לזיהוי אות
    4: 6000,  // 6 שניות ל-CV
    6: 3000,  // 3 שניות לאוטומטיזציה
    7: 8000,  // 8 שניות למילים ארוכות
    8: 2000,  // 2 שניות ל-Sight Words
  };

  const MASTERY_THRESHOLD = 0.90;

  // ============================================================
  // ניהול state
  // ============================================================

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('BKT save failed:', e);
    }
  }

  function getStudentState(studentId) {
    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    return state[studentId];
  }

  function getIslandState(studentId, islandId) {
    const student = getStudentState(studentId);
    if (!student[islandId]) {
      const params = PARAMS_PER_ISLAND[islandId] || DEFAULT_PARAMS;
      student[islandId] = {
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
    return student[islandId];
  }

  // ============================================================
  // עדכון BKT (הליבה)
  // ============================================================
  // נוסחה סטנדרטית של Corbett & Anderson 1995:
  //   אם נכון: p(L|correct) = p(L)*(1-pS) / [p(L)*(1-pS) + (1-p(L))*pG]
  //   אם טעות: p(L|wrong)   = p(L)*pS     / [p(L)*pS    + (1-p(L))*(1-pG)]
  //   אחרי כל פריט: p(L_next) = p(L|result) + (1-p(L|result)) * pT

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
    // אחרי תצפית — סיכוי שלמדנו במהלך הפריט
    return pAfterObservation + (1 - pAfterObservation) * params.pT;
  }

  // ============================================================
  // קליטת אירוע — הפונקציה הראשית
  // ============================================================
  function ingestEvent(evt) {
    const studentId = evt.student_id || 'local';
    const islandId  = evt.primary_island_id;
    if (!islandId) return null;  // ללא אי — לא מעדכן BKT

    const state = loadState();
    if (!state[studentId]) state[studentId] = {};
    if (!state[studentId][islandId]) {
      const params = PARAMS_PER_ISLAND[islandId] || DEFAULT_PARAMS;
      state[studentId][islandId] = {
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
    const island = state[studentId][islandId];
    const params = PARAMS_PER_ISLAND[islandId] || DEFAULT_PARAMS;

    // עדכון מונים
    island.attempts++;
    if (evt.is_correct) island.correct++;
    else island.wrong++;

    if (typeof evt.response_time_ms === 'number' && evt.response_time_ms > 0) {
      island.responseTimesMs.push(evt.response_time_ms);
      if (island.responseTimesMs.length > 100) {
        island.responseTimesMs = island.responseTimesMs.slice(-100);
      }
    }

    // עדכון p(שולט)
    island.pKnown = bktUpdate(island.pKnown, evt.is_correct === true, params);

    // עדכון יציבות (consolidation) — סיום סשן
    if (evt.session_id && evt.session_id !== island.lastSessionId) {
      // סשן חדש — האם הסשן הקודם עמד בקריטריונים?
      if (island.pKnown >= MASTERY_THRESHOLD && hasGoodFluency(island, islandId)) {
        island.sessionsAtMastery++;
      } else {
        island.sessionsAtMastery = 0;  // איפוס אם נפלנו
      }
      island.lastSessionId = evt.session_id;
    }

    // האם הילד.ה השיג.ה mastery אמיתי?
    if (
      !island.masteryAchievedAt &&
      island.pKnown >= MASTERY_THRESHOLD &&
      hasGoodFluency(island, islandId) &&
      island.sessionsAtMastery >= 2
    ) {
      island.masteryAchievedAt = Date.now();
    }

    saveState(state);
    return {
      pKnown: island.pKnown,
      attempts: island.attempts,
      masteryAchieved: !!island.masteryAchievedAt,
    };
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

  function hasGoodFluency(island, islandId) {
    const threshold = FLUENCY_THRESHOLD_MS[islandId];
    if (!threshold) return true;  // אי בלי סף שטף — תמיד "טוב מספיק"
    const med = median(island.responseTimesMs.slice(-20));
    if (med === null) return false;  // אין נתונים
    return med <= threshold;
  }

  // ============================================================
  // API לדשבורד/UI
  // ============================================================
  function checkMastery(studentId, islandId) {
    const island = getIslandState(studentId, islandId);
    const fluencyOk = hasGoodFluency(island, islandId);
    const pOk = island.pKnown >= MASTERY_THRESHOLD;
    const consolidationOk = island.sessionsAtMastery >= 2;
    return {
      mastered: !!island.masteryAchievedAt,
      pKnown: island.pKnown,
      pOk,
      fluencyOk,
      consolidationOk,
      median_response_time_ms: median(island.responseTimesMs.slice(-20)),
      reason: pOk && fluencyOk && consolidationOk
        ? 'mastered'
        : !pOk ? `p(שולטת) = ${island.pKnown.toFixed(2)} — דורש > ${MASTERY_THRESHOLD}`
        : !fluencyOk ? `שטף איטי — דורש < ${FLUENCY_THRESHOLD_MS[islandId]}ms`
        : `דורש שני סשנים רצופים בסף — כרגע ${island.sessionsAtMastery}`,
    };
  }

  function reset(studentId) {
    const state = loadState();
    if (studentId) delete state[studentId];
    else state[studentId || 'local'] = {};
    saveState(state);
  }

  function dump() {
    return loadState();
  }

  return {
    ingestEvent,
    getStudentState,
    getIslandState,
    checkMastery,
    reset,
    dump,
    // קבועים נחשפים לבדיקה
    PARAMS_PER_ISLAND,
    DEFAULT_PARAMS,
    MASTERY_THRESHOLD,
    FLUENCY_THRESHOLD_MS,
  };
})();
