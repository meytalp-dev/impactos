// ============================================================================
// templates/mechanic-cv-summary.js — משחקון-סיכום חמישייה ("שרשרת הפנינים")
// 3.7.2026 · cumulative review לסוף פרק (אי 4, per_cv)
//
// מטרה (spec: _handoff/2026-07-03-summary-minigame-spec.md):
//   מתרגל בבת-אחת את הצירופים של 5 אותיות שנלמדו ("חמישייה"), מעורבב
//   (interleaving) ומשוקלל-לחלשים, ועונה "האם החמישייה יושבת?".
//
// לולאה מעורבת (החלטת מיטל):
//   מצב 'listen' (זיהוי): נוני משמיע צליל → הילדה נוגעת בצירוף הנכון.
//   מצב 'read'  (קריאה):  הלוח מראה צירוף → הילדה בוחרת את הצליל הנכון (רמקול).
//   phoneme-group-accept: מַ/מָ = אותו /a/ (תואם per_cv + vowel-adapter).
//
// נרטיב: שרשרת הפנינים — כל צירוף נכון = פנינה בשרשרת; סיום = שרשרת שלמה.
//
// הסט נגזר אוטומטית: כל תאי per_cv הקיימים ל-5 האותיות (getWeakestCVs לשקלול).
//   ⇒ "האותיות × התנועות שנלמדו" בלי הגדרת תוכן ידנית.
//
// דיווח: כל סבב שולח event פר-CV (primary_island_id:4, target_letter,
//   target_phoneme_group) → מזין את ה-BKT per_cv → סוגר את הטריגר האוטומטי.
//
// חשיפה לבדיקות: window.AvneiMechanics['cv-summary']._logic (+ CommonJS export).
// טסטים: scripts/test-mechanic-cv-summary.js
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Resolvers (עובד גם בדפדפן וגם ב-Node mock)
  // --------------------------------------------------------------------------
  function getBKT() {
    if (typeof window !== 'undefined' && window.AvneiBKT) return window.AvneiBKT;
    if (typeof global !== 'undefined' && global.AvneiBKT) return global.AvneiBKT;
    return null;
  }
  function getVA() {
    if (typeof window !== 'undefined' && window.AvneiVowelAdapter) return window.AvneiVowelAdapter;
    if (typeof global !== 'undefined' && global.AvneiVowelAdapter) return global.AvneiVowelAdapter;
    return null;
  }

  // pilot fallback — אם לאות אין תאי per_cv עדיין, מתרגלים אותה עם /a/ (קמץ/פתח).
  const FALLBACK_GROUP = 'a';
  const WEAK_THRESHOLD = 0.70;  // תואם CV_WEAK_THRESHOLD ב-bkt.js

  // canonicalVowelForGroup('a') → vowelId (למשל 'kamatz') לבניית CV + audio key.
  function canonicalVowelForGroup(VA, group) {
    if (!VA || typeof VA.getVowelsInGroup !== 'function') return null;
    const vs = VA.getVowelsInGroup(group);
    return (vs && vs.length) ? vs[0].id : null;
  }

  // --------------------------------------------------------------------------
  // לוגיקה טהורה #1 — גזירת הסט מהחמישייה
  // מחזיר [{ key, letter, group, pKnown, mastered }] — כל צירוף שנלמד ל-5 האותיות.
  // מקור: checkMastery(4).per_cv (כל התאים הקיימים). אות ללא תאים → fallback /a/.
  // --------------------------------------------------------------------------
  function buildSummarySet(sid, letters) {
    const BKT = getBKT();
    let perCV = {};
    if (BKT && typeof BKT.checkMastery === 'function') {
      try {
        const cm = BKT.checkMastery(sid, 4);
        perCV = (cm && cm.per_cv) ? cm.per_cv : {};
      } catch (e) { perCV = {}; }
    }
    const set = [];
    (letters || []).forEach(function (letter) {
      const keys = Object.keys(perCV).filter(function (k) { return perCV[k].letter === letter; });
      if (keys.length === 0) {
        // fallback — האות תופיע עם /a/ גם אם עדיין אין דאטה.
        set.push({ key: letter + '_' + FALLBACK_GROUP, letter: letter, group: FALLBACK_GROUP, pKnown: null, mastered: false });
      } else {
        keys.forEach(function (k) {
          set.push({
            key: k,
            letter: letter,
            group: perCV[k].phoneme_group,
            pKnown: (typeof perCV[k].pKnown === 'number') ? perCV[k].pKnown : null,
            mastered: !!perCV[k].mastered,
          });
        });
      }
    });
    return set;
  }

  // --------------------------------------------------------------------------
  // לוגיקה טהורה #2 — לוח סבבים: שקלול-לחלשים + interleaving + ערבוב מצבים
  // מחזיר [{ key, letter, group, mode }] באורך numTrials.
  //   • משקל: צירוף חלש (לא-נשלט / pKnown < סף) = משקל כפול.
  //   • interleaving: נמנע חזרה על אותה אות בסבבים עוקבים כשיש חלופה.
  //   • mode: מתחלף 'listen'/'read' באיזון (ערבוב).
  // rng אופציונלי (לבדיקות דטרמיניסטיות); ברירת מחדל Math.random.
  // --------------------------------------------------------------------------
  function buildTrialSchedule(set, numTrials, rng) {
    const rand = (typeof rng === 'function') ? rng : Math.random;
    const n = (typeof numTrials === 'number' && numTrials > 0) ? numTrials : 8;
    if (!Array.isArray(set) || set.length === 0) return [];

    function isWeak(item) {
      if (item.mastered) return false;
      if (item.pKnown === null) return true;           // טרם תורגל → חשוב לחזור
      return item.pKnown < WEAK_THRESHOLD;
    }

    // מאגר משוקלל — חלש = פעמיים.
    const pool = [];
    set.forEach(function (item) {
      const w = isWeak(item) ? 2 : 1;
      for (let i = 0; i < w; i++) pool.push(item);
    });

    // בחירת סבבים עם interleaving (נמנע אות עוקבת זהה כשאפשר).
    const trials = [];
    let lastLetter = null;
    for (let t = 0; t < n; t++) {
      let candidates = pool.filter(function (it) { return it.letter !== lastLetter; });
      if (candidates.length === 0) candidates = pool.slice();  // אין ברירה — מרשים חזרה
      const pick = candidates[Math.floor(rand() * candidates.length)];
      trials.push({ key: pick.key, letter: pick.letter, group: pick.group, mode: null });
      lastLetter = pick.letter;
    }

    // ערבוב מצבים מאוזן: listen/read לסירוגין, נקודת התחלה מתחלפת.
    const startListen = rand() < 0.5;
    trials.forEach(function (tr, i) {
      const listen = ((i % 2) === 0) ? startListen : !startListen;
      tr.mode = listen ? 'listen' : 'read';
    });
    return trials;
  }

  // --------------------------------------------------------------------------
  // לוגיקה טהורה #3 — הערכת סיום: "האם החמישייה יושבת?"
  // מחזיר { sits, total, masteredCount, weakCVs:[{key,displayHe}] }.
  // sits = כל צירופי הסט ב-mastery (אחרי המשחק, נקרא מחדש מה-BKT).
  // --------------------------------------------------------------------------
  function evaluateSummary(sid, letters) {
    const set = buildSummarySet(sid, letters);
    const BKT = getBKT();
    let total = set.length, masteredCount = 0;
    const weakCVs = [];
    set.forEach(function (item) {
      let mastered = item.mastered;
      // קריאה טרייה מה-BKT (אחרי סבבי המשחק).
      if (BKT && typeof BKT.getCVState === 'function') {
        try {
          const s = BKT.getCVState(sid, item.key);
          if (s) mastered = s.mastered;
        } catch (e) {}
      }
      if (mastered) masteredCount++;
      else weakCVs.push({ key: item.key, displayHe: cvDisplay(item.key) });
    });
    return {
      sits: total > 0 && masteredCount === total,
      total: total,
      masteredCount: masteredCount,
      weakCVs: weakCVs,
    };
  }

  function cvDisplay(key) {
    const BKT = getBKT();
    if (BKT && typeof BKT.cvDisplayHe === 'function') {
      try { return BKT.cvDisplayHe(key); } catch (e) {}
    }
    return key;
  }

  // --------------------------------------------------------------------------
  // DOM — כלי עזר לבניית לוח סבב + מסיחים
  // --------------------------------------------------------------------------
  function playKey(key) {
    if (typeof window !== 'undefined' && window.AvneiAudio &&
        typeof window.AvneiAudio.play === 'function' && key) {
      window.AvneiAudio.play(key);
    }
  }
  function shuffle(arr, rand) {
    const r = (typeof rand === 'function') ? rand : Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // בחירת מסיחים לסבב — צירופים אחרים מהסט (קונפוזביליים פדגוגית), עד N.
  // מעדיף קבוצת-צליל שונה מהמטרה (אחרת שני tiles נשמעים זהה).
  function pickDistractors(set, target, count, rand) {
    const others = set.filter(function (it) {
      return it.key !== target.key && it.group !== target.group;
    });
    const shuffled = shuffle(others.length >= count ? others : set.filter(function (it) { return it.key !== target.key; }), rand);
    return shuffled.slice(0, count);
  }

  // --------------------------------------------------------------------------
  // mount — המסך החי
  // opts: { letters:[...], studentId, numTrials, onPearl, onComplete }
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    const options = opts || {};
    const VA = getVA();
    if (!VA) {
      console.error('[mechanic-cv-summary] AvneiVowelAdapter חסר');
      return { unmount: function () {} };
    }
    const sid = options.studentId || 'local';
    const letters = Array.isArray(options.letters) && options.letters.length
      ? options.letters : ['ת', 'מ', 'ר', 'ב', 'ק'];

    const set = buildSummarySet(sid, letters);
    const numTrials = (options.numTrials && options.numTrials > 0)
      ? options.numTrials : Math.max(6, Math.min(12, set.length * 2));
    const schedule = buildTrialSchedule(set, numTrials);

    // --- DOM scaffold ---
    root.innerHTML = '';
    root.classList.add('cv-summary');

    const chain = document.createElement('div');
    chain.className = 'cv-summary-chain';
    chain.setAttribute('aria-label', 'שרשרת הפנינים');
    for (let i = 0; i < numTrials; i++) {
      const slot = document.createElement('span');
      slot.className = 'cv-summary-pearl';
      slot.dataset.idx = String(i);
      chain.appendChild(slot);
    }
    root.appendChild(chain);

    const prompt = document.createElement('div');
    prompt.className = 'cv-summary-prompt';
    prompt.innerHTML =
      '<button class="cv-summary-target" id="cvSumTarget" type="button" aria-label="הקש לשמוע"></button>' +
      '<div class="cv-summary-hint" id="cvSumHint"></div>';
    root.appendChild(prompt);

    const board = document.createElement('div');
    board.className = 'cv-summary-board';
    board.id = 'cvSumBoard';
    root.appendChild(board);

    const state = { trial: 0, locked: false, correctCount: 0 };

    function currentTrial() { return schedule[state.trial]; }

    function targetCV(tr) {
      const vid = canonicalVowelForGroup(VA, tr.group);
      return { cv: VA.buildCV(tr.letter, vid), audioKey: VA.cvAudioKey(tr.letter, vid), vid: vid };
    }

    function renderTrial() {
      const tr = currentTrial();
      if (!tr) return;
      state.locked = false;
      const t = targetCV(tr);
      const targetEl = document.getElementById('cvSumTarget');
      const hintEl = document.getElementById('cvSumHint');
      board.innerHTML = '';

      // מסיחים + מטרה מעורבבים.
      const distractors = pickDistractors(set, tr, 3);
      const optionItems = shuffle([tr].concat(distractors));

      if (tr.mode === 'listen') {
        // זיהוי: 🔊 מטרה → נוגעת בצירוף הנכון.
        targetEl.className = 'cv-summary-target audio-only';
        targetEl.innerHTML = '<span class="cv-summary-audio-icon">🔊</span>';
        hintEl.textContent = 'הַקְשִׁיבוּ — וְגַעוּ בַּצֵּרוּף';
        optionItems.forEach(function (it) {
          const vid = canonicalVowelForGroup(VA, it.group);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cv-summary-tile cv-summary-tile--cv';
          btn.textContent = VA.buildCV(it.letter, vid);
          btn.setAttribute('aria-label', 'צירוף ' + VA.buildCV(it.letter, vid));
          btn.addEventListener('click', function () { onChoose(it, btn); });
          board.appendChild(btn);
        });
        setTimeout(function () { playKey(t.audioKey); }, 350);
      } else {
        // קריאה: מציג צירוף → בוחרת את הצליל הנכון (רמקול).
        targetEl.className = 'cv-summary-target glyph';
        targetEl.innerHTML = t.cv;
        hintEl.textContent = 'אֵיזֶה צְלִיל? גַעוּ בָּרַמְקוֹל הַנָּכוֹן';
        optionItems.forEach(function (it) {
          const vid = canonicalVowelForGroup(VA, it.group);
          const audioKey = VA.cvAudioKey(it.letter, vid);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cv-summary-tile cv-summary-tile--sound';
          btn.innerHTML = '<span class="cv-summary-audio-icon">🔊</span>';
          btn.setAttribute('aria-label', 'צליל אפשרי');
          btn.addEventListener('click', function () {
            playKey(audioKey);           // מנגן את המועמד
            onChoose(it, btn);
          });
          board.appendChild(btn);
        });
      }
    }

    // phoneme-group-accept: נכון אם אותה אות + אותה קבוצת-צליל.
    function isCorrectChoice(chosen, tr) {
      return chosen.letter === tr.letter && chosen.group === tr.group;
    }

    function logTrial(tr, correct) {
      if (typeof window === 'undefined' || !window.AvneiEventLogger ||
          typeof window.AvneiEventLogger.logActivityResult !== 'function') return;
      try {
        window.AvneiEventLogger.logActivityResult({
          activity_type: 'cv-summary',
          mode: tr.mode,
          target_letter: tr.letter,
          target_phoneme_group: tr.group,
          target_cv: targetCV(tr).cv,
          item_id: 'summary-trial-' + (state.trial + 1),
          is_correct: correct,
          response_time_ms: null,
          primary_island_id: 4,
          secondary_island_ids: [3],
        });
      } catch (e) {}
    }

    function onChoose(chosen, btn) {
      if (state.locked) return;
      const tr = currentTrial();
      const correct = isCorrectChoice(chosen, tr);
      logTrial(tr, correct);

      if (!correct) {
        btn.classList.add('wrong');
        setTimeout(function () { btn.classList.remove('wrong'); }, 500);
        // עזר: השמע שוב את צליל המטרה (מצב listen) — פעם אחת, לא ספאם.
        if (tr.mode === 'listen') setTimeout(function () { playKey(targetCV(tr).audioKey); }, 400);
        return;
      }

      // נכון — פנינה מצטרפת + חגיגה ויזואלית (בלי לחזור על אותו אודיו).
      state.locked = true;
      btn.classList.add('correct');
      const pearl = chain.querySelector('.cv-summary-pearl[data-idx="' + state.trial + '"]');
      if (pearl) pearl.classList.add('filled', 'just-added');
      state.correctCount++;
      if (typeof options.onPearl === 'function') options.onPearl(state.trial, state.correctCount);

      state.trial++;
      if (state.trial >= schedule.length) {
        setTimeout(function () {
          const result = evaluateSummary(sid, letters);
          if (typeof options.onComplete === 'function') options.onComplete(result);
        }, 900);
        return;
      }
      setTimeout(function () {
        const p = chain.querySelector('.cv-summary-pearl.just-added');
        if (p) p.classList.remove('just-added');
        renderTrial();
      }, 900);
    }

    renderTrial();

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('cv-summary');
      },
    };
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------
  const LOGIC = {
    buildSummarySet: buildSummarySet,
    buildTrialSchedule: buildTrialSchedule,
    evaluateSummary: evaluateSummary,
  };

  if (typeof window !== 'undefined') {
    window.AvneiMechanics = window.AvneiMechanics || {};
    window.AvneiMechanics['cv-summary'] = { mount: mount, _logic: LOGIC };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mount: mount, _logic: LOGIC };
  }
})();
