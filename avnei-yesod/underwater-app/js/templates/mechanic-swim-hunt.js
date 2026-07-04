// ============================================================
// templates/mechanic-swim-hunt.js — צַיִד בִּתְנוּעָה (אי ש · A5 · 4.7.2026)
//
// וריאנט-בתנועה של mechanic-tap-all: דגיגים שטים לאט על המסך, כל דג
// נושא אות. הילד.ה נוגע.ת רק בדגים שנושאים את אות-היעד. דג נכון שוחה
// בשמחה אל נוני; דג שגוי מנענע סנפיר וממשיך לשוט.
//
//   mechanic_config: {
//     displayLetter: "שׁ",          // הצורה המוצגת (שי"ן ימנית עם נקודה)
//     promptLabel:   "...",         // טקסט ילד.ה: מנוקד, לשון רבים
//     rounds: [                     // pack mode — סבב שונה בכל פעם
//       { "fish": 5, "targets": 2, "distractor": "ת" },
//       ...
//     ]
//   }
//
// כללי עדינות (מהחלטת הגיוון 4.7.2026):
//   - בלי טיימר ובלי לחץ-זמן. דג שיוצא מהמסך חוזר מהצד השני (wrap).
//   - תנועה איטית (~22-36px/s) + hitbox מרופד ≥64px — יעד מגע אפקטיבי
//     נשאר מעל 56px גם בתנועה.
//   - טעות לא "מפסידה" — פידבק עדין (נענוע סנפיר) והדג ממשיך.
//   - prefers-reduced-motion: הדגים מרחפים במקום (בלי תנועה אופקית).
//
// לקחי אי 4 (reference-avnei-yesod-island-build-checklist):
//   - אודיו ההנחיה מתנגן פעם אחת ב-mount של כל סבב (+ רמקול לחזרה
//     חופשית — האזנה לא נמדדת). אחרי תשובה נכונה: צליל-אות → שבח מגוון,
//     בלי לחזור על אודיו ההוראה.
//   - pack mode: אות מסיחה שונה בכל סבב (rounds מהקונפיג).
//   - צבעי הדגים = גיוון חזותי בלבד, מוקצים רנדומלית — לא מקודדים
//     נכון/שגוי (אסור צבעי-סטטוס במסכי ילד).
//
// Support model — זהה ל-mechanic-tap-all:
//   wrong-1: נענוע סנפיר בלבד (בלי אודיו)
//   wrong-2: hint-glow על דג-יעד + השמעת צליל האות
//   wrong-3+: hint-glow + 'press-here'
//   auto-hint אחרי 9 שניות חוסר-פעילות.
//
// Logging: כל נגיעה (נכונה/שגויה) → logActivityResult עם target_letter
// (חובה ל-EPA — בלעדיו ingestEvent מדלג), primary_island_id:3 מפורש
// (resolveIslandId מכבד אותו — אין צורך לגעת ב-event-logger),
// secondary_island_ids:[2] (ציד-צליל, כמו storm-quest).
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['swim-hunt'] = (function () {

  const PRAISE_POOL = ['praise-metzuyan', 'praise-mealeh']; // בלי "יופי" — הגייה לא טובה ב-eleven_v3 (מיטל 4.7.2026)
  const INTER_ROUND_DELAY_MS = 2000;
  // מסלולי-רוחב קבועים (top % בתוך שדה השחייה) — דג אחד פר מסלול ⇒ אין
  // חפיפת דגים לעולם. המסלול התחתון מוגבל ל-74% כדי שהדג לא ייחתך.
  const LANES = [4, 18, 32, 46, 60, 74];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, opts) {
    const letter        = opts.letter;                       // 'ש' — למיפוי אודיו + logging
    const cfg           = opts.mechanicConfig || {};
    const displayLetter = cfg.displayLetter || letter;       // 'שׁ' — הצורה שהילד.ה רואה
    const promptLabel   = cfg.promptLabel ||
      'גְּעוּ בְּכֹל הַדָּגִים עִם הָאוֹת <strong>' + displayLetter + '</strong>!';
    const fallbackPool  = (opts.distractors || []).filter(d => d !== letter);
    const rounds        = Array.isArray(cfg.rounds) && cfg.rounds.length
      ? cfg.rounds
      : [{ fish: 5, targets: 2, distractor: fallbackPool[0] || 'ת' }];
    const total         = rounds.length;
    const inGamePromptKey = opts.inGamePromptAudioKey || null;
    const reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (window.AvneiAudio) AvneiAudio.preload('press-here');

    root.innerHTML = '';
    root.classList.add('mechanic-swim-hunt');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    // prompt bar — האות הגדולה (עם נקודת השי"ן) + הוראה + רמקול.
    // נגיעה ברמקול = האזנה חופשית, לא נמדדת (דפוס two-tap).
    const promptBar = document.createElement('div');
    promptBar.className = 'swim-prompt';
    promptBar.innerHTML =
      '<span class="swim-prompt__letter" aria-hidden="true">' + displayLetter + '</span>' +
      '<span class="swim-prompt__label">' + promptLabel + '</span>' +
      '<button type="button" class="swim-prompt__speaker" aria-label="הַקְשִׁיבוּ שׁוּב לַהַסְבֵּר">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
          '<path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/>' +
          '<path d="M15.5 8.5a4 4 0 0 1 0 7M18 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
        '</svg>' +
      '</button>';
    root.appendChild(promptBar);
    promptBar.querySelector('.swim-prompt__speaker')
      .addEventListener('click', playPromptOrLetterSound);

    const field = document.createElement('div');
    field.className = 'swim-field';
    root.appendChild(field);

    const state = {
      roundIdx: 0,
      foundInRound: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
      fishes: [],           // { el, body, x, dir, speed, isTarget, found, idx }
      rafId: null,
      lastTs: null,
      fieldW: 0,
      availablePraises: PRAISE_POOL.slice(),
      praiseTimer: null,
      praiseCleanup: null,
    };

    function currentRound() { return rounds[state.roundIdx] || rounds[0]; }

    function playPromptOrLetterSound() {
      if (!window.AvneiAudio) return;
      if (inGamePromptKey) AvneiAudio.play(inGamePromptKey);
      else AvneiAudio.playLetterSound(letter);
    }

    // --- שבח: צליל-אות → onended → 220ms → שבח (דפוס mechanic-tap-all) ---
    function pickNextPraise() {
      if (state.availablePraises.length === 0) {
        state.availablePraises = PRAISE_POOL.slice();
      }
      const idx = Math.floor(Math.random() * state.availablePraises.length);
      return state.availablePraises.splice(idx, 1)[0];
    }

    function cancelPendingPraise() {
      if (state.praiseTimer) { clearTimeout(state.praiseTimer); state.praiseTimer = null; }
      if (state.praiseCleanup) { state.praiseCleanup(); state.praiseCleanup = null; }
    }

    function playRightHitAudio() {
      if (!window.AvneiAudio) return;
      cancelPendingPraise();
      const letterKey = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[letter];
      const praise = pickNextPraise();
      if (!letterKey) { AvneiAudio.play(praise); return; }
      AvneiAudio.play(letterKey);
      const letterAudio = AvneiAudio.preload(letterKey);
      const onLetterEnded = () => {
        if (state.praiseCleanup) state.praiseCleanup();
        state.praiseCleanup = null;
        state.praiseTimer = setTimeout(() => {
          AvneiAudio.play(praise);
          state.praiseTimer = null;
        }, 220);
      };
      letterAudio.addEventListener('ended', onLetterEnded, { once: true });
      state.praiseCleanup = () => letterAudio.removeEventListener('ended', onLetterEnded);
    }

    // --- בניית סבב -------------------------------------------------------
    function buildRound() {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      field.innerHTML = '';
      state.fishes = [];
      state.foundInRound = 0;
      state.attempts = 0;
      state.locked = false;
      state.fieldW = field.clientWidth || root.clientWidth || 600;

      const round = currentRound();
      const fishCount   = Math.min(round.fish || 5, LANES.length);
      const targetCount = Math.min(round.targets || 2, fishCount - 1);
      const distractor  = round.distractor || fallbackPool[0] || 'ת';

      // אות מסיחה אחת פר סבב (pack mode) — היעד תמיד displayLetter
      const letters = shuffle(
        Array(targetCount).fill(displayLetter)
          .concat(Array(fishCount - targetCount).fill(distractor))
      );
      const lanes = shuffle(LANES.slice()).slice(0, fishCount);

      letters.forEach((ltr, i) => {
        const isTarget = (ltr === displayLetter);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'swim-fish fish-' + (i % 3); // גיוון צבע — לא מקודד נכונות
        el.setAttribute('aria-label', 'דָּג עִם הָאוֹת ' + ltr);
        const dir = Math.random() < 0.5 ? -1 : 1;
        if (dir === 1) el.classList.add('swim-right');
        el.innerHTML =
          '<span class="swim-fish__body" aria-hidden="true"></span>' +
          '<span class="swim-fish__letter">' + ltr + '</span>';
        el.style.top = lanes[i] + '%';

        const fish = {
          el,
          x: Math.random() * state.fieldW,           // פיזור התחלתי לרוחב
          dir,
          speed: reducedMotion ? 0 : (22 + Math.random() * 14),  // px/s — איטי
          isTarget,
          found: false,
          idx: i + 1,
        };
        el.style.transform = 'translateX(' + fish.x + 'px)';
        el.addEventListener('click', () => handleTap(fish));
        field.appendChild(el);
        state.fishes.push(fish);
      });

      state.lastShownAt = Date.now();
      if (window.AvneiNoni) AvneiNoni.setState('idle');
      // אודיו ההנחיה — פעם אחת ב-mount של הסבב (לקח אי 4)
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playPromptOrLetterSound, 300);
      }
      scheduleAutoHint();
      startSwim();
    }

    // --- לולאת התנועה (rAF) — wrap-around, בלי טיימר-משחק ---------------
    function startSwim() {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.lastTs = null;
      const step = (ts) => {
        if (state.lastTs == null) state.lastTs = ts;
        const dt = Math.min((ts - state.lastTs) / 1000, 0.1);
        state.lastTs = ts;
        const W = state.fieldW;
        state.fishes.forEach(f => {
          if (f.found) return;
          f.x += f.speed * f.dir * dt;
          const fw = f.el.offsetWidth || 100;
          if (f.dir > 0 && f.x > W)        f.x = -fw;       // יצא ימינה → חוזר משמאל
          else if (f.dir < 0 && f.x < -fw) f.x = W;         // יצא שמאלה → חוזר מימין
          f.el.style.transform = 'translateX(' + f.x + 'px)';
        });
        state.rafId = requestAnimationFrame(step);
      };
      state.rafId = requestAnimationFrame(step);
    }

    function onResize() {
      state.fieldW = field.clientWidth || root.clientWidth || 600;
    }
    window.addEventListener('resize', onResize);

    // --- hint ------------------------------------------------------------
    function scheduleAutoHint() {
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(() => {
        if (state.locked) return;
        triggerHint();
      }, 9000);
    }

    function remainingTargets() {
      return state.fishes.filter(f => f.isTarget && !f.found);
    }

    function triggerHint() {
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      const rem = remainingTargets();
      if (!rem.length) return;
      rem[Math.floor(Math.random() * rem.length)].el.classList.add('hint-glow');
      playPromptOrLetterSound();
    }

    // --- נגיעה בדג --------------------------------------------------------
    function handleTap(fish) {
      if (state.locked || fish.found) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      cancelPendingPraise();

      const isCorrect = fish.isTarget;
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger) {
        AvneiEventLogger.logActivityResult({
          activity_type: 'swim-hunt',
          target_letter: letter,                       // חובה — בלעדיו EPA מדלג
          item_id: opts.questId + '-r' + (state.roundIdx + 1) + '-fish-' + fish.idx,
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: state.attempts + 1,
          response_time_ms: isCorrect ? responseTime : null,
          hint_used: state.attempts >= 1,
          primary_island_id: 3,
          secondary_island_ids: [2],                   // ציד-לפי-צליל, כמו storm-quest
          rama_task_alignment: opts.rama_task_alignment,
          peima_target:        opts.peima_target,
        });
      }

      if (isCorrect) onRightFish(fish);
      else onWrongFish(fish);
    }

    function onRightFish(fish) {
      fish.found = true;
      fish.el.classList.remove('hint-glow');
      state.foundInRound++;
      state.attempts = 0;
      state.lastShownAt = Date.now();

      // הדג שוחה בשמחה אל נוני — וקטור מחושב אל תמונת נוני הקבועה.
      // ה-transform הסופי נכתב inline (על בסיס ה-x הנוכחי), כי המיקום
      // השוטף גם הוא inline transform — class עם !important היה מקפיץ.
      const noni = document.getElementById('noniImg');
      let targetX = fish.x, targetY = -80;
      if (noni) {
        const nr = noni.getBoundingClientRect();
        const fr = fish.el.getBoundingClientRect();
        targetX = fish.x + (nr.left + nr.width / 2) - (fr.left + fr.width / 2);
        targetY = (nr.top + nr.height / 2) - (fr.top + fr.height / 2);
      }
      fish.el.classList.add('found');
      requestAnimationFrame(() => {
        fish.el.style.transform =
          'translate(' + targetX + 'px, ' + targetY + 'px) scale(0.25)';
      });

      const roundDone = state.foundInRound >= state.fishes.filter(f => f.isTarget).length;
      const isLastHitOfGame = roundDone && (state.roundIdx + 1) >= total;

      // הקשה אחרונה של המשחק: רק צליל-אות (ה-finale מנגן שבח בעצמו)
      if (isLastHitOfGame) {
        cancelPendingPraise();
        if (window.AvneiAudio) AvneiAudio.playLetterSound(letter);
      } else {
        playRightHitAudio();
      }
      if (window.AvneiGameShell) AvneiGameShell.cheerNoni();

      if (roundDone) {
        state.locked = true;
        if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
        if (typeof addPearl === 'function') addPearl(1);
        opts.onUnitWon && opts.onUnitWon(state.roundIdx);

        if (isLastHitOfGame) {
          setTimeout(() => opts.onComplete && opts.onComplete(), 1200);
        } else {
          setTimeout(() => {
            state.roundIdx++;
            buildRound();
          }, INTER_ROUND_DELAY_MS);
        }
        return;
      }
      scheduleAutoHint();
    }

    function onWrongFish(fish) {
      state.attempts++;
      // נענוע סנפיר עדין — על גוף הדג (ה-transform של המיקום נשאר על הכפתור)
      const body = fish.el.querySelector('.swim-fish__body');
      if (body) {
        body.classList.add('fin-shake');
        setTimeout(() => body.classList.remove('fin-shake'), 700);
      }

      if (state.attempts === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        const rem = remainingTargets();
        if (rem.length) rem[0].el.classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.playLetterSound(letter), 400);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        const rem = remainingTargets();
        if (rem.length) rem[0].el.classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 400);
      }
    }

    buildRound();

    return {
      unmount() {
        if (state.rafId) cancelAnimationFrame(state.rafId);
        if (state.hintTimer) clearTimeout(state.hintTimer);
        cancelPendingPraise();
        window.removeEventListener('resize', onResize);
        root.innerHTML = '';
        root.classList.remove('mechanic-swim-hunt');
      },
    };
  }

  return { mount };
})();
