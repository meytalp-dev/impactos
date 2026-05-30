// ============================================================
// shared/mastery-check.js — קריטריון Mastery משולש (משימה A0.3)
// ============================================================
// מקור פדגוגי:
//   _handoff/2026-05-26-partners-review-v3.md §4ז
//   "ילדה 'סוגרת אי' רק כשמתקיימים כל שלושת התנאים יחד:
//     1. p(BKT) > 0.90
//     2. שטף עומד — חציון זמן תגובה יציב, 2 סשנים רצופים
//     3. ביצוע תקין במשימת ראמ"ה המקבילה"
//
// הבדל ממה ש-bkt.js עשה לבד:
//   bkt.js בודק (1) + (2) + 2-סשנים, אבל הסשן שם הוא 'sess-' + Date.now()
//   (מתחדש בכל טעינת דף). זה לא תופס "יציבות לאורך זמן".
//   המודול הזה מוסיף:
//     • סשן = יום (YYYY-MM-DD), עם מינימום 5 פריטים תקפים ביום
//     • רף ראמ"ה — עוגן חיצוני שמונע false-positive של BKT
//     • החזר structured של 3 התנאים — לדשבורד מורה ולחגיגה
//
// קלט: events מ-state.js (getEvents()) + BKT state מ-bkt.js (loadState).
// פלט: { met, conditions: { bkt, fluency, rama }, reason }
//
// API:
//   AvneiMasteryCheck.checkMastery(studentId, islandId)
//   AvneiMasteryCheck.checkAndShowIslandCelebration(studentId, islandId, opts?)
//   AvneiMasteryCheck.getClosedIslands(studentId)
//   AvneiMasteryCheck.ISLAND_TO_RAMA
// ============================================================

