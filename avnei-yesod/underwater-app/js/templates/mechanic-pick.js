// ============================================================
// templates/mechanic-pick.js — Round-based pick-correct mechanic
//
// בכל סבב מוצגים podsPerRound bubbles, רק אחת עם האות-יעד. הילד
// מקיש על הנכון → onUnitWon. אחרי total סבבים נכונים → onComplete.
//
// D.15 v2 update (27.5.2026):
//   - השמיע ההוראה במשחק עוברת מ-playLetterSound ל-inGamePromptAudioKey
//     (find-<letter-key>.mp3 — אותו דפוס כמו tap-all)
//   - תשובה נכונה: צליל-אות → 220ms → שבח רנדומלי מתוך
//     praise-yofi/metzuyan/mealeh (pick-without-replacement)
//   - cancelPendingPraise למניעת overlap בהקשות מהירות
//
// תאימות אחור: stage-3-rescue.html (משחקון אמנותי לאות ק) משתמש בקוד
// משלו, לא ב-mechanic זה — שינוי כאן לא משפיע עליו.
//
// Support model — זהה ל-mechanic-tap-all:
//   wrong-1: visual sway only
//   wrong-2: hint-glow on correct pod + play letter sound
//   wrong-3+: keep hint-glow + play 'press-here.mp3'
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['pick'] = (function () {

  // 2800ms — מספיק זמן לכל הרצף לרוץ: צליל-אות (~700ms) → 220ms דממה
  // → שבח רנדומלי (יופי 600ms / מצוין 800ms / מעולה ~1100ms) → buffer.
  // היה 2400ms וגרם ל-cutoff של "מעולה" (F1.3 fix · 27.5).
  const INTER_ROUND_DELAY_MS = 2800;
  const PRAISE_POOL = ['praise-yofi', 'praise-metzuyan', 'praise-mealeh'];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, opts) {
    const letter      = opts.letter;
    const total       = opts.total || 5;
    const distractors = (opts.distractors || []).filter(d => d !== letter);
    const cfg         = opts.mechanicConfig || {};
    const podsPerRound = cfg.podsPerRound || 4;
    const inGamePromptKey = opts.inGamePromptAudioKey || null;

    function playPromptOrLetterSound() {
      if (!window.AvneiAudio) return;
      if (inGamePromptKey) {
        AvneiAudio.play(inGamePromptKey);
      } else {
        AvneiAudio.playLetterSound(letter);
      }
    }

    root.innerHTML = '';
    root.classList.add('mechanic-pick');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    const area = document.createElement('div');
    area.className = 'pick-area';
    root.appendChild(area);

    const state = {
      roundIdx: 0,
      wins: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
      availablePraises: PRAISE_POOL.slice(),
      praiseTimer: null,
      praiseCleanup: null,
    };

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

    function playRightHitAudio(isLastRound) {
      if (!window.AvneiAudio) return;
      cancelPendingPraise();

      const letterKey = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[letter];

      // בסבב האחרון — רק צליל-אות (ה-finale ינגן שבח+אנימציה ייחודית)
      if (isLastRound) {
        if (letterKey) AvneiAudio.play(letterKey);
        return;
      }

      if (!letterKey) {
        AvneiAudio.play(pickNextPraise());
        return;
      }

      AvneiAudio.play(letterKey);
      const letterAudio = AvneiAudio.preload(letterKey);
      const praise = pickNextPraise();
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

    function buildRound() {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      // ⚠️ F1.3 — לא לבטל praise פה. ה-INTER_ROUND_DELAY הגדול דואג לכך
      // שה-praise מסתיים לפני buildRound; ביטול ב-handleTap עוזב מקרים שבהם
      // הילד מקיש על tile בסבב חדש לפני שה-praise הקודם גמר.
      area.innerHTML = '';
      state.locked = false;
      state.attempts = 0;

      const distCount = podsPerRound - 1;
      const pool = shuffle(distractors);
      const dList = [];
      for (let i = 0; i < distCount; i++) {
        dList.push(pool[i % pool.length] || 'ש');
      }
      const letters = shuffle([letter, ...dList]);

      letters.forEach((ltr) => {
        const pod = document.createElement('button');
        pod.type = 'button';
        pod.className = 'pick-pod';
        pod.dataset.letter = ltr;
        pod.dataset.target = (ltr === letter) ? 'true' : 'false';
        pod.setAttribute('aria-label', 'אות ' + ltr);
        const span = document.createElement('span');
        span.className = 'pick-pod__letter';
        span.textContent = ltr;
        pod.appendChild(span);
        pod.addEventListener('click', () => handleTap(pod));
        area.appendChild(pod);
      });

      state.lastShownAt = Date.now();
      if (window.AvneiNoni) AvneiNoni.setState('idle');
      // F1.3 — להשמיע find-X רק בסבב הראשון. בסבבים הבאים — הילד כבר ידע
      // את ההוראה, ו-play() ב-currentAudio יבטל את ה-praise שעוד באוויר.
      // אם הילד תקוע — auto-hint אחרי 9 שניות ינגן את ההוראה שוב.
      if (state.roundIdx === 0 && window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playPromptOrLetterSound, 300);
      }
      state.hintTimer = setTimeout(triggerHint, 9000);
    }

    function triggerHint() {
      state.hintTimer = null;
      if (state.locked) return;
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => {
        p.classList.add('hint-glow');
      });
      playPromptOrLetterSound();
    }

    function handleTap(pod) {
      if (state.locked) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      cancelPendingPraise();

      const isCorrect = (pod.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger) {
        AvneiEventLogger.logActivityResult({
          activity_type: 'rescue',
          target_letter: letter,
          item_id: opts.questId + '-round-' + (state.wins + 1),
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: state.attempts + 1,
          response_time_ms: isCorrect ? responseTime : null,
          hint_used: state.attempts >= 1,
        });
      }

      if (isCorrect) {
        state.locked = true;
        onCorrect(pod);
      } else {
        onWrong(pod);
      }
    }

    function onCorrect(pod) {
      pod.classList.add('picked');
      if (window.AvneiNoni) AvneiNoni.setState('cheer');

      const isLastRound = (state.wins + 1) >= total;
      playRightHitAudio(isLastRound);

      if (typeof addPearl === 'function') addPearl(1);

      opts.onUnitWon && opts.onUnitWon(state.wins);
      state.wins++;

      setTimeout(() => {
        if (state.wins >= total) {
          opts.onComplete && opts.onComplete();
        } else {
          state.roundIdx++;
          setTimeout(buildRound, INTER_ROUND_DELAY_MS - 1100);
        }
      }, 1100);
    }

    function onWrong(pod) {
      state.attempts++;
      pod.classList.add('wrong-sway');
      setTimeout(() => pod.classList.remove('wrong-sway'), 700);

      if (state.attempts === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => {
          p.classList.add('hint-glow');
        });
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.playLetterSound(letter), 400);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => {
          p.classList.add('hint-glow');
        });
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 400);
      }
    }

    buildRound();

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        cancelPendingPraise();
        root.innerHTML = '';
        root.classList.remove('mechanic-pick');
      },
    };
  }

  return { mount };
})();