window.AvneiMasteryCheck = (function () {

  // ============================================================
  // ISLAND_TO_RAMA — מיפוי 9 איים פעילים למשימת ראמ"ה ולסף שטף
  // ============================================================
  // מקור הספים:
  //   • איים 1-3 (פעימה 1) — אין סף זמן רשמי בראמ"ה ⇒ ספים פנימיים (soft)
  //   • איים 4-6 — גזורים ישירות מהמדריך הרשמי של ראמ"ה 2014
  //   • איים 7-9 — TBD, ברירת מחדל 4s עד החלטה פדגוגית
  //
  // 22 האותיות של אי 3: בגרסת MVP יש רק 5 (ת,מ,ר,ב,ק). הרף "18+/22" מותרגם
  // ל-proxy: כל האותיות המתורגלות שעברו p(BKT) ≥ 0.85. כשיתווספו 22 — יחזור
  // ל-18+ כסף מוחלט. ראה השדה `mvp_letter_count_proxy`.
  const ISLAND_TO_RAMA = Object.freeze({
    1: {
      rama_task: null,                     // הברות = רמת גן, אין משימת ראמ"ה מקבילה
      rama_task_name: 'אין (רמת גן)',
      accuracy_threshold_pKnown: 0.85,     // פנימי — אין רף ראמ"ה
      fluency_threshold_seconds: 5.0,
      fluency_source: 'internal',
      mvp_letter_count_proxy: null,
    },
    2: {
      rama_task: 2,
      rama_task_name: 'מודעות פונולוגית (פותח/סוגר)',
      accuracy_threshold_pKnown: 0.85,     // proxy ל-"5+/6 פותח · 4+/6 סוגר"
      fluency_threshold_seconds: 4.0,
      fluency_source: 'internal',          // ראמ"ה לא מציינת זמן לפעימה 1
      mvp_letter_count_proxy: null,
    },
    3: {
      rama_task: 1,
      rama_task_name: 'קריאת שמות אותיות',
      accuracy_threshold_pKnown: 0.85,
      fluency_threshold_seconds: 4.0,
      fluency_source: 'internal',
      // ראמ"ה: 18+/22. MVP: 5 אותיות (ת,מ,ר,ב,ק) ⇒ נדרש שכולן יעברו 0.85.
      // כשיתווספו 22 אותיות — לעבור לסף מוחלט {min_letters_at_threshold: 18}.
      mvp_letter_count_proxy: 'all_practiced_above_threshold',
    },
    4: {
      rama_task: 5,
      rama_task_name: 'קריאת 45 צירופים מנוקדים',
      accuracy_threshold_pKnown: 0.85,
      fluency_threshold_seconds: 2.0,      // 90 שנ' / 45 צירופים
      fluency_source: 'rama-derived',
      mvp_letter_count_proxy: null,
    },
    5: {
      rama_task: 6,
      rama_task_name: 'קריאת 20 מילים מוכרות',
      accuracy_threshold_pKnown: 0.90,
      fluency_threshold_seconds: 3.5,      // 70 שנ' / 20 מילים
      fluency_source: 'rama-derived',
      mvp_letter_count_proxy: null,
    },
    6: {
      rama_task: 8,
      rama_task_name: 'קריאת סיפור "השבלול"',
      accuracy_threshold_pKnown: 0.90,
      fluency_threshold_seconds: 2.5,      // 195 שנ' / 77 מילים
      fluency_source: 'rama-derived',
      mvp_letter_count_proxy: null,
    },
    7: {
      rama_task: null,
      rama_task_name: 'TBD',
      accuracy_threshold_pKnown: 0.85,
      fluency_threshold_seconds: 4.0,
      fluency_source: 'internal',
      mvp_letter_count_proxy: null,
    },
    8: {
      rama_task: null,
      rama_task_name: 'TBD',
      accuracy_threshold_pKnown: 0.85,
      fluency_threshold_seconds: 4.0,
      fluency_source: 'internal',
      mvp_letter_count_proxy: null,
    },
    9: {
      rama_task: null,
      rama_task_name: 'TBD (מורפולוגיה — שורש ותבנית)',
      accuracy_threshold_pKnown: 0.85,
      fluency_threshold_seconds: 4.0,
      fluency_source: 'internal',
      mvp_letter_count_proxy: null,
    },
    // אי 14 — הבנת הנשמע (סוכן 31 · 29.5.2026). מקביל ישירות ל-RAMA task 3.
    // BKT proxy: aggregate_pKnown של 3 sub-skills (identify-hero/sequence/inference).
    // אין סף זמן פדגוגי לפעימה 2 — fluency_source 'internal'.
    14: {
      rama_task: 3,
      rama_task_name: 'הבנת טקסט מושמע',
      accuracy_threshold_pKnown: 0.70,    // pilot: pal mastery threshold per oral-skill
      fluency_threshold_seconds: null,    // no fluency requirement for comprehension
      fluency_source: 'internal',
      mvp_letter_count_proxy: null,
    },
  });

  const MIN_ITEMS_PER_SESSION_DAY = 5;
  const REQUIRED_CONSECUTIVE_SESSIONS = 2;
  const STATE_KEY = 'underwater-app:v1';   // מקור events
  const CLOSED_KEY = 'avnei-yesod-closed-islands';  // ע"מ לא לחגוג פעמיים

  // ============================================================
  // עזר — קריאת events מ-state.js
  // ============================================================
  function readAllEvents() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.events) ? parsed.events : [];
    } catch (e) {
      return [];
    }
  }

  function getEventsForStudentIsland(studentId, islandId) {
    return readAllEvents().filter(e =>
      (e.student_id || 'local') === studentId &&
      e.primary_island_id === islandId
    );
  }

  function median(arr) {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function dayKey(timestamp) {
    // YYYY-MM-DD בזמן מקומי (לא UTC) — סשן = יום משתמש, לא יום שרת
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ============================================================
  // תנאי 1: BKT — p(שולטת) ≥ סף
  // ============================================================
  function checkBKT(studentId, islandId, ramaSpec) {
    if (!window.AvneiBKT) {
      return { ok: false, reason: 'AvneiBKT לא נטען', value: null };
    }
    const bktResult = AvneiBKT.checkMastery(studentId, islandId);
    const p = bktResult.aggregate_pKnown !== undefined
      ? bktResult.aggregate_pKnown
      : bktResult.pKnown;

    if (typeof p !== 'number') {
      return { ok: false, reason: 'אין דאטה — טרם תורגל', value: null };
    }

    const ok = p >= ramaSpec.accuracy_threshold_pKnown;
    return {
      ok,
      value: p,
      threshold: ramaSpec.accuracy_threshold_pKnown,
      reason: ok ? null : `p(שולטת)=${p.toFixed(2)} < ${ramaSpec.accuracy_threshold_pKnown}`,
    };
  }

  // ============================================================
  // תנאי 2: שטף — חציון זמן תגובה ב-2 ימים רצופים
  // ============================================================
  function checkFluency(studentId, islandId, ramaSpec) {
    const events = getEventsForStudentIsland(studentId, islandId);
    const validEvents = events.filter(e =>
      typeof e.response_time_ms === 'number' && e.response_time_ms > 0
    );

    if (validEvents.length < MIN_ITEMS_PER_SESSION_DAY) {
      return {
        ok: false,
        value: null,
        threshold_seconds: ramaSpec.fluency_threshold_seconds,
        reason: `סה"כ פחות מ-${MIN_ITEMS_PER_SESSION_DAY} פריטים`,
      };
    }

    // קיבוץ פר-יום ושמירת רק ימים עם ≥5 פריטים
    const byDay = {};
    validEvents.forEach(e => {
      const day = dayKey(e.timestamp);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e.response_time_ms);
    });

    const validDays = Object.entries(byDay)
      .filter(([, times]) => times.length >= MIN_ITEMS_PER_SESSION_DAY)
      .map(([day, times]) => ({ day, median_ms: median(times) }))
      .sort((a, b) => a.day.localeCompare(b.day));

    if (validDays.length < REQUIRED_CONSECUTIVE_SESSIONS) {
      return {
        ok: false,
        value: validDays.length > 0 ? validDays[validDays.length - 1].median_ms : null,
        threshold_seconds: ramaSpec.fluency_threshold_seconds,
        valid_days_count: validDays.length,
        reason: `${validDays.length} ימים תקפים מתוך ${REQUIRED_CONSECUTIVE_SESSIONS} נדרשים`,
      };
    }

    // 2 ימים תקפים אחרונים — לבדוק שהם רצופים (פערים של 0+ ימי-לא-משחק מותרים
    // לפי החלטת 26.5.2026 ערב — "פערי לא-משחק OK, פערי סשן-לא-תקף OK").
    // המשמעות: עוקבים פשוט על שני האחרונים. אם הם תקפים ≥סף — שטף עומד.
    const lastTwo = validDays.slice(-REQUIRED_CONSECUTIVE_SESSIONS);
    const thresholdMs = ramaSpec.fluency_threshold_seconds * 1000;
    const allBelow = lastTwo.every(d => d.median_ms <= thresholdMs);

    return {
      ok: allBelow,
      value: lastTwo[lastTwo.length - 1].median_ms,
      threshold_seconds: ramaSpec.fluency_threshold_seconds,
      valid_days_count: validDays.length,
      last_two_days: lastTwo,
      reason: allBelow
        ? null
        : `חציון בשני הימים האחרונים: ${lastTwo.map(d => (d.median_ms / 1000).toFixed(1) + 'ש').join(', ')} — חורג מ-${ramaSpec.fluency_threshold_seconds}ש`,
    };
  }

  // ============================================================
  // תנאי 3: רף ראמ"ה
  // ============================================================
  function checkRamaThreshold(studentId, islandId, ramaSpec) {
    if (ramaSpec.rama_task === null) {
      // אין משימת ראמ"ה מקבילה (אי 1, איים 7-9 TBD)
      // הולכים על proxy פנימי בלבד — חופף לתנאי BKT.
      return {
        ok: true,
        rama_task: null,
        reason: 'אין משימת ראמ"ה מקבילה — לא מגביל',
        source: 'no_rama_task',
      };
    }

    // אי 3 — MVP proxy לרף "18+/22 אותיות"
    if (islandId === 3 && ramaSpec.mvp_letter_count_proxy === 'all_practiced_above_threshold') {
      if (!window.AvneiBKT) {
        return { ok: false, reason: 'AvneiBKT לא נטען', source: 'island3_proxy' };
      }
      const island3 = AvneiBKT.getIslandState(studentId, 3);
      const letters = AvneiBKT.ISLAND_3_LETTERS;
      const practiced = letters
        .map(l => ({ letter: l, state: island3.per_letter[l] }))
        .filter(o => o.state.attempts > 0);

      if (practiced.length === 0) {
        return { ok: false, reason: 'אף אות לא תורגלה', source: 'island3_proxy' };
      }

      const threshold = ramaSpec.accuracy_threshold_pKnown;
      const above = practiced.filter(o => o.state.pKnown >= threshold);
      const below = practiced.filter(o => o.state.pKnown < threshold);

      // ב-MVP: כל האותיות שתורגלו חייבות להיות ≥ הסף.
      // הערה: כשיתווספו 22 אותיות — להחליף לחישוב "18 מתוך 22 ≥ 0.85".
      const ok = below.length === 0 && practiced.length >= letters.length;

      return {
        ok,
        rama_task: 1,
        rama_task_name: ramaSpec.rama_task_name,
        practiced_count: practiced.length,
        above_threshold_count: above.length,
        total_letters_in_mvp: letters.length,
        weak_letters: below.map(o => o.letter),
        source: 'island3_proxy_mvp',
        reason: ok
          ? null
          : below.length > 0
            ? `אותיות מתחת ל-${threshold}: ${below.map(o => o.letter).join(', ')}`
            : `${practiced.length}/${letters.length} אותיות תורגלו (חסרות ${letters.length - practiced.length})`,
        note_for_full_22: 'ב-MVP: כל 5 האותיות חייבות לעבור. כשיתווספו 22 אותיות — לעבור לסף "18 מתוך 22 ≥ 0.85"',
      };
    }

    // אי 2 — proxy ל-"5+/6 פותח · 4+/6 סוגר": p(BKT) ≥ סף + מינימום ניסיונות
    if (islandId === 2) {
      const events = getEventsForStudentIsland(studentId, 2);
      const correct = events.filter(e => e.is_correct).length;
      const total = events.length;
      const ratio = total > 0 ? correct / total : 0;
      const minRatio = 0.83;  // ≈ 5/6
      const minAttempts = 12;

      const ok = total >= minAttempts && ratio >= minRatio;
      return {
        ok,
        rama_task: 2,
        rama_task_name: ramaSpec.rama_task_name,
        attempts: total,
        correct,
        accuracy_ratio: ratio,
        source: 'island2_proxy',
        reason: ok
          ? null
          : total < minAttempts
            ? `${total} ניסיונות מתוך ${minAttempts} נדרשים`
            : `דיוק ${(ratio * 100).toFixed(0)}% < ${(minRatio * 100).toFixed(0)}% (proxy לרף 5+/6)`,
      };
    }

    // ברירת מחדל לאיים 4-6 — proxy על p(BKT) כללי
    if (!window.AvneiBKT) {
      return { ok: false, reason: 'AvneiBKT לא נטען', source: 'generic_proxy' };
    }
    const bktResult = AvneiBKT.checkMastery(studentId, islandId);
    const p = bktResult.pKnown || bktResult.aggregate_pKnown;
    const ok = typeof p === 'number' && p >= ramaSpec.accuracy_threshold_pKnown;
    return {
      ok,
      rama_task: ramaSpec.rama_task,
      rama_task_name: ramaSpec.rama_task_name,
      pKnown: p,
      source: 'generic_bkt_proxy',
      reason: ok ? null : `proxy: p(BKT)=${typeof p === 'number' ? p.toFixed(2) : 'N/A'} < ${ramaSpec.accuracy_threshold_pKnown}`,
    };
  }

  // ============================================================
  // הפונקציה הראשית — checkMastery(student_id, island_id)
  // ============================================================
  function checkMastery(studentId, islandId) {
    studentId = studentId || 'local';
    const ramaSpec = ISLAND_TO_RAMA[islandId];

    if (!ramaSpec) {
      return {
        met: false,
        island_id: islandId,
        student_id: studentId,
        conditions: { bkt: null, fluency: null, rama: null },
        reason: `אי ${islandId} מחוץ ל-MVP — אין מיפוי ב-ISLAND_TO_RAMA`,
      };
    }

    const bkt     = checkBKT(studentId, islandId, ramaSpec);
    const fluency = checkFluency(studentId, islandId, ramaSpec);
    const rama    = checkRamaThreshold(studentId, islandId, ramaSpec);

    const met = bkt.ok && fluency.ok && rama.ok;

    let reason;
    if (met) {
      reason = 'mastered — 3 התנאים התקיימו';
    } else {
      const failing = [];
      if (!bkt.ok)     failing.push(`BKT: ${bkt.reason}`);
      if (!fluency.ok) failing.push(`שטף: ${fluency.reason}`);
      if (!rama.ok)    failing.push(`ראמ"ה: ${rama.reason}`);
      reason = failing.join(' | ');
    }

    return {
      met,
      island_id: islandId,
      student_id: studentId,
      rama_task: ramaSpec.rama_task,
      rama_task_name: ramaSpec.rama_task_name,
      conditions: { bkt, fluency, rama },
      reason,
      checked_at: Date.now(),
    };
  }

  // ============================================================
  // ניהול "איים סגורים" — אנטי-חגיגה כפולה
  // ============================================================
  function getClosedIslands(studentId) {
    studentId = studentId || 'local';
    try {
      const raw = localStorage.getItem(CLOSED_KEY);
      const all = raw ? JSON.parse(raw) : {};
      return all[studentId] || [];
    } catch (e) {
      return [];
    }
  }

  function markIslandClosed(studentId, islandId) {
    studentId = studentId || 'local';
    try {
      const raw = localStorage.getItem(CLOSED_KEY);
      const all = raw ? JSON.parse(raw) : {};
      if (!all[studentId]) all[studentId] = [];
      if (!all[studentId].includes(islandId)) {
        all[studentId].push(islandId);
        localStorage.setItem(CLOSED_KEY, JSON.stringify(all));
      }
    } catch (e) {
      console.warn('markIslandClosed failed:', e);
    }
  }

  // ============================================================
  // אירוע island_closed ל-event-logger
  // ============================================================
  function logIslandClosedEvent(studentId, islandId, result) {
    try {
      const ramaSpec = ISLAND_TO_RAMA[islandId];
      const evt = {
        student_id: studentId,
        session_id: (window.AvneiEventLogger && AvneiEventLogger.SESSION_ID) || ('sess-' + Date.now()),
        event_type: 'island_closed',
        primary_island_id: islandId,
        rama_task: ramaSpec.rama_task,
        rama_task_name: ramaSpec.rama_task_name,
        bkt_pKnown: result.conditions.bkt.value,
        fluency_median_ms: result.conditions.fluency.value,
        rama_passed: result.conditions.rama.ok,
        timestamp: Date.now(),
      };
      // appendEvent זמין גלובלית מ-state.js
      if (typeof appendEvent === 'function') appendEvent(evt);
    } catch (e) {
      console.warn('logIslandClosedEvent failed:', e);
    }
  }

  // ============================================================
  // חגיגה לילדה — overlay מלא-מסך עם נוני, קונפטי, ולבבות
  // ============================================================
  function showIslandCelebration(islandId, result) {
    const ramaSpec = ISLAND_TO_RAMA[islandId];

    // יצירת overlay
    const overlay = document.createElement('div');
    overlay.id = 'island-celebration-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', `האי ${islandId} נסגר`);
    overlay.innerHTML = `
      <div class="ic-bg"></div>
      <div class="ic-confetti-layer"></div>
      <div class="ic-card">
        <div class="ic-noni">
          <img src="assets/noni-kiss.png" alt="נוני שמח" onerror="this.src='assets/noni-happy.png'">
        </div>
        <h1 class="ic-title">האי נסגר!</h1>
        <p class="ic-subtitle">${escapeHtml(ramaSpec.rama_task_name)}</p>
        <p class="ic-line">נוני גאה בך 🪸</p>
        <button class="ic-close" type="button">המשך</button>
      </div>
    `;

    // סגנון inline — לא תלוי ב-CSS חיצוני (לפי [[feedback-css-to-js-inline-fallback]])
    const style = document.createElement('style');
    style.textContent = `
      #island-celebration-overlay {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        font-family: inherit; direction: rtl;
        animation: ic-fade-in 0.6s ease-out;
      }
      #island-celebration-overlay .ic-bg {
        position: absolute; inset: 0;
        background: radial-gradient(circle at 50% 40%, rgba(184, 242, 207, 0.95), rgba(168, 232, 255, 0.92) 60%, rgba(217, 210, 255, 0.95));
        backdrop-filter: blur(8px);
      }
      #island-celebration-overlay .ic-confetti-layer {
        position: absolute; inset: 0; pointer-events: none; overflow: hidden;
      }
      #island-celebration-overlay .ic-confetti-piece {
        position: absolute; top: -20px; width: 10px; height: 16px;
        animation: ic-fall linear forwards;
      }
      @keyframes ic-fall {
        to { transform: translateY(110vh) rotate(720deg); }
      }
      @keyframes ic-fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes ic-noni-dance {
        0%, 100% { transform: rotate(-8deg) translateY(0); }
        25%      { transform: rotate(8deg) translateY(-12px); }
        50%      { transform: rotate(-8deg) translateY(0); }
        75%      { transform: rotate(8deg) translateY(-8px); }
      }
      #island-celebration-overlay .ic-card {
        position: relative; z-index: 2;
        background: white;
        border-radius: 36px;
        padding: 48px 56px 40px;
        text-align: center;
        box-shadow: 0 24px 80px rgba(0, 60, 90, 0.18);
        max-width: 480px;
        animation: ic-fade-in 0.8s 0.2s both;
      }
      #island-celebration-overlay .ic-noni {
        width: 140px; height: 140px;
        margin: -100px auto 16px;
        animation: ic-noni-dance 1.6s ease-in-out infinite;
      }
      #island-celebration-overlay .ic-noni img {
        width: 100%; height: 100%; object-fit: contain;
      }
      #island-celebration-overlay .ic-title {
        font-size: 38px; margin: 0 0 8px;
        color: #1a5a7a; font-weight: 800; letter-spacing: -0.5px;
      }
      #island-celebration-overlay .ic-subtitle {
        font-size: 18px; margin: 0 0 20px;
        color: #5a7a8a; font-weight: 500;
      }
      #island-celebration-overlay .ic-line {
        font-size: 22px; margin: 0 0 28px;
        color: #2a6a8a; font-weight: 600;
      }
      #island-celebration-overlay .ic-close {
        background: linear-gradient(135deg, #5cb6d4, #4a9dc4);
        color: white;
        border: 0;
        border-radius: 28px;
        padding: 14px 48px;
        font-size: 20px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 6px 20px rgba(74, 157, 196, 0.4);
        transition: transform 0.15s ease;
      }
      #island-celebration-overlay .ic-close:hover { transform: scale(1.05); }
      #island-celebration-overlay .ic-close:active { transform: scale(0.98); }
    `;
    overlay.appendChild(style);
    document.body.appendChild(overlay);

    // קונפטי פסטל
    const colors = ['#FFE7A8', '#FFA98D', '#B8F2CF', '#A8E8FF', '#D9D2FF', '#FFD3D8'];
    const confettiLayer = overlay.querySelector('.ic-confetti-layer');
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('span');
      p.className = 'ic-confetti-piece';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = (Math.random() * 1.2) + 's';
      p.style.animationDuration = (2.5 + Math.random() * 2.5) + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiLayer.appendChild(p);
    }

    // אודיו — אם זמין
    if (window.AvneiAudio && typeof AvneiAudio.playSequence === 'function') {
      try {
        AvneiAudio.playSequence(['great', 'finale-found-treasure'], 800);
      } catch (e) {}
    }

    // כפתור סגירה
    overlay.querySelector('.ic-close').addEventListener('click', () => {
      overlay.style.transition = 'opacity 0.4s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 420);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ============================================================
  // checkAndShowIslandCelebration — נקודת הכניסה למשחקונים
  // נקראת בסיום משחקון אחרי שה-BKT והאירועים כבר עודכנו.
  // אם 3 התנאים מתקיימים והאי עוד לא נחגג — מציג חגיגה.
  // ============================================================
  function checkAndShowIslandCelebration(studentId, islandId, opts) {
    opts = opts || {};
    studentId = studentId || (
      (function () {
        try { return localStorage.getItem('avnei-yesod-current-student') || 'local'; }
        catch (e) { return 'local'; }
      })()
    );

    const result = checkMastery(studentId, islandId);

    if (!result.met) {
      if (opts.debug) console.log('[mastery-check] not met:', result.reason);
      return result;
    }

    // נסגר! לוודא שלא חגגנו כבר
    const closed = getClosedIslands(studentId);
    if (closed.includes(islandId)) {
      if (opts.debug) console.log('[mastery-check] already celebrated, skipping');
      return result;
    }

    // לסמן כסגור + לתעד אירוע + להציג חגיגה
    markIslandClosed(studentId, islandId);
    logIslandClosedEvent(studentId, islandId, result);

    // עיכוב 2.4 שנייות (לפי הכלל הגלובלי "המתנה 2.4s+ בין שלבים")
    // כדי שחגיגת המשחקון הספציפי תתפוס קודם
    const delay = typeof opts.delay_ms === 'number' ? opts.delay_ms : 2400;
    setTimeout(() => showIslandCelebration(islandId, result), delay);

    return result;
  }

  // ============================================================
  // F.21A — checkRamaTaskStatus (per RAMA task, NOT per island)
  // ============================================================
  // נדרש ע"י F.21A: סוכן UI שמציג את הכיתה דרך עדשת משה"ח/ראמ"ה
  // (10 משימות × 3 פעימות) במקום עדשת האיים הפנימיים.
  //
  // checkMastery עובד פר אי. כאן עובדים פר משימת ראמ"ה — שיכולה לכלול 1+ איים.
  // אסטרטגיית aggregate: Min — החלש מנצח (פדגוגית-קונסרבטיבית, אישור מיטל 27.5.2026).
  //   אם 2 איים תורמים למשימה ואחד fail — המשימה fail.
  //   אם כולם pass — pass. אם מעורב pass+near — near. אם הכל cold — cold.
  //
  // איים מחוץ ל-MVP (11, 12, 13, 15, 16, 17, 19, 20) → אין להם entry ב-ISLAND_TO_RAMA →
  // checkMastery מחזיר {met:false, reason:'מחוץ ל-MVP'} → נטופלים כ-'cold' כאן.
  // ============================================================

  // RAMA_TASKS — 10 משימות × פעימה × איים תורמים × רף מספרי
  // מקור: spec F.21A נספח A. רפים: ramah-task-spec official 2014 + partners-review-v3 §3.
  const RAMA_TASKS = Object.freeze({
    1:  { name: 'זיהוי שמות אותיות',         value_threshold: 18, value_max: 22, time_threshold_sec: null, pulse: 1, islands: [3]      },
    2:  { name: 'מודעות פונולוגית',           value_threshold: 5,  value_max: 6,  time_threshold_sec: null, pulse: 1, islands: [2]      },
    3:  { name: 'הבנת טקסט מושמע',           value_threshold: 7,  value_max: 10, time_threshold_sec: null, pulse: 2, islands: [13, 14, 15] },
    4:  { name: 'מודעות לשונית',              value_threshold: 16, value_max: 22, time_threshold_sec: null, pulse: 2, islands: [11]     },
    5:  { name: 'קריאת 45 צירופים מנוקדים',  value_threshold: 38, value_max: 45, time_threshold_sec: 90,   pulse: 3, islands: [4, 5]   },
    6:  { name: 'קריאת 20 מילים מוכרות',     value_threshold: 18, value_max: 20, time_threshold_sec: 70,   pulse: 3, islands: [6, 12]  },
    7:  { name: 'קריאת 20 לא-מוכרות',         value_threshold: 14, value_max: 20, time_threshold_sec: 100,  pulse: 3, islands: [6, 7]   },
    8:  { name: 'קריאת סיפור 77 מילים',       value_threshold: 69, value_max: 77, time_threshold_sec: 195,  pulse: 3, islands: [8, 16]  },
    9:  { name: 'הכתבה',                       value_threshold: 21, value_max: 30, time_threshold_sec: null, pulse: 3, islands: [19, 20] },
    10: { name: 'הבנת הנקרא',                  value_threshold: 10, value_max: 12, time_threshold_sec: null, pulse: 3, islands: [16, 17] },
  });

  // ספי "near" — כמה אחוז מהרף נחשב "קרוב". §9 ב-spec: 80%-99% = near, <80% = fail.
  const NEAR_RATIO = 0.80;

  // ספי confidence מבוססי attempts. §7 ב-spec.
  const CONFIDENCE_HIGH_MIN = 30;
  const CONFIDENCE_MED_MIN  = 10;

  function _islandTotalAttempts(studentId, islandId) {
    if (!window.AvneiBKT) return 0;
    try {
      const island = AvneiBKT.getIslandState(studentId, islandId);
      if (island.total_attempts !== undefined) return island.total_attempts; // island 3
      return island.attempts || 0;
    } catch (e) { return 0; }
  }

  // מצב אי בודד עבור משימת ראמ"ה — מבוסס על checkMastery הקיים + תרגום ל-pass/near/fail/cold.
  function _islandStatusForRama(studentId, islandId, ramaTaskSpec) {
    if (!ISLAND_TO_RAMA[islandId]) {
      // אי מחוץ ל-MVP (11, 12, 13, 15, 16, 17, 19, 20) — אין proxy בכלל.
      return { islandId, status: 'cold', value: null, attempts: 0, met: false, reason: 'אי מחוץ ל-MVP' };
    }
    const m = checkMastery(studentId, islandId);
    const attempts = _islandTotalAttempts(studentId, islandId);
    const bktV = m.conditions.bkt && (typeof m.conditions.bkt.value === 'number') ? m.conditions.bkt.value : null;

    let status;
    if (m.met) {
      status = 'pass';
    } else if (bktV === null || attempts === 0) {
      status = 'cold';
    } else {
      // בשעה ש-pKnown יושב על סקאלת 0..1, הרף המספרי של המשימה הוא value_threshold/value_max.
      // למשל משימה 1: 18/22 = 0.818. ביצוע "near" = ≥ 80% מ-0.818 ≈ 0.654.
      const taskRatio = ramaTaskSpec.value_threshold / ramaTaskSpec.value_max;
      const nearCutoff = taskRatio * NEAR_RATIO;
      status = bktV >= nearCutoff ? 'near' : 'fail';
    }

    return { islandId, status, value: bktV, attempts, met: m.met, reason: m.reason };
  }

  // ערך מספרי "כמה ענתה נכון" עבור משימת ראמ"ה — מותאם פר משימה.
  // משימה 1 (אי 3): mastered letters out of 22 (דאטה אמיתית, לא proxy).
  // משימה 2 (אי 2): correct / total ניסיונות * 6 (proxy).
  // אחרות: BKT pKnown * value_max מעוגל (proxy).
  function _computeRamaValue(studentId, ramaTaskSpec, islandResults) {
    // משימה 1 — ספירת אותיות שנשלטו (real data ב-MVP)
    if (ramaTaskSpec.islands.length === 1 && ramaTaskSpec.islands[0] === 3 && window.AvneiBKT) {
      try {
        const dist = AvneiBKT.getLetterMasteryDistribution(studentId);
        return { value: dist.mastered, source: 'letter_count' };
      } catch (e) { /* fall through */ }
    }
    // ברירת מחדל — לקחת את ה-min(bkt value) בין האיים התורמים, להכפיל ב-value_max
    const valid = islandResults.filter(r => typeof r.value === 'number');
    if (valid.length === 0) return { value: null, source: 'none' };
    const minP = Math.min.apply(null, valid.map(r => r.value));
    return { value: Math.round(minP * ramaTaskSpec.value_max), source: 'bkt_proxy' };
  }

  function _aggregateStatuses(islandResults) {
    if (islandResults.length === 0) return 'cold';
    if (islandResults.every(r => r.status === 'cold')) return 'cold';
    // החלש מנצח: fail > near > pass (cold לא משנה אם יש דאטה חלקית)
    if (islandResults.some(r => r.status === 'fail')) return 'fail';
    if (islandResults.some(r => r.status === 'near')) return 'near';
    if (islandResults.every(r => r.status === 'pass' || r.status === 'cold')) {
      // pass רק אם יש לפחות אי אחד שעבר (אחרת cold)
      return islandResults.some(r => r.status === 'pass') ? 'pass' : 'cold';
    }
    return 'near';
  }

  function _confidenceFor(totalAttempts) {
    if (totalAttempts >= CONFIDENCE_HIGH_MIN) return 'high';
    if (totalAttempts >= CONFIDENCE_MED_MIN)  return 'med';
    return 'low';
  }

  function checkRamaTaskStatus(studentId, ramaTaskId) {
    studentId = studentId || 'local';
    const spec = RAMA_TASKS[ramaTaskId];
    if (!spec) {
      return {
        status: 'cold', value: null, threshold: null,
        confidence: 'low', contributingIslands: [], pulse: null,
        reason: `משימה ${ramaTaskId} לא קיימת ב-RAMA_TASKS`,
      };
    }

    const islandResults = spec.islands.map(id => _islandStatusForRama(studentId, id, spec));
    const { value, source } = _computeRamaValue(studentId, spec, islandResults);
    const totalAttempts = islandResults.reduce((s, r) => s + (r.attempts || 0), 0);
    const confidence = _confidenceFor(totalAttempts);

    // Status derivation:
    //   • source='letter_count' (משימה 1) — ספירה אמיתית של אותיות שנשלטו. נשווה ישירות
    //     ל-value_threshold. זה נכון פדגוגית יותר מ-BKT proxy כי 1 אות מצוינת מתוך 22
    //     אינה "near 18/22" — היא בבירור fail.
    //   • אחרת — aggregate סטטוסי האיים התורמים (החלש מנצח, §10 ב-spec).
    let status;
    if (source === 'letter_count' && typeof value === 'number') {
      if (totalAttempts === 0) {
        status = 'cold';
      } else if (value >= spec.value_threshold) {
        status = 'pass';
      } else if (value >= spec.value_threshold * NEAR_RATIO) {
        status = 'near';
      } else {
        status = 'fail';
      }
    } else {
      status = _aggregateStatuses(islandResults);
    }

    const reasonParts = islandResults.map(r =>
      `אי ${r.islandId}: ${r.status}${typeof r.value === 'number' ? ` (p=${r.value.toFixed(2)})` : ''}`
    );

    return {
      status,
      value,
      threshold: spec.value_threshold,
      value_max: spec.value_max,
      time_threshold_sec: spec.time_threshold_sec,
      confidence,
      contributingIslands: spec.islands.slice(),
      pulse: spec.pulse,
      task_name: spec.name,
      total_attempts: totalAttempts,
      value_source: source,
      island_breakdown: islandResults,
      reason: reasonParts.join(' · '),
    };
  }

  // ============================================================
  // A.5 — Cold-start Protocol
  // ============================================================
  // מסביר למורה למה היא רואה ⚫ ליד תלמידה חדשה. שילוב של 2 קריטריונים
  // (ימים + ניסיונות) — שניהם חייבים להתקיים כדי לצאת מ-cold-start.
  // החלטה פדגוגית של מיטל (27.5.2026 לילה).
  //
  // למה שילוב ולא רק ניסיונות:
  //   • ילדה ביום 1 עם 50 ניסיונות = עדיין cold (לא נתנו לה זמן לטעות)
  //   • ילדה ביום 5 עם 5 ניסיונות = עדיין cold (אין מספיק דאטה לציון)
  //   • רק יום 3+ AND 30+ ניסיונות → יוצאים מ-cold-start, המורה רואה ציונים אמיתיים
  //
  // לא נוגעים ב-profile-classifier.js (אחריות אחרת). entry_date כבר נשמר ב-StudentsStore
  // בכל הוספת תלמידה — ניצול נכס קיים. Fallback אם entry_date חסר:
  // earliest event timestamp → אם גם זה ריק → Date.now() (טרי).
  //
  // השפעה רק על UI מורה (F.21A · F.21E עתידי). הילדה משחקת רגיל ולא יודעת על cold-start.
  // ============================================================

  const COLD_START_DAYS = 3;
  const COLD_START_ATTEMPTS = 30;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const STUDENTS_KEY = 'avnei-yesod-students';

  function _getFirstSeenAt(studentId) {
    // 1) student.entry_date (StudentsStore.add() כותב את זה בכל יצירה)
    try {
      const raw = localStorage.getItem(STUDENTS_KEY);
      if (raw) {
        const students = JSON.parse(raw);
        const s = Array.isArray(students) ? students.find(x => x && x.id === studentId) : null;
        if (s && s.entry_date) {
          const t = new Date(s.entry_date).getTime();
          if (!isNaN(t)) return t;
        }
      }
    } catch (e) {}
    // 2) Fallback — earliest event timestamp לאותה תלמידה
    try {
      const stateRaw = localStorage.getItem(STATE_KEY);
      if (stateRaw) {
        const state = JSON.parse(stateRaw);
        const events = (state.events || []).filter(e =>
          (e.student_id || 'local') === studentId && typeof e.timestamp === 'number'
        );
        if (events.length > 0) {
          return events.reduce((min, e) => e.timestamp < min ? e.timestamp : min, Infinity);
        }
      }
    } catch (e) {}
    // 3) ברירת מחדל — עכשיו (תלמידה טריה, אין דאטה בכלל)
    return Date.now();
  }

  function _totalAttemptsAllStrands(studentId) {
    if (!window.AvneiBKT || typeof AvneiBKT.getStrandState !== 'function') return 0;
    let total = 0;
    for (let s = 1; s <= 5; s++) {
      try {
        const strand = AvneiBKT.getStrandState(studentId, s);
        total += (strand && typeof strand.attempts === 'number') ? strand.attempts : 0;
      } catch (e) {}
    }
    return total;
  }

  function isInColdStart(studentId) {
    studentId = studentId || 'local';
    const firstSeenAt = _getFirstSeenAt(studentId);
    const daysSince = Math.floor((Date.now() - firstSeenAt) / MS_PER_DAY);
    const attemptsTotal = _totalAttemptsAllStrands(studentId);
    const daysCriterion = daysSince >= COLD_START_DAYS;
    const attemptsCriterion = attemptsTotal >= COLD_START_ATTEMPTS;
    // יוצאים מ-cold-start רק כששני הקריטריונים מתקיימים יחד.
    const inColdStart = !(daysCriterion && attemptsCriterion);
    return {
      inColdStart,
      daysSince,
      attemptsTotal,
      daysCriterion,
      attemptsCriterion,
    };
  }

  // ============================================================
  // API
  // ============================================================
  return {
    checkMastery,
    checkAndShowIslandCelebration,
    getClosedIslands,
    markIslandClosed,
    showIslandCelebration,  // חשוף לבדיקות ידניות
    ISLAND_TO_RAMA,
    MIN_ITEMS_PER_SESSION_DAY,
    REQUIRED_CONSECUTIVE_SESSIONS,
    // ---- F.21A — RAMA task lens ----
    checkRamaTaskStatus,
    RAMA_TASKS,
    NEAR_RATIO,
    CONFIDENCE_HIGH_MIN,
    CONFIDENCE_MED_MIN,
    // ---- A.5 — Cold-start Protocol ----
    isInColdStart,
    COLD_START_DAYS,
    COLD_START_ATTEMPTS,
  };
})();
